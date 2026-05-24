<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConfiguracionScadaResource extends JsonResource
{
    /**
     * Transforma el modelo ConfiguracionScada en su representación JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'clave' => $this->clave,
            'valor' => $this->valor,
            'valor_tipado' => $this->valorTipado(),
            'tipo' => $this->tipo,
            'descripcion' => $this->descripcion,
            'unidad' => $this->unidad,
            'minimo' => $this->minimo,
            'maximo' => $this->maximo,
            'modificado_por' => $this->whenLoaded('modificadoPor', fn () => $this->modificadoPor ? [
                'id' => $this->modificadoPor->id,
                'nombre' => trim($this->modificadoPor->nombres.' '.$this->modificadoPor->apellido_paterno),
            ] : null),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
