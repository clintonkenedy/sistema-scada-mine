<?php

use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/*
|--------------------------------------------------------------------------
| Tests del CRUD de Roles — RolController
|--------------------------------------------------------------------------
|
| Cubre los escenarios de autenticación, autorización y lógica de negocio
| para los endpoints de gestión de roles.
| Todos los tests usan RefreshDatabase (configurado en Pest.php).
|
*/

/**
 * Crea un usuario con el permiso indicado.
 */
function usuarioConPermisoRol(string $permiso): User
{
    $usuario = User::factory()->create();
    Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
    $usuario->givePermissionTo($permiso);

    return $usuario;
}

/**
 * Crea un usuario sin ningún permiso.
 */
function usuarioSinPermisosRol(): User
{
    return User::factory()->create();
}

/**
 * Crea un rol de prueba (no inicial) con datos de ejemplo.
 */
function crearRolPrueba(string $nombre = 'rol_prueba'): Role
{
    return Role::firstOrCreate(['name' => $nombre, 'guard_name' => 'web']);
}

// ---------------------------------------------------------------------------
// Autenticación — 401 sin sesión
// ---------------------------------------------------------------------------

// R-01: GET /api/roles sin autenticación retorna 401
test('listar roles sin autenticación retorna 401', function () {
    $this->getJson('/api/roles')
        ->assertUnauthorized();
});

// R-02: POST /api/roles sin autenticación retorna 401
test('crear rol sin autenticación retorna 401', function () {
    $this->postJson('/api/roles', ['name' => 'nuevo_rol'])
        ->assertUnauthorized();
});

// R-03: GET /api/roles/{id} sin autenticación retorna 401
test('mostrar rol sin autenticación retorna 401', function () {
    $rol = crearRolPrueba();

    $this->getJson("/api/roles/{$rol->id}")
        ->assertUnauthorized();
});

// R-04: PUT /api/roles/{id} sin autenticación retorna 401
test('editar rol sin autenticación retorna 401', function () {
    $rol = crearRolPrueba();

    $this->putJson("/api/roles/{$rol->id}", ['name' => 'renombrado'])
        ->assertUnauthorized();
});

// R-05: POST /api/roles/{id}/permisos sin autenticación retorna 401
test('asignar permisos a rol sin autenticación retorna 401', function () {
    $rol = crearRolPrueba();

    $this->postJson("/api/roles/{$rol->id}/permisos", ['permisos' => []])
        ->assertUnauthorized();
});

// R-06: DELETE /api/roles/{id} sin autenticación retorna 401
test('eliminar rol sin autenticación retorna 401', function () {
    $rol = crearRolPrueba();

    $this->deleteJson("/api/roles/{$rol->id}")
        ->assertUnauthorized();
});

// ---------------------------------------------------------------------------
// Autorización — 403 sin el permiso requerido
// ---------------------------------------------------------------------------

// R-07: GET /api/roles sin permiso roles.ver retorna 403
test('listar roles sin permiso roles.ver retorna 403', function () {
    $usuario = usuarioSinPermisosRol();

    $this->actingAs($usuario)
        ->getJson('/api/roles')
        ->assertForbidden();
});

// R-08: POST /api/roles sin permiso roles.crear retorna 403
test('crear rol sin permiso roles.crear retorna 403', function () {
    $usuario = usuarioConPermisoRol('roles.ver');

    $this->actingAs($usuario)
        ->postJson('/api/roles', ['name' => 'nuevo_rol'])
        ->assertForbidden();
});

// R-09: PUT /api/roles/{id} sin permiso roles.editar retorna 403
test('editar rol sin permiso roles.editar retorna 403', function () {
    $usuario = usuarioConPermisoRol('roles.ver');
    $rol = crearRolPrueba();

    $this->actingAs($usuario)
        ->putJson("/api/roles/{$rol->id}", ['name' => 'renombrado'])
        ->assertForbidden();
});

// R-10: POST /api/roles/{id}/permisos sin permiso roles.asignar_permisos retorna 403
test('asignar permisos a rol sin permiso roles.asignar_permisos retorna 403', function () {
    $usuario = usuarioConPermisoRol('roles.ver');
    $rol = crearRolPrueba();

    $this->actingAs($usuario)
        ->postJson("/api/roles/{$rol->id}/permisos", ['permisos' => []])
        ->assertForbidden();
});

