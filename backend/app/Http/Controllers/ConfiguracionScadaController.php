<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActualizarConfiguracionRequest;
use App\Http\Resources\ConfiguracionScadaResource;
use App\Models\ConfiguracionScada;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ConfiguracionScadaController extends Controller
{
    /**
     * Listado completo de parámetros de configuración SCADA.
     * No paginado — el set es chico y siempre se consume entero.
     */
    public function index(): AnonymousResourceCollection
    {
        $configuraciones = ConfiguracionScada::query()
            ->with('modificadoPor')
            ->orderBy('clave')
            ->get();

        return ConfiguracionScadaResource::collection($configuraciones);
    }

    /**
     * Mostrar un parámetro individual identificado por su `clave`.
     */
    public function show(string $clave): ConfiguracionScadaResource
    {
        $configuracion = $this->buscarPorClave($clave);

        $configuracion->load('modificadoPor');

        return new ConfiguracionScadaResource($configuracion);
    }

    /**
     * Actualizar el valor de un parámetro existente.
     * Solo se modifican `valor` y `modificado_por` — el resto del registro es inmutable.
     */
    public function update(ActualizarConfiguracionRequest $request, string $clave): ConfiguracionScadaResource
    {
        $configuracion = $this->buscarPorClave($clave);

        $configuracion->update([
            'valor' => $request->validated('valor'),
            'modificado_por' => auth()->id(),
        ]);

        return new ConfiguracionScadaResource($configuracion->refresh()->load('modificadoPor'));
    }

    /**
     * Resuelve el modelo por `clave` o lanza 404.
     */
    private function buscarPorClave(string $clave): ConfiguracionScada
    {
        $configuracion = ConfiguracionScada::where('clave', $clave)->first();

        if ($configuracion === null) {
            throw new NotFoundHttpException("No existe la configuración con clave '{$clave}'.");
        }

        return $configuracion;
    }
}
