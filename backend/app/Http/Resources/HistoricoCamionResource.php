<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HistoricoCamionResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'camion' => [
                'id' => $this->resource['camion']->id,
                'codigo' => $this->resource['camion']->codigo,
                'es_real' => $this->resource['camion']->es_real,
            ],
            'ventana' => $this->resource['ventana'],
            'desde' => $this->resource['desde']->toIso8601String(),
            'hasta' => $this->resource['hasta']->toIso8601String(),
            'agregados' => $this->resource['agregados'],
            'series' => $this->resource['series'],
        ];
    }
}
