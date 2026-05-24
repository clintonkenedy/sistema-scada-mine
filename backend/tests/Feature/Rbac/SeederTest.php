<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RolesYPermisosSeeder;
use Database\Seeders\UsuarioAdminSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/*
|--------------------------------------------------------------------------
| Tests del Seeder RBAC — RolesYPermisosSeeder
|--------------------------------------------------------------------------
|
| Verifica: idempotencia, roles iniciales, permisos canónicos y usuario developer.
| Todos los tests usan RefreshDatabase (configurado en Pest.php).
|
*/

// S-01: El seeder crea los 4 roles iniciales
test('seeder crea los 4 roles iniciales', function () {
    $this->seed(RolesYPermisosSeeder::class);

    expect(Role::where('guard_name', 'web')->count())->toBe(4);
    expect(Role::where('name', 'developer')->exists())->toBeTrue();
    expect(Role::where('name', 'administrador')->exists())->toBeTrue();
    expect(Role::where('name', 'operador')->exists())->toBeTrue();
    expect(Role::where('name', 'consulta')->exists())->toBeTrue();
});

// S-02: El seeder crea el árbol canónico de permisos
// SCADA: la lista de permisos esperados refleja el árbol de módulos SCADA
// (RBAC + dashboard + sensores + mediciones + alertas + equipos + rutas + reportes),
// en lugar de los módulos GIS de SIGEMSA (mapa/conexiones/lotes/manzanas/...).
test('seeder crea los permisos canónicos del árbol', function () {
    $this->seed(RolesYPermisosSeeder::class);

    $permisosEsperados = [
        // RBAC
        'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
        'usuarios.asignar_rol', 'usuarios.toggle_activo',
        'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar', 'roles.asignar_permisos',
        'permisos.ver', 'permisos.crear', 'permisos.editar', 'permisos.eliminar',
        // SCADA
        'dashboard.ver',
        'sensores.ver', 'sensores.crear', 'sensores.editar', 'sensores.eliminar', 'sensores.calibrar',
        'mediciones.ver', 'mediciones.exportar',
        'alertas.ver', 'alertas.reconocer', 'alertas.silenciar', 'alertas.configurar',
        'equipos.ver', 'equipos.crear', 'equipos.editar', 'equipos.eliminar',
        'rutas.ver', 'rutas.crear', 'rutas.editar', 'rutas.eliminar',
        'reportes.ver', 'reportes.generar', 'reportes.exportar',
    ];

    foreach ($permisosEsperados as $permiso) {
        expect(Permission::where('name', $permiso)->where('guard_name', 'web')->exists())
            ->toBeTrue("Falta el permiso: {$permiso}");
    }
});

// S-03: El seeder crea el usuario developer con los datos correctos
test('seeder crea el usuario developer con rol developer', function () {
    $this->seed(RolesYPermisosSeeder::class);

    $devEmail = env('DEV_USER_EMAIL', 'dev@scada.local');
    $devUsuario = User::where('email', $devEmail)->first();

    expect($devUsuario)->not->toBeNull();
    expect($devUsuario->activo)->toBeTrue();
    expect($devUsuario->hasRole('developer'))->toBeTrue();
});

// S-04: El rol developer tiene todos los permisos
test('rol developer tiene todos los permisos del sistema', function () {
    $this->seed(RolesYPermisosSeeder::class);

    $totalPermisos = Permission::where('guard_name', 'web')->count();
    $rolDeveloper = Role::where('name', 'developer')->first();

    expect($rolDeveloper->permissions()->count())->toBe($totalPermisos);
});

// S-05: El rol operador NO tiene permisos de gestión RBAC
test('rol operador no tiene permisos de gestión RBAC', function () {
    $this->seed(RolesYPermisosSeeder::class);

    $rolOperador = Role::where('name', 'operador')->first();
    $nombresPermisos = $rolOperador->permissions()->pluck('name')->toArray();

    $permisosRbac = array_filter($nombresPermisos, fn ($p) => str_starts_with($p, 'usuarios.')
        || str_starts_with($p, 'roles.')
        || str_starts_with($p, 'permisos.')
    );

    expect($permisosRbac)->toBeEmpty();
});

// S-06: El rol consulta solo tiene permisos *.ver
test('rol consulta solo tiene permisos de lectura', function () {
    $this->seed(RolesYPermisosSeeder::class);

    $rolConsulta = Role::where('name', 'consulta')->first();
    $nombresPermisos = $rolConsulta->permissions()->pluck('name')->toArray();

    foreach ($nombresPermisos as $permiso) {
        expect($permiso)->toEndWith('.ver');
    }
});

// S-07: El seeder es idempotente — correrlo dos veces no duplica datos
test('seeder es idempotente — segunda ejecución no duplica roles ni permisos', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $rolesFirst = Role::where('guard_name', 'web')->count();
    $permisosFirst = Permission::where('guard_name', 'web')->count();
    $usuariosFirst = User::count();

    // Segunda ejecución
    $this->seed(RolesYPermisosSeeder::class);
    $rolesSecond = Role::where('guard_name', 'web')->count();
    $permisosSecond = Permission::where('guard_name', 'web')->count();
    $usuariosSecond = User::count();

    expect($rolesSecond)->toBe($rolesFirst);
    expect($permisosSecond)->toBe($permisosFirst);
    expect($usuariosSecond)->toBe($usuariosFirst);
});

// S-08: DatabaseSeeder ejecuta UsuarioAdminSeeder y RolesYPermisosSeeder en orden correcto
// SCADA: el email del admin se cambió de admin@emsapuno.com.pe a admin@scada.local.
test('database seeder ejecuta ambos seeders y asigna rol al admin', function () {
    $this->seed(DatabaseSeeder::class);

    $adminUsuario = User::where('email', 'admin@scada.local')->first();

    expect($adminUsuario)->not->toBeNull();
    expect($adminUsuario->hasRole('administrador'))->toBeTrue();
});

// S-09: DatabaseSeeder también es idempotente en conjunto
// SCADA: emails actualizados a admin@scada.local y dev@scada.local (fallback).
test('database seeder es idempotente al correrlo dos veces', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    // No debe haber usuarios duplicados
    $adminCount = User::where('email', 'admin@scada.local')->count();
    $devEmail = env('DEV_USER_EMAIL', 'dev@scada.local');
    $devCount = User::where('email', $devEmail)->count();

    expect($adminCount)->toBe(1);
    expect($devCount)->toBe(1);

    // Solo deben existir los 4 roles del sistema
    expect(Role::where('guard_name', 'web')->count())->toBe(4);
});
