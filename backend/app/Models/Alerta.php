<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alerta extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'camion_id',
        'tipo',
        'severidad',
        'titulo',
        'mensaje',
        'lat',
        'lng',
        'zona_nombre',
        'estado_anterior',
        'estado_nuevo',
        'contexto',
        'timestamp',
        'leida_at',
        'leida_por_user_id',
        'created_at',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'contexto' => 'array',
        'timestamp' => 'datetime',
        'leida_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function camion(): BelongsTo
    {
        return $this->belongsTo(Camion::class, 'camion_id');
    }

    public function leidaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leida_por_user_id');
    }
}
