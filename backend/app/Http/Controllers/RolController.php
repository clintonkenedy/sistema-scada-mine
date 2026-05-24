<?php

namespace App\Http\Controllers;

use App\Http\Requests\AsignarPermisosRolRequest;
use App\Http\Requests\StoreRolRequest;
use App\Http\Requests\UpdateRolRequest;
use App\Http\Resources\RolResource;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Permission\Models\Role;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RolController extends Controller
{
    /**
     * Listado paginado de roles con filtros y ordenamiento via Spatie Query Builder.
     */
    public function index(): AnonymousResourceCollection
    {
        $roles = QueryBuilder::for(Role::query()->with('permissions'))
            ->allowedFilters([
                AllowedFilter::callback('search', fn (Builder $q, $value) => $q->where('name', 'like', "%{$value}%")
                ),
                AllowedFilter::callback('es_inicial', function (Builder $q, $value) {
                    $iniciales = RolesYPermisosSeeder::rolesIniciales();
                    filter_var($value, FILTER_VALIDATE_BOOLEAN)
                        ? $q->whereIn('name', $iniciales)
                        : $q->whereNotIn('name', $iniciales);
                }),
                AllowedFilter::callback('tiene_usuarios', function (Builder $q, $value) {
                    $tablaRoles = config('permission.table_names.model_has_roles', 'model_has_roles');
                    $morphKey = config('permission.column_names.model_morph_key', 'model_id');
                    $subquery = User::query()
                        ->join($tablaRoles, "{$tablaRoles}.{$morphKey}", '=', 'users.id')
                        ->where("{$tablaRoles}.model_type", User::class)
                        ->whereColumn("{$tablaRoles}.role_id", 'roles.id')
                        ->select("{$tablaRoles}.role_id");

                    filter_var($value, FILTER_VALIDATE_BOOLEAN)
                        ? $q->whereExists($subquery->toBase())
                        : $q->whereNotExists($subquery->toBase());
                }),
            ])
            ->allowedSorts(['name', 'created_at'])
            ->defaultSort('name')
            ->paginate((int) request()->input('per_page', 15));

        return RolResource::collection($roles);
    }

    /**
     * Crear un nuevo rol con guard web.
     */
    public function store(StoreRolRequest $request): JsonResponse
    {
        $rol = Role::create([
            'name' => $request->input('name'),
            'guard_name' => 'web',
        ]);

        $rol->load('permissions');

        return (new RolResource($rol))->response()->setStatusCode(201);
    }

    /**
     * Mostrar un rol con sus permisos cargados.
     */
    public function show(Role $rol): RolResource
    {
        $rol->load('permissions');

        return new RolResource($rol);
    }

    /**
     * Actualizar el nombre de un rol.
     * Bloquea si el rol es inicial (no renombrable).
     */
    public function update(UpdateRolRequest $request, Role $rol): JsonResponse
    {
        if (in_array($rol->name, RolesYPermisosSeeder::rolesIniciales(), true)) {
            return response()->json([
                'message' => "El rol '{$rol->name}' es un rol inicial del sistema y no puede ser renombrado.",
            ], 422);
        }

        $rol->update(['name' => $request->input('name')]);
        $rol->load('permissions');

        return (new RolResource($rol))->response();
    }

    /**
     * Sincronizar los permisos de un rol (reemplaza todos — no añade).
     * Pasar array vacío quita todos los permisos.
     */
    public function asignarPermisos(AsignarPermisosRolRequest $request, Role $rol): JsonResponse
    {
        $rol->syncPermissions($request->input('permisos'));

        // Limpiar cache de Spatie para que los cambios tengan efecto inmediatamente
        $cacheStore = config('permission.cache.store') !== 'default'
            ? config('permission.cache.store')
            : null;

        app('cache')
            ->store($cacheStore)
            ->forget(config('permission.cache.key'));

        $rol->load('permissions');

        return (new RolResource($rol))->response();
    }

    /**
     * Eliminar un rol.
     * Bloquea si es inicial o si tiene usuarios asignados.
     */
    public function destroy(Role $rol): JsonResponse
    {
        if (in_array($rol->name, RolesYPermisosSeeder::rolesIniciales(), true)) {
            return response()->json([
                'message' => "El rol '{$rol->name}' es un rol inicial del sistema y no puede ser eliminado.",
            ], 422);
        }

        $cantidadUsuarios = $rol->users()->count();

        if ($cantidadUsuarios > 0) {
            return response()->json([
                'message' => "No se puede eliminar el rol '{$rol->name}' porque tiene {$cantidadUsuarios} usuario(s) asignado(s).",
            ], 422);
        }

        $rol->delete();

        return response()->json(null, 204);
    }
}
