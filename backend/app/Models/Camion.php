<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Camion extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Tabla maestra de camiones de la mina.
     */
    protected $table = 'camiones';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'codigo',
        'patente',
        'modelo',
        'capacidad_toneladas',
        'estado_actual',
        'activo',
        'es_real',
        'ultima_lat',
        'ultima_lng',
        'ultima_actualizacion',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'capacidad_toneladas' => 'decimal:2',
            'activo' => 'boolean',
            'es_real' => 'boolean',
            'ultima_actualizacion' => 'datetime',
            'ultima_lat' => 'float',
            'ultima_lng' => 'float',
        ];
    }

    /**
     * Histórico de posiciones GPS del camión (time-series).
     *
     * @return HasMany<PosicionCamion, $this>
     */
    public function posiciones(): HasMany
    {
        return $this->hasMany(PosicionCamion::class, 'camion_id');
    }

    /**
     * Transiciones de estado del camión.
     *
     * @return HasMany<EventoCamion, $this>
     */
    public function eventos(): HasMany
    {
        return $this->hasMany(EventoCamion::class, 'camion_id');
    }

    /**
     * Última posición conocida (la más reciente por timestamp).
     *
     * @return HasOne<PosicionCamion, $this>
     */
    public function ultimaPosicion(): HasOne
    {
        return $this->hasOne(PosicionCamion::class, 'camion_id')
            ->latestOfMany('timestamp');
    }
}
