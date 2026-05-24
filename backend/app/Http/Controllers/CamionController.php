<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCamionRequest;
use App\Http\Requests\UpdateCamionRequest;
use App\Http\Resources\CamionResource;
use App\Models\Camion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CamionController extends Controller
{
    /**
     * Listado paginado de camiones con filtros, ordenamiento y paginación.
     * Usa Spatie Laravel Query Builder para filtros y sorts vía JSON:API.
     */
    public function index(): AnonymousResourceCollection
    {
        $camiones = QueryBuilder::for(Camion::class)
            ->allowedFilters([
                AllowedFilter::partial('codigo'),
                AllowedFilter::partial('patente'),
                AllowedFilter::partial('modelo'),
                AllowedFilter::exact('estado_actual'),
                AllowedFilter::exact('activo'),
                AllowedFilter::exact('es_real'),
            ])
            ->allowedSorts(['codigo', 'modelo', 'capacidad_toneladas', 'created_at'])
            ->defaultSort('codigo')
            ->paginate((int) request()->input('per_page', 15));

        return CamionResource::collection($camiones);
    }

    /**
     * Crear un nuevo camión.
     */
    public function store(StoreCamionRequest $request): JsonResponse
    {
        $datos = $request->validated();

        if (! isset($datos['activo'])) {
            $datos['activo'] = true;
        }

        $camion = Camion::create($datos);

        return (new CamionResource($camion->refresh()))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Mostrar un camión individual.
     */
    public function show(Camion $camion): CamionResource
    {
        return new CamionResource($camion);
    }

    /**
     * Actualizar los datos de un camión existente.
     * Solo actualiza los campos que se envían en el request.
     */
    public function update(UpdateCamionRequest $request, Camion $camion): CamionResource
    {
        $camion->update($request->validated());

        return new CamionResource($camion->refresh());
    }

    /**
     * Eliminar un camión (soft delete).
     */
    public function destroy(Camion $camion): Response
    {
        $camion->delete();

        return response()->noContent();
    }

    /**
     * Invertir el estado activo del camión.
     */
    public function toggleActivo(Camion $camion): CamionResource
    {
        $camion->update(['activo' => ! $camion->activo]);

        return new CamionResource($camion->refresh());
    }
}
