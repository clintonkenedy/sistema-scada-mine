<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlertaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'camion' => [
                'id' => $this->camion_id,
                'codigo' => $this->whenLoaded('camion', fn () => $this->camion->codigo),
                'es_real' => $this->whenLoaded('camion', fn () => $this->camion->es_real),
            ],
            'tipo' => $this->tipo,
            'severidad' => $this->severidad,
            'titulo' => $this->titulo,
            'mensaje' => $this->mensaje,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'zona_nombre' => $this->zona_nombre,
            'estado_anterior' => $this->estado_anterior,
            'estado_nuevo' => $this->estado_nuevo,
            'contexto' => $this->contexto,
            'timestamp' => $this->timestamp?->toIso8601String(),
            'leida' => $this->leida_at !== null,
            'leida_at' => $this->leida_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
