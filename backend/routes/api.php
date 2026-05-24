<?php

use App\Http\Controllers\CamionController;
use App\Http\Controllers\ConfiguracionScadaController;
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

// Gestión de camiones
Route::middleware('auth:sanctum')->prefix('camiones')->group(function () {
    Route::get('/', [CamionController::class, 'index'])
        ->middleware('permission:camiones.ver');

    Route::post('/', [CamionController::class, 'store'])
        ->middleware('permission:camiones.crear');

    Route::get('/{camion}', [CamionController::class, 'show'])
        ->middleware('permission:camiones.ver');

    Route::put('/{camion}', [CamionController::class, 'update'])
        ->middleware('permission:camiones.editar');

    Route::patch('/{camion}', [CamionController::class, 'update'])
        ->middleware('permission:camiones.editar');

    Route::delete('/{camion}', [CamionController::class, 'destroy'])
        ->middleware('permission:camiones.eliminar');

    Route::post('/{camion}/toggle-activo', [CamionController::class, 'toggleActivo'])
        ->middleware('permission:camiones.toggle_activo');
});

// Configuración SCADA (parámetros runtime-tunables)
Route::middleware('auth:sanctum')->prefix('configuracion-scada')->group(function () {
    Route::get('/', [ConfiguracionScadaController::class, 'index'])
        ->middleware('permission:configuracion.ver');

    Route::get('/{clave}', [ConfiguracionScadaController::class, 'show'])
        ->middleware('permission:configuracion.ver');

    Route::put('/{clave}', [ConfiguracionScadaController::class, 'update'])
        ->middleware('permission:configuracion.editar');
});
