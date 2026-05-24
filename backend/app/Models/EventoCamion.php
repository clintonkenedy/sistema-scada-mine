<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventoCamion extends Model
{
    /**
     * Tabla de transiciones de estado de camiones.
     * Solo se inserta cuando cambia el estado_actual.
     */
    protected $table = 'eventos_camion';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'camion_id',
        'estado_anterior',
        'estado_nuevo',
        'lat',
        'lng',
        'ruta_actual',
        'timestamp',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'timestamp' => 'datetime',
            'created_at' => 'datetime',
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
