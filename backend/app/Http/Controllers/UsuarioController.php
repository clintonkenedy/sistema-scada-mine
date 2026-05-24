<?php

namespace App\Http\Controllers;

use App\Http\Requests\AsignarRolUsuarioRequest;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\QueryBuilder\Filters\RangeFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UsuarioController extends Controller
{
    /**
     * Listado paginado de usuarios con filtros, ordenamiento y paginación.
     * Excluye usuarios con rol developer del listado.
     * Usa Spatie Laravel Query Builder para filtros y sorts vía JSON:API.
     */
    public function index(): AnonymousResourceCollection
    {
        $base = User::query()
            ->with('roles', 'permissions')
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'developer'));

        $usuarios = QueryBuilder::for($base)
            ->allowedFilters([
                AllowedFilter::callback('search', function (Builder $q, $value) {
                    $q->where(function (Builder $sub) use ($value) {
                        $like = "%{$value}%";
                        $sub->where('name', 'like', $like)
                            ->orWhere('email', 'like', $like)
                            ->orWhere('dni', 'like', $like)
                            ->orWhere('nombres', 'like', $like)
                            ->orWhere('apellido_paterno', 'like', $like)
                            ->orWhere('apellido_materno', 'like', $like);
                    });
                }),
                AllowedFilter::exact('activo'),
                AllowedFilter::callback(
                    'rol',
                    fn (Builder $q, $value) => $q->whereHas('roles', fn (Builder $r) => $r->where('name', $value))
                ),
                AllowedFilter::callback('created_from', RangeFilters::dateFrom('users.created_at')),
                AllowedFilter::callback('created_to', RangeFilters::dateTo('users.created_at')),
            ])
            ->allowedSorts(['name', 'email', 'dni', 'created_at'])
            ->defaultSort('name')
            ->paginate((int) request()->input('per_page', 15));

        return UsuarioResource::collection($usuarios);
    }

    /**
     * Crear un nuevo usuario y asignarle un rol opcional.
     */
    public function store(StoreUsuarioRequest $request): JsonResponse
    {
        $datos = $request->validated();

        // Si no se envía activo, se asigna true por defecto
        if (! isset($datos['activo'])) {
            $datos['activo'] = true;
        }

        // Extraer el rol antes de crear el usuario — no es campo del modelo
        $rol = $datos['rol'] ?? null;
        unset($datos['rol']);

        $usuario = User::create($datos);

        if ($rol !== null) {
            $usuario->assignRole($rol);
        }

        return (new UsuarioResource($usuario->refresh()->load('roles', 'permissions')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Mostrar un usuario individual con sus roles y permisos.
     */
    public function show(User $usuario): UsuarioResource
    {
        $usuario->load('roles', 'permissions');

        return new UsuarioResource($usuario);
    }

    /**
     * Actualizar los datos de un usuario existente.
     * Solo actualiza los campos que se envían en el request.
     */
    public function update(UpdateUsuarioRequest $request, User $usuario): UsuarioResource
    {
        $datos = $request->validated();

        // Si password viene vacío o null, no lo actualizar
        if (empty($datos['password'])) {
            unset($datos['password']);
        }

        $usuario->update($datos);

        return new UsuarioResource($usuario->refresh()->load('roles', 'permissions'));
    }

    /**
     * Eliminar un usuario (soft delete).
     * Bloquea: auto-eliminación y eliminación del usuario developer.
     */
    public function destroy(User $usuario): JsonResponse|Response
    {
        if ($usuario->id === auth()->id()) {
            return response()->json([
                'message' => 'No podés eliminar tu propio usuario.',
            ], 422);
        }

        if ($usuario->hasRole('developer')) {
            return response()->json([
                'message' => 'No podés eliminar el usuario developer.',
            ], 422);
        }

        $usuario->delete();

        return response()->noContent();
    }

    /**
     * Asignar un rol a un usuario (syncRoles — reemplaza el rol existente).
     * Bloquea auto-modificación de rol.
     */
    public function asignarRol(AsignarRolUsuarioRequest $request, User $usuario): JsonResponse|UsuarioResource
    {
        if ($usuario->id === auth()->id()) {
            return response()->json([
                'message' => 'No podés modificar el rol de tu propio usuario.',
            ], 422);
        }

        $usuario->syncRoles([$request->validated('rol')]);

        return new UsuarioResource($usuario->refresh()->load('roles', 'permissions'));
    }

    /**
     * Invertir el estado activo de un usuario.
     * Bloquea: auto-desactivación y toggle del usuario developer.
     */
    public function toggleActivo(User $usuario): JsonResponse|UsuarioResource
    {
        if ($usuario->id === auth()->id()) {
            return response()->json([
                'message' => 'No podés desactivar tu propio usuario.',
            ], 422);
        }

        if ($usuario->hasRole('developer')) {
            return response()->json([
                'message' => 'No podés modificar el estado del usuario developer.',
            ], 422);
        }

        $usuario->update(['activo' => ! $usuario->activo]);

        return new UsuarioResource($usuario->refresh()->load('roles', 'permissions'));
    }
}
