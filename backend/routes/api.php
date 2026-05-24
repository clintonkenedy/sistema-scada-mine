<?php

use App\Http\Controllers\PermisoController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\UsuarioController;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/usuario', function (Request $request) {
    return new UsuarioResource($request->user());
})->middleware('auth:sanctum');

// Gestión de usuarios
Route::middleware(['auth:sanctum'])->prefix('usuarios')->group(function () {
    Route::get('/', [UsuarioController::class, 'index'])
        ->middleware('permission:usuarios.ver');

    Route::post('/', [UsuarioController::class, 'store'])
        ->middleware('permission:usuarios.crear');

    Route::get('/{usuario}', [UsuarioController::class, 'show'])
        ->middleware('permission:usuarios.ver');

    Route::put('/{usuario}', [UsuarioController::class, 'update'])
        ->middleware('permission:usuarios.editar');

    Route::patch('/{usuario}', [UsuarioController::class, 'update'])
        ->middleware('permission:usuarios.editar');

    Route::delete('/{usuario}', [UsuarioController::class, 'destroy'])
        ->middleware('permission:usuarios.eliminar');

    Route::post('/{usuario}/rol', [UsuarioController::class, 'asignarRol'])
        ->middleware('permission:usuarios.asignar_rol');

    Route::post('/{usuario}/toggle-activo', [UsuarioController::class, 'toggleActivo'])
        ->middleware('permission:usuarios.toggle_activo');
});

// Gestión de permisos
Route::middleware(['auth:sanctum'])->prefix('permisos')->group(function () {
    Route::get('/', [PermisoController::class, 'index'])
        ->middleware('permission:permisos.ver');

    Route::post('/', [PermisoController::class, 'store'])
        ->middleware('permission:permisos.crear');

    Route::get('/{permiso}', [PermisoController::class, 'show'])
        ->middleware('permission:permisos.ver');

    Route::put('/{permiso}', [PermisoController::class, 'update'])
        ->middleware('permission:permisos.editar');

    Route::patch('/{permiso}', [PermisoController::class, 'update'])
        ->middleware('permission:permisos.editar');

    Route::delete('/{permiso}', [PermisoController::class, 'destroy'])
        ->middleware('permission:permisos.eliminar');
});

// Gestión de roles
Route::middleware(['auth:sanctum'])->prefix('roles')->group(function () {
    Route::get('/', [RolController::class, 'index'])
        ->middleware('permission:roles.ver');

    Route::post('/', [RolController::class, 'store'])
        ->middleware('permission:roles.crear');

    Route::get('/{rol}', [RolController::class, 'show'])
        ->middleware('permission:roles.ver');

    Route::put('/{rol}', [RolController::class, 'update'])
        ->middleware('permission:roles.editar');

    Route::patch('/{rol}', [RolController::class, 'update'])
        ->middleware('permission:roles.editar');

    Route::post('/{rol}/permisos', [RolController::class, 'asignarPermisos'])
        ->middleware('permission:roles.asignar_permisos');

    Route::delete('/{rol}', [RolController::class, 'destroy'])
        ->middleware('permission:roles.eliminar');
});