// R-11: DELETE /api/roles/{id} sin permiso roles.eliminar retorna 403
test('eliminar rol sin permiso roles.eliminar retorna 403', function () {
    $usuario = usuarioConPermisoRol('roles.ver');
    $rol = crearRolPrueba();

    $this->actingAs($usuario)
        ->deleteJson("/api/roles/{$rol->id}")
        ->assertForbidden();
});

// ---------------------------------------------------------------------------
// Listado paginado
// ---------------------------------------------------------------------------

// R-12: GET /api/roles con permiso retorna 200 y estructura paginada
test('listar roles con permiso roles.ver retorna 200 con paginación', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.ver');

    $this->actingAs($usuario)
        ->getJson('/api/roles')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'guard_name', 'es_inicial', 'cantidad_usuarios'],
            ],
            'meta',
            'links',
        ]);
});

// R-13: GET /api/roles con búsqueda filtra por nombre
test('listar roles con búsqueda retorna solo roles que coinciden', function () {
    crearRolPrueba('supervisor');
    crearRolPrueba('auditor');
    $usuario = usuarioConPermisoRol('roles.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles?filter[search]=supervisor')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('supervisor');
    expect($nombres)->not->toContain('auditor');
});

// ---------------------------------------------------------------------------
// Creación
// ---------------------------------------------------------------------------

// R-14: POST /api/roles con datos válidos retorna 201
test('crear rol con nombre válido retorna 201', function () {
    $usuario = usuarioConPermisoRol('roles.crear');

    $this->actingAs($usuario)
        ->postJson('/api/roles', ['name' => 'supervisor'])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'name', 'guard_name', 'es_inicial', 'cantidad_usuarios']])
        ->assertJsonPath('data.name', 'supervisor')
        ->assertJsonPath('data.es_inicial', false);
});

