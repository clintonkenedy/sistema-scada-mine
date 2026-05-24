<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosicionCamion extends Model
{
    /**
     * Tabla time-series de posiciones GPS de camiones.
     * No usamos timestamps automáticos — `created_at` se setea por DB default,
     * `timestamp` lo provee el productor (sensor / API Python).
     */
    protected $table = 'posiciones_camion';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'camion_id',
        'lat',
        'lng',
        'velocidad_kmh',
        'rumbo_grados',
        'carga_actual_toneladas',
        'combustible_porcentaje',
        'estado',
        'ruta_actual',
        'timestamp',
        'created_at',
        'calidad_gps',
        'satelites',
        'roll_grados',
        'pitch_grados',
        'tolva_cerrada',
        'salud_via',
        'temperatura_motor',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'velocidad_kmh' => 'float',
            'rumbo_grados' => 'float',
            'carga_actual_toneladas' => 'float',
            'combustible_porcentaje' => 'float',
            'timestamp' => 'datetime',
            'created_at' => 'datetime',
            'calidad_gps' => 'integer',
            'satelites' => 'integer',
            'roll_grados' => 'float',
            'pitch_grados' => 'float',
            'tolva_cerrada' => 'boolean',
            'salud_via' => 'integer',
            'temperatura_motor' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Camion, $this>
     */
    public function camion(): BelongsTo
    {
        return $this->belongsTo(Camion::class, 'camion_id');
    }
}
