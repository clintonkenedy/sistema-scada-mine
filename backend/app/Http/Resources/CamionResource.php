<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CamionResource extends JsonResource
{
    /**
     * Transforma el modelo Camion en un array JSON.
     * Whitelist estricta — solo expone campos seguros del dominio.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'patente' => $this->patente,
            'modelo' => $this->modelo,
            'capacidad_toneladas' => $this->capacidad_toneladas,
            'estado_actual' => $this->estado_actual,
            'activo' => $this->activo,
            'es_real' => $this->es_real,
            'ultima_lat' => $this->ultima_lat,
            'ultima_lng' => $this->ultima_lng,
            'ultima_actualizacion' => $this->ultima_actualizacion?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