// R-15: POST /api/roles con nombre inválido (tiene números) retorna 422
test('crear rol con nombre inválido retorna 422', function () {
    $usuario = usuarioConPermisoRol('roles.crear');

    $this->actingAs($usuario)
        ->postJson('/api/roles', ['name' => 'rol123'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// R-16: POST /api/roles con nombre en mayúsculas retorna 422
test('crear rol con nombre en mayúsculas retorna 422', function () {
    $usuario = usuarioConPermisoRol('roles.crear');

    $this->actingAs($usuario)
        ->postJson('/api/roles', ['name' => 'Supervisor'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// R-17: POST /api/roles con nombre duplicado retorna 422
test('crear rol con nombre duplicado retorna 422', function () {
    $usuario = usuarioConPermisoRol('roles.crear');
    crearRolPrueba('supervisor');

    $this->actingAs($usuario)
        ->postJson('/api/roles', ['name' => 'supervisor'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// R-18: POST /api/roles sin campo name retorna 422
test('crear rol sin campo name retorna 422', function () {
    $usuario = usuarioConPermisoRol('roles.crear');

    $this->actingAs($usuario)
        ->postJson('/api/roles', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// ---------------------------------------------------------------------------
// Edición
// ---------------------------------------------------------------------------

// R-19: PUT /api/roles/{id} rol no inicial retorna 200
test('editar rol no inicial retorna 200 con datos actualizados', function () {
    $usuario = usuarioConPermisoRol('roles.editar');
    $rol = crearRolPrueba('supervisor');

    $this->actingAs($usuario)
        ->putJson("/api/roles/{$rol->id}", ['name' => 'supervisor_senior'])
        ->assertOk()
        ->assertJsonPath('data.name', 'supervisor_senior');
});

// R-20: PUT /api/roles/{id} rol inicial (developer) retorna 422
test('editar rol developer inicial retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.editar');
    $rolDeveloper = Role::where('name', 'developer')->first();

    $this->actingAs($usuario)
        ->putJson("/api/roles/{$rolDeveloper->id}", ['name' => 'dev_renombrado'])
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// R-21: PUT /api/roles/{id} rol inicial (administrador) retorna 422
test('editar rol administrador inicial retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.editar');
    $rolAdmin = Role::where('name', 'administrador')->first();

    $this->actingAs($usuario)
        ->putJson("/api/roles/{$rolAdmin->id}", ['name' => 'admin_renombrado'])
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// R-22: PUT /api/roles/{id} rol inicial (operador) retorna 422
test('editar rol operador inicial retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.editar');
    $rolOperador = Role::where('name', 'operador')->first();

    $this->actingAs($usuario)
        ->putJson("/api/roles/{$rolOperador->id}", ['name' => 'operador_renombrado'])
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// R-23: PUT /api/roles/{id} rol inicial (consulta) retorna 422
test('editar rol consulta inicial retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.editar');
    $rolConsulta = Role::where('name', 'consulta')->first();

    $this->actingAs($usuario)
        ->putJson("/api/roles/{$rolConsulta->id}", ['name' => 'consulta_renombrada'])
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// R-24: PUT /api/roles/{id} rol no existente retorna 404
test('editar rol inexistente retorna 404', function () {
    $usuario = usuarioConPermisoRol('roles.editar');

    $this->actingAs($usuario)
        ->putJson('/api/roles/99999', ['name' => 'inexistente'])
        ->assertNotFound();
});

// ---------------------------------------------------------------------------
// Asignación de permisos (sincronización)
// ---------------------------------------------------------------------------

// R-25: POST /api/roles/{id}/permisos sincroniza permisos correctamente
// SCADA: se reemplazaron los permisos de SIGEMSA (mapa/conexiones/lotes) por
// permisos canónicos del SCADA (dashboard/sensores/mediciones).
test('sincronizar permisos de rol reemplaza todos los permisos existentes', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.asignar_permisos');
    $rol = crearRolPrueba('supervisor');

    // Asignar permiso inicial
    $permisoInicial = Permission::where('name', 'dashboard.ver')->first();
    $rol->givePermissionTo($permisoInicial);
    expect($rol->permissions()->count())->toBe(1);

    // Sincronizar con nuevos permisos — debe REEMPLAZAR, no agregar
    $nuevosPermisos = ['sensores.ver', 'mediciones.ver'];

    $respuesta = $this->actingAs($usuario)
        ->postJson("/api/roles/{$rol->id}/permisos", ['permisos' => $nuevosPermisos])
        ->assertOk();

    $rol->refresh();
    $permisosActuales = $rol->permissions()->pluck('name')->toArray();

    expect($permisosActuales)->toContain('sensores.ver');
    expect($permisosActuales)->toContain('mediciones.ver');
    expect($permisosActuales)->not->toContain('dashboard.ver'); // Fue reemplazado
    expect($rol->permissions()->count())->toBe(2);
});

// R-26: POST /api/roles/{id}/permisos con array vacío quita todos los permisos
// SCADA: se reemplazaron los permisos de SIGEMSA (mapa/conexiones) por SCADA (dashboard/sensores).
test('sincronizar permisos con array vacío quita todos los permisos del rol', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.asignar_permisos');
    $rol = crearRolPrueba('supervisor');

    // Asignar algunos permisos
    $permisoA = Permission::where('name', 'dashboard.ver')->first();
    $permisoB = Permission::where('name', 'sensores.ver')->first();
    $rol->syncPermissions([$permisoA, $permisoB]);
    expect($rol->permissions()->count())->toBe(2);

    // Sincronizar con array vacío — debe quitar todos
    $this->actingAs($usuario)
        ->postJson("/api/roles/{$rol->id}/permisos", ['permisos' => []])
        ->assertOk();

    $rol->refresh();
    expect($rol->permissions()->count())->toBe(0);
});

// R-27: POST /api/roles/{id}/permisos con permiso inexistente retorna 422
test('sincronizar permisos con permiso inexistente retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.asignar_permisos');
    $rol = crearRolPrueba('supervisor');

    $this->actingAs($usuario)
        ->postJson("/api/roles/{$rol->id}/permisos", ['permisos' => ['permiso.que_no_existe']])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['permisos.0']);
});

// R-28: POST /api/roles/{id}/permisos sin campo permisos retorna 422
test('sincronizar permisos sin campo permisos retorna 422', function () {
    $usuario = usuarioConPermisoRol('roles.asignar_permisos');
    $rol = crearRolPrueba('supervisor');

    $this->actingAs($usuario)
        ->postJson("/api/roles/{$rol->id}/permisos", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['permisos']);
});

// ---------------------------------------------------------------------------
// Eliminación
// ---------------------------------------------------------------------------

// R-29: DELETE /api/roles/{id} rol no inicial sin usuarios retorna 204
test('eliminar rol no inicial sin usuarios retorna 204', function () {
    $usuario = usuarioConPermisoRol('roles.eliminar');
    $rol = crearRolPrueba('rol_a_eliminar');

    $this->actingAs($usuario)
        ->deleteJson("/api/roles/{$rol->id}")
        ->assertNoContent();

    expect(Role::where('name', 'rol_a_eliminar')->exists())->toBeFalse();
});

// R-30: DELETE /api/roles/{id} rol inicial (developer) retorna 422
test('eliminar rol developer inicial retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.eliminar');
    $rolDeveloper = Role::where('name', 'developer')->first();

    $this->actingAs($usuario)
        ->deleteJson("/api/roles/{$rolDeveloper->id}")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// R-31: DELETE /api/roles/{id} rol inicial (administrador) retorna 422
test('eliminar rol administrador inicial retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.eliminar');
    $rolAdmin = Role::where('name', 'administrador')->first();

    $this->actingAs($usuario)
        ->deleteJson("/api/roles/{$rolAdmin->id}")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// R-32: DELETE /api/roles/{id} rol con usuarios asignados retorna 422
test('eliminar rol con usuarios asignados retorna 422 con mensaje descriptivo', function () {
    $usuario = usuarioConPermisoRol('roles.eliminar');
    $rol = crearRolPrueba('supervisor');

    // Crear usuario y asignarle el rol
    $usuarioConRol = User::factory()->create();
    Permission::firstOrCreate(['name' => 'roles.eliminar', 'guard_name' => 'web']);
    $usuarioConRol->assignRole($rol);

    $this->actingAs($usuario)
        ->deleteJson("/api/roles/{$rol->id}")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// R-33: DELETE /api/roles/{id} rol no existente retorna 404
test('eliminar rol inexistente retorna 404', function () {
    $usuario = usuarioConPermisoRol('roles.eliminar');

    $this->actingAs($usuario)
        ->deleteJson('/api/roles/99999')
        ->assertNotFound();
});

// ---------------------------------------------------------------------------
// Mostrar rol individual
// ---------------------------------------------------------------------------

// R-34: GET /api/roles/{id} con permiso retorna 200 y estructura correcta
test('mostrar rol existente retorna 200 con estructura correcta', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.ver');
    $rolAdmin = Role::where('name', 'administrador')->first();

    $this->actingAs($usuario)
        ->getJson("/api/roles/{$rolAdmin->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'administrador')
        ->assertJsonPath('data.es_inicial', true)
        ->assertJsonStructure(['data' => ['id', 'name', 'guard_name', 'es_inicial', 'permisos', 'cantidad_usuarios']]);
});

// R-35: GET /api/roles/{id} rol no existente retorna 404
test('mostrar rol inexistente retorna 404', function () {
    $usuario = usuarioConPermisoRol('roles.ver');

    $this->actingAs($usuario)
        ->getJson('/api/roles/99999')
        ->assertNotFound();
});

// ---------------------------------------------------------------------------
// Verificación de campo es_inicial
// ---------------------------------------------------------------------------

// R-36: Roles iniciales tienen es_inicial = true en el listado
test('roles iniciales retornan es_inicial true en el resource', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles')
        ->assertOk();

    $rolesIniciales = collect($respuesta->json('data'))
        ->filter(fn ($r) => in_array($r['name'], RolesYPermisosSeeder::rolesIniciales()));

    foreach ($rolesIniciales as $rol) {
        expect($rol['es_inicial'])->toBeTrue();
    }
});

// R-37: Rol creado por usuario tiene es_inicial = false
test('rol creado por usuario tiene es_inicial false', function () {
    $usuario = usuarioConPermisoRol('roles.ver');
    crearRolPrueba('custom_rol');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles')
        ->assertOk();

    $rolCustom = collect($respuesta->json('data'))->firstWhere('name', 'custom_rol');

    expect($rolCustom)->not->toBeNull();
    expect($rolCustom['es_inicial'])->toBeFalse();
});

// ---------------------------------------------------------------------------
// Query Builder — filtros, sorts y errores 400
// ---------------------------------------------------------------------------

// R-38: filter[search] filtra roles por nombre parcial
it('filtra roles por búsqueda parcial con filter[search]', function () {
    crearRolPrueba('supervisor');
    crearRolPrueba('auditor');
    $usuario = usuarioConPermisoRol('roles.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles?filter[search]=super')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('supervisor');
    expect($nombres)->not->toContain('auditor');
});

// R-39: filter[es_inicial]=1 devuelve solo los 4 roles del sistema
it('filtra roles iniciales con filter[es_inicial]=1 devuelve los 4 roles sistema', function () {
    $this->seed(RolesYPermisosSeeder::class);
    crearRolPrueba('supervisor_custom');
    $usuario = usuarioConPermisoRol('roles.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles?filter[es_inicial]=1&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('developer');
    expect($nombres)->toContain('administrador');
    expect($nombres)->toContain('operador');
    expect($nombres)->toContain('consulta');
    expect($nombres)->not->toContain('supervisor_custom');
});

// R-40: filter[es_inicial]=0 devuelve solo roles custom
it('filtra roles no-iniciales con filter[es_inicial]=0 devuelve solo custom', function () {
    $this->seed(RolesYPermisosSeeder::class);
    crearRolPrueba('supervisor_custom');
    $usuario = usuarioConPermisoRol('roles.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles?filter[es_inicial]=0&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('supervisor_custom');
    expect($nombres)->not->toContain('developer');
    expect($nombres)->not->toContain('administrador');
    expect($nombres)->not->toContain('operador');
    expect($nombres)->not->toContain('consulta');
});

// R-41: filter[tiene_usuarios]=1 devuelve roles con usuarios asignados
it('filtra roles con usuarios asignados con filter[tiene_usuarios]=1', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoRol('roles.ver');

    $rolConUsuario = crearRolPrueba('rol_con_usuario');
    $usuarioConRol = User::factory()->create();
    $usuarioConRol->assignRole($rolConUsuario);

    $rolSinUsuario = crearRolPrueba('rol_sin_usuario');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles?filter[tiene_usuarios]=1&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('rol_con_usuario');
    expect($nombres)->not->toContain('rol_sin_usuario');
});

// R-42: filter[tiene_usuarios]=0 devuelve roles sin usuarios
it('filtra roles sin usuarios con filter[tiene_usuarios]=0', function () {
    $usuario = usuarioConPermisoRol('roles.ver');

    $rolConUsuario = crearRolPrueba('rol_con_usuario');
    $usuarioConRol = User::factory()->create();
    $usuarioConRol->assignRole($rolConUsuario);

    $rolSinUsuario = crearRolPrueba('rol_sin_usuario');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles?filter[tiene_usuarios]=0&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('rol_sin_usuario');
    expect($nombres)->not->toContain('rol_con_usuario');
});

// R-43: sort=-created_at ordena descendente por fecha de creación
it('ordena roles descending por created_at con sort=-created_at', function () {
    $usuario = usuarioConPermisoRol('roles.ver');

    $rolViejo = Role::firstOrCreate(['name' => 'rol_viejo', 'guard_name' => 'web']);
    // Simular que el segundo se creó después
    $rolNuevo = Role::firstOrCreate(['name' => 'rol_nuevo', 'guard_name' => 'web']);
    $rolNuevo->created_at = now()->addMinute();
    $rolNuevo->save();

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/roles?sort=-created_at&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    $posicionNuevo = array_search('rol_nuevo', $nombres);
    $posicionViejo = array_search('rol_viejo', $nombres);

    expect($posicionNuevo)->toBeLessThan($posicionViejo);
});

// R-44: filter con campo inválido devuelve 400 Bad Request
it('retorna 400 con filter[campo_invalido] en roles', function () {
    $usuario = usuarioConPermisoRol('roles.ver');

    $this->actingAs($usuario)
        ->getJson('/api/roles?filter[campo_invalido]=x')
        ->assertStatus(400);
});

// R-45: sort con columna inválida devuelve 400 Bad Request
it('retorna 400 con sort inválido en roles', function () {
    $usuario = usuarioConPermisoRol('roles.ver');

    $this->actingAs($usuario)
        ->getJson('/api/roles?sort=columna_invalida')
        ->assertStatus(400);
});

// R-46: RolesYPermisosSeeder::rolesIniciales() devuelve exactamente los 4 roles del sistema
it('roles iniciales del seeder devuelve exactamente 4 roles del sistema', function () {
    $iniciales = RolesYPermisosSeeder::rolesIniciales();

    expect($iniciales)->toHaveCount(4);
    expect($iniciales)->toContain('developer');
    expect($iniciales)->toContain('administrador');
    expect($iniciales)->toContain('operador');
    expect($iniciales)->toContain('consulta');
    foreach ($iniciales as $nombre) {
        expect($nombre)->toBe(strtolower($nombre));
    }
});
