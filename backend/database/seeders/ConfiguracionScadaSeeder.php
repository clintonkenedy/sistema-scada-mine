<?php

namespace Database\Seeders;

use App\Models\ConfiguracionScada;
use Illuminate\Database\Seeder;

class ConfiguracionScadaSeeder extends Seeder
{
    /**
     * Carga los parámetros canónicos del sistema SCADA.
     * Idempotente — usa updateOrCreate por `clave`.
     */
    public function run(): void
    {
        $defaults = [
            [
                'clave' => 'tiempo_muerto_minutos',
                'valor' => '5',
                'tipo' => 'entero',
                'descripcion' => 'Minutos sin movimiento (afuera de zonas operativas) para marcar un camion como tiempo muerto / en cola.',
                'unidad' => 'min',
                'minimo' => 1,
                'maximo' => 60,
            ],
            [
                'clave' => 'velocidad_parado_kmh',
                'valor' => '2',
                'tipo' => 'decimal',
                'descripcion' => 'Velocidad por debajo de la cual se considera al camion como parado (km/h).',
                'unidad' => 'km/h',
                'minimo' => 0.1,
                'maximo' => 10,
            ],
            [
                'clave' => 'tiempo_minimo_zona_segundos',
                'valor' => '15',
                'tipo' => 'entero',
                'descripcion' => 'Segundos minimos que un camion debe estar dentro de una zona operativa (con velocidad baja) para que se le asigne el estado de esa zona.',
                'unidad' => 's',
                'minimo' => 1,
                'maximo' => 300,
            ],
            [
                'clave' => 'simulador_speed_multiplier',
                'valor' => '1.0',
                'tipo' => 'decimal',
                'descripcion' => 'Multiplicador de velocidad de simulacion. 1.0 = tiempo real. 10.0 = 10x mas rapido. Solo aplica al simulador, no a sensores reales.',
                'unidad' => 'x',
                'minimo' => 0.1,
                'maximo' => 100,
            ],
            [
                'clave' => 'modo_operacion',
                'valor' => 'simulacion',
                'tipo' => 'texto',
                'descripcion' => 'Modo de operación del sistema. "simulacion" mueve los 10 camiones por el GeoJSON. "real" conecta a un WebSocket externo (ESP32) y solo muestra el camión REAL-01.',
                'unidad' => null,
                'minimo' => null,
                'maximo' => null,
            ],
            [
                'clave' => 'url_websocket_real',
                'valor' => 'ws://localhost:8766',
                'tipo' => 'texto',
                'descripcion' => 'URL del WebSocket externo que emite coordenadas GPS del vehículo real. Formato esperado del mensaje: {"type":"line","data":"TELEMETRÍA RECIBIDA [GNSS] -> Lat: X | Lon: Y"}.',
                'unidad' => null,
                'minimo' => null,
                'maximo' => null,
            ],
        ];

        foreach ($defaults as $cfg) {
            ConfiguracionScada::updateOrCreate(
                ['clave' => $cfg['clave']],
                $cfg,
            );
        }
    }
}
