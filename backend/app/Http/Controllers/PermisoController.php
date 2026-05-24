<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePermisoRequest;
use App\Http\Requests\UpdatePermisoRequest;
use App\Http\Resources\PermisoResource;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Permission\Models\Permission;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PermisoController extends Controller
{
    /**
     * Listado paginado de permisos con filtros y ordenamiento via Spatie Query Builder.
     * La base query siempre filtra por guard_name='web'.
     */
    public function index(): AnonymousResourceCollection
    {
        $base = Permission::query()->where('guard_name', 'web');

        $permisos = QueryBuilder::for($base)
            ->allowedFilters([
                AllowedFilter::callback('search', fn (Builder $q, $value) => $q->where('name', 'like', "%{$value}%")
                ),
                AllowedFilter::callback('modulo', function (Builder $q, $value) {
                    $modulo = strtolower(trim((string) $value));
                    if ($modulo !== '') {
                        $q->where('name', 'like', "{$modulo}.%");
                    }
                }),
                AllowedFilter::callback('es_canonico', function (Builder $q, $value) {
                    $canonicos = RolesYPermisosSeeder::permisosCanonicos();
                    filter_var($value, FILTER_VALIDATE_BOOLEAN)
                        ? $q->whereIn('name', $canonicos)
                        : $q->whereNotIn('name', $canonicos);
                }),
            ])
            ->allowedSorts(['name', 'created_at'])
            ->defaultSort('name')
            ->paginate((int) request()->input('per_page', 15));

        return PermisoResource::collection($permisos);
    }

    /**
     * Crea un nuevo permiso.
     */
    public function store(StorePermisoRequest $request): PermisoResource
    {
        $permiso = Permission::create([
            'name' => $request->string('name')->lower()->value(),
            'guard_name' => 'web',
        ]);

        return new PermisoResource($permiso);
    }

    /**
     * Muestra un permiso específico.
     */
    public function show(Permission $permiso): PermisoResource
    {
        return new PermisoResource($permiso);
    }

    /**
     * Actualiza un permiso existente.
     * Los permisos canónicos están protegidos contra renombrado.
     */
    public function update(UpdatePermisoRequest $request, Permission $permiso): PermisoResource
    {
        $permiso->update([
            'name' => $request->string('name')->lower()->value(),
        ]);

        return new PermisoResource($permiso->fresh());
    }

    /**
     * Elimina un permiso.
     * Bloquea si es canónico o si está asignado a algún rol.
     */
    public function destroy(Permission $permiso): JsonResponse
    {
        if (in_array($permiso->name, RolesYPermisosSeeder::permisosCanonicos(), true)) {
            return response()->json([
                'message' => "El permiso \"{$permiso->name}\" es canónico del sistema y no puede ser eliminado.",
            ], 422);
        }

        $cantidadRoles = $permiso->roles()->count();

        if ($cantidadRoles > 0) {
            return response()->json([
                'message' => "El permiso \"{$permiso->name}\" está asignado a {$cantidadRoles} ".
                    ($cantidadRoles === 1 ? 'rol' : 'roles').' y no puede ser eliminado.',
            ], 422);
        }

        $permiso->delete();

        return response()->json(null, 204);
    }
}
