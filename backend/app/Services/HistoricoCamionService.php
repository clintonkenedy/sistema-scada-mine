<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PosicionCamion;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class HistoricoCamionService
{
    /**
     * Devuelve métricas agregadas en la ventana [desde, hasta].
     */
    public function obtenerAgregados(int $camionId, CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $base = PosicionCamion::where('camion_id', $camionId)
            ->whereBetween('timestamp', [$desde, $hasta]);

        $stats = (clone $base)
            ->selectRaw('
                AVG(velocidad_kmh) as velocidad_promedio,
                MAX(velocidad_kmh) as velocidad_maxima,
                AVG(temperatura_motor) as temp_motor_promedio,
                MAX(temperatura_motor) as temp_motor_maxima,
                AVG(salud_via) as salud_via_promedio,
                MIN(salud_via) as salud_via_minima,
                AVG(combustible_porcentaje) as combustible_promedio,
                MAX(carga_actual_toneladas) as carga_maxima,
                COUNT(*) as total_puntos
            ')
            ->first();

        // Tiempo por estado (en puntos — aproxima segundos según frecuencia del productor).
        $tiempoPorEstado = (clone $base)
            ->selectRaw('estado, COUNT(*) as puntos')
            ->groupBy('estado')
            ->pluck('puntos', 'estado')
            ->toArray();

        // SQL crudo JUSTIFICADO: window function LAG() para distancia haversine
        // entre puntos consecutivos. Eloquent no soporta window functions de forma
        // limpia. Se usa PostGIS ST_DistanceSphere sobre los pares (prev, actual).
        $distanciaMetros = DB::scalar('
            SELECT COALESCE(SUM(
                ST_DistanceSphere(
                    ST_MakePoint(lng_prev, lat_prev),
                    ST_MakePoint(lng, lat)
                )
            ), 0)
            FROM (
                SELECT
                    lat, lng,
                    LAG(lat) OVER (ORDER BY timestamp) AS lat_prev,
                    LAG(lng) OVER (ORDER BY timestamp) AS lng_prev
                FROM posiciones_camion
                WHERE camion_id = ?
                  AND timestamp BETWEEN ? AND ?
            ) sub
            WHERE lat_prev IS NOT NULL
        ', [$camionId, $desde, $hasta]);

        // Cambios de estado: cuenta de transiciones registradas.
        $cambiosEstado = DB::table('eventos_camion')
            ->where('camion_id', $camionId)
            ->whereBetween('timestamp', [$desde, $hasta])
            ->count();

        // Vueltas completadas: cada transición a "descargando" se cuenta como una vuelta.
        $vueltasCompletadas = DB::table('eventos_camion')
            ->where('camion_id', $camionId)
            ->whereBetween('timestamp', [$desde, $hasta])
            ->where('estado_nuevo', 'descargando')
            ->count();

        return [
            'velocidad_promedio_kmh' => round((float) ($stats?->velocidad_promedio ?? 0), 2),
            'velocidad_maxima_kmh' => round((float) ($stats?->velocidad_maxima ?? 0), 2),
            'temp_motor_promedio' => $stats?->temp_motor_promedio !== null
                ? (int) round((float) $stats->temp_motor_promedio)
                : null,
            'temp_motor_maxima' => $stats?->temp_motor_maxima !== null
                ? (int) $stats->temp_motor_maxima
                : null,
            'salud_via_promedio' => $stats?->salud_via_promedio !== null
                ? (int) round((float) $stats->salud_via_promedio)
                : null,
            'salud_via_minima' => $stats?->salud_via_minima !== null
                ? (int) $stats->salud_via_minima
                : null,
            'combustible_promedio' => round((float) ($stats?->combustible_promedio ?? 0), 2),
            'carga_maxima_toneladas' => round((float) ($stats?->carga_maxima ?? 0), 2),
            'total_puntos' => (int) ($stats?->total_puntos ?? 0),
            'tiempo_por_estado' => $tiempoPorEstado,
            'distancia_metros' => (int) round((float) $distanciaMetros),
            'cambios_estado' => $cambiosEstado,
            'vueltas_completadas' => $vueltasCompletadas,
        ];
    }

    /**
     * Devuelve series time-bucketed.
     * Bucket adaptativo: <=1h => 1min, <=6h => 5min, <=24h => 15min.
     */
    public function obtenerSeries(int $camionId, CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $minutos = (int) round($desde->diffInMinutes($hasta));
        if ($minutos <= 60) {
            $bucketSec = 60;
        } elseif ($minutos <= 360) {
            $bucketSec = 300;
        } else {
            $bucketSec = 900;
        }

        // SQL crudo JUSTIFICADO: time-bucketing por epoch / bucket. Eloquent no
        // expresa esto de forma legible sin ensuciar el query builder.
        $rows = DB::select('
            SELECT
                to_timestamp(floor(extract(epoch from timestamp) / ?) * ?) AS bucket,
                AVG(velocidad_kmh) AS velocidad,
                AVG(temperatura_motor) AS temp_motor,
                AVG(salud_via) AS salud_via,
                AVG(calidad_gps) AS calidad_gps,
                AVG(combustible_porcentaje) AS combustible,
                AVG(carga_actual_toneladas) AS carga
            FROM posiciones_camion
            WHERE camion_id = ?
              AND timestamp BETWEEN ? AND ?
            GROUP BY bucket
            ORDER BY bucket ASC
        ', [$bucketSec, $bucketSec, $camionId, $desde, $hasta]);

        $velocidad = [];
        $tempMotor = [];
        $saludVia = [];
        $calidadGps = [];
        $combustible = [];
        $carga = [];

        foreach ($rows as $r) {
            $ts = (string) $r->bucket;
            $velocidad[] = ['ts' => $ts, 'valor' => $r->velocidad !== null ? round((float) $r->velocidad, 2) : null];
            $tempMotor[] = ['ts' => $ts, 'valor' => $r->temp_motor !== null ? (int) round((float) $r->temp_motor) : null];
            $saludVia[] = ['ts' => $ts, 'valor' => $r->salud_via !== null ? (int) round((float) $r->salud_via) : null];
            $calidadGps[] = ['ts' => $ts, 'valor' => $r->calidad_gps !== null ? round((float) $r->calidad_gps, 1) : null];
            $combustible[] = ['ts' => $ts, 'valor' => $r->combustible !== null ? round((float) $r->combustible, 2) : null];
            $carga[] = ['ts' => $ts, 'valor' => $r->carga !== null ? round((float) $r->carga, 2) : null];
        }

        return [
            'bucket_segundos' => $bucketSec,
            'velocidad' => $velocidad,
            'temperatura_motor' => $tempMotor,
            'salud_via' => $saludVia,
            'calidad_gps' => $calidadGps,
            'combustible' => $combustible,
            'carga' => $carga,
        ];
    }
}
