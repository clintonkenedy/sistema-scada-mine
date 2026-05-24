<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionScada extends Model
{
    /**
     * Tabla de configuración key-value del sistema SCADA.
     */
    protected $table = 'configuracion_scada';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'clave',
        'valor',
        'tipo',
        'descripcion',
        'unidad',
        'minimo',
        'maximo',
        'modificado_por',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'minimo' => 'float',
            'maximo' => 'float',
        ];
    }

    /**
     * Usuario que realizó la última modificación del parámetro.
     *
     * @return BelongsTo<User, $this>
     */
    public function modificadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modificado_por');
    }

    /**
     * Devuelve el valor convertido al tipo declarado por la columna `tipo`.
     * Útil para clientes que necesitan el valor ya parseado (ej. simulador Python).
     */
    public function valorTipado(): mixed
    {
        return match ($this->tipo) {
            'entero' => (int) $this->valor,
            'decimal' => (float) $this->valor,
            'booleano' => filter_var($this->valor, FILTER_VALIDATE_BOOLEAN),
            default => $this->valor,
        };
    }
}
