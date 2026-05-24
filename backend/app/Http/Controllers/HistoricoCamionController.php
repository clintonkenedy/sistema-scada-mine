<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ObtenerHistoricoCamionRequest;
use App\Http\Resources\HistoricoCamionResource;
use App\Models\Camion;
use App\Services\HistoricoCamionService;
use Carbon\CarbonImmutable;

class HistoricoCamionController extends Controller
{
    public function __construct(private readonly HistoricoCamionService $servicio) {}

    public function __invoke(ObtenerHistoricoCamionRequest $request, Camion $camion): HistoricoCamionResource
    {
        $ahora = CarbonImmutable::now();
        $ventana = $request->string('ventana', '1h')->toString();

        $minutos = match ($ventana) {
            '5min' => 5,
            '1h' => 60,
            '6h' => 360,
            '24h' => 1440,
            default => 60,
        };

        // Si vienen desde/hasta explícitos los priorizamos; sino, ventana relativa a ahora.
        $hasta = $request->filled('hasta')
            ? CarbonImmutable::parse($request->string('hasta')->toString())
            : $ahora;
        $desde = $request->filled('desde')
            ? CarbonImmutable::parse($request->string('desde')->toString())
            : $hasta->subMinutes($minutos);

        $agregados = $this->servicio->obtenerAgregados($camion->id, $desde, $hasta);
        $series = $this->servicio->obtenerSeries($camion->id, $desde, $hasta);

        return new HistoricoCamionResource([
            'camion' => $camion,
            'ventana' => $ventana,
            'desde' => $desde,
            'hasta' => $hasta,
            'agregados' => $agregados,
            'series' => $series,
        ]);
    }
}
