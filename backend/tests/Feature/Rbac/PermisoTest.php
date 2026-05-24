<?php

use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/*
|--------------------------------------------------------------------------
| Tests del CRUD de Permisos — PermisoController
|--------------------------------------------------------------------------
|
| Cubre los escenarios de autenticación, autorización y lógica de negocio
| para los endpoints de gestión de permisos.
| Todos los tests usan RefreshDatabase (configurado en Pest.php).
|
*/

/**
 * Crea un usuario con el permiso indicado.
 */
function usuarioConPermisoPerm(string $permiso): User
{
    $usuario = User::factory()->create();
    Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
    $usuario->givePermissionTo($permiso);

    return $usuario;
}

/**
 * Crea un usuario sin ningún permiso.
 */
function usuarioSinPermisos(): User
{
    return User::factory()->create();
}

// ---------------------------------------------------------------------------
// Autenticación — 401 sin sesión
// ---------------------------------------------------------------------------

// P-01: GET /api/permisos sin autenticación retorna 401
test('listar permisos sin autenticación retorna 401', function () {
    $this->getJson('/api/permisos')
        ->assertUnauthorized();
});

// P-02: POST /api/permisos sin autenticación retorna 401
test('crear permiso sin autenticación retorna 401', function () {
    $this->postJson('/api/permisos', ['name' => 'test.ver'])
        ->assertUnauthorized();
});

// P-03: GET /api/permisos/{id} sin autenticación retorna 401
test('mostrar permiso sin autenticación retorna 401', function () {
    $permiso = Permission::firstOrCreate(['name' => 'dummy.ver', 'guard_name' => 'web']);

    $this->getJson("/api/permisos/{$permiso->id}")
        ->assertUnauthorized();
});

// P-04: PUT /api/permisos/{id} sin autenticación retorna 401
test('editar permiso sin autenticación retorna 401', function () {
    $permiso = Permission::firstOrCreate(['name' => 'dummy.ver', 'guard_name' => 'web']);

    $this->putJson("/api/permisos/{$permiso->id}", ['name' => 'dummy.editar'])
        ->assertUnauthorized();
});

// P-05: DELETE /api/permisos/{id} sin autenticación retorna 401
test('eliminar permiso sin autenticación retorna 401', function () {
    $permiso = Permission::firstOrCreate(['name' => 'dummy.ver', 'guard_name' => 'web']);

    $this->deleteJson("/api/permisos/{$permiso->id}")
        ->assertUnauthorized();
});

// ---------------------------------------------------------------------------
// Autorización — 403 sin el permiso requerido
// ---------------------------------------------------------------------------

// P-06: GET /api/permisos sin permiso permisos.ver retorna 403
test('listar permisos sin permiso permisos.ver retorna 403', function () {
    $usuario = usuarioSinPermisos();

    $this->actingAs($usuario)
        ->getJson('/api/permisos')
        ->assertForbidden();
});

// P-07: POST /api/permisos sin permiso permisos.crear retorna 403
test('crear permiso sin permiso permisos.crear retorna 403', function () {
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $this->actingAs($usuario)
        ->postJson('/api/permisos', ['name' => 'test.ver'])
        ->assertForbidden();
});

// P-08: GET /api/permisos/{id} sin permiso permisos.ver retorna 403
test('mostrar permiso sin permiso permisos.ver retorna 403', function () {
    $usuario = usuarioSinPermisos();
    $permiso = Permission::firstOrCreate(['name' => 'dummy.ver', 'guard_name' => 'web']);

    $this->actingAs($usuario)
        ->getJson("/api/permisos/{$permiso->id}")
        ->assertForbidden();
});

// P-09: PUT /api/permisos/{id} sin permiso permisos.editar retorna 403
test('editar permiso sin permiso permisos.editar retorna 403', function () {
    $usuario = usuarioConPermisoPerm('permisos.ver');
    $permiso = Permission::firstOrCreate(['name' => 'dummy.ver', 'guard_name' => 'web']);

    $this->actingAs($usuario)
        ->putJson("/api/permisos/{$permiso->id}", ['name' => 'dummy.editar'])
        ->assertForbidden();
});

// P-10: DELETE /api/permisos/{id} sin permiso permisos.eliminar retorna 403
test('eliminar permiso sin permiso permisos.eliminar retorna 403', function () {
    $usuario = usuarioConPermisoPerm('permisos.ver');
    $permiso = Permission::firstOrCreate(['name' => 'dummy.ver', 'guard_name' => 'web']);

    $this->actingAs($usuario)
        ->deleteJson("/api/permisos/{$permiso->id}")
        ->assertForbidden();
});

// ---------------------------------------------------------------------------
// Listado paginado
// ---------------------------------------------------------------------------

// P-11: GET /api/permisos con permiso retorna 200 y estructura paginada
test('listar permisos con permiso permisos.ver retorna 200 con paginación', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $this->actingAs($usuario)
        ->getJson('/api/permisos')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'guard_name', 'modulo', 'accion', 'es_canonico'],
            ],
            'meta',
            'links',
        ]);
});

// P-12: GET /api/permisos con filtro módulo retorna solo permisos del módulo
test('listar permisos filtrando por módulo retorna solo esos permisos', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?filter[modulo]=usuarios')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();

    foreach ($nombres as $nombre) {
        expect($nombre)->toStartWith('usuarios.');
    }
});

// ---------------------------------------------------------------------------
// Creación
// ---------------------------------------------------------------------------

// P-13: POST /api/permisos con datos válidos retorna 201
test('crear permiso con nombre válido retorna 201', function () {
    $usuario = usuarioConPermisoPerm('permisos.crear');

    $this->actingAs($usuario)
        ->postJson('/api/permisos', ['name' => 'reportes.imprimir'])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'name', 'guard_name', 'modulo', 'accion', 'es_canonico']])
        ->assertJsonPath('data.name', 'reportes.imprimir')
        ->assertJsonPath('data.modulo', 'reportes')
        ->assertJsonPath('data.accion', 'imprimir')
        ->assertJsonPath('data.es_canonico', false);
});

// P-14: POST /api/permisos con formato de nombre inválido retorna 422
test('crear permiso con nombre sin punto retorna 422', function () {
    $usuario = usuarioConPermisoPerm('permisos.crear');

    $this->actingAs($usuario)
        ->postJson('/api/permisos', ['name' => 'permisoinvalido'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// P-15: POST /api/permisos con mayúsculas retorna 422
test('crear permiso con mayúsculas en el nombre retorna 422', function () {
    $usuario = usuarioConPermisoPerm('permisos.crear');

    $this->actingAs($usuario)
        ->postJson('/api/permisos', ['name' => 'Usuarios.Ver'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// P-16: POST /api/permisos con nombre duplicado retorna 422
test('crear permiso con nombre duplicado retorna 422', function () {
    $usuario = usuarioConPermisoPerm('permisos.crear');
    Permission::firstOrCreate(['name' => 'custom.accion', 'guard_name' => 'web']);

    $this->actingAs($usuario)
        ->postJson('/api/permisos', ['name' => 'custom.accion'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// P-17: POST /api/permisos sin campo name retorna 422
test('crear permiso sin campo name retorna 422', function () {
    $usuario = usuarioConPermisoPerm('permisos.crear');

    $this->actingAs($usuario)
        ->postJson('/api/permisos', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// ---------------------------------------------------------------------------
// Edición
// ---------------------------------------------------------------------------

// P-18: PUT /api/permisos/{id} permiso no canónico retorna 200
test('editar permiso no canónico retorna 200 con datos actualizados', function () {
    $usuario = usuarioConPermisoPerm('permisos.editar');
    $permiso = Permission::firstOrCreate(['name' => 'custom.accion', 'guard_name' => 'web']);

    $this->actingAs($usuario)
        ->putJson("/api/permisos/{$permiso->id}", ['name' => 'custom.nueva_accion'])
        ->assertOk()
        ->assertJsonPath('data.name', 'custom.nueva_accion');
});

// P-19: PUT /api/permisos/{id} permiso canónico retorna 422
test('editar permiso canónico retorna 422', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoPerm('permisos.editar');
    $permisoCanónico = Permission::where('name', 'usuarios.ver')->first();

    $this->actingAs($usuario)
        ->putJson("/api/permisos/{$permisoCanónico->id}", ['name' => 'usuarios.mirar'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// P-20: PUT /api/permisos/{id} permiso no existente retorna 404
test('editar permiso inexistente retorna 404', function () {
    $usuario = usuarioConPermisoPerm('permisos.editar');

    $this->actingAs($usuario)
        ->putJson('/api/permisos/99999', ['name' => 'custom.accion'])
        ->assertNotFound();
});

// ---------------------------------------------------------------------------
// Eliminación
// ---------------------------------------------------------------------------

// P-21: DELETE /api/permisos/{id} permiso no canónico sin roles retorna 204
test('eliminar permiso no canónico no asignado retorna 204', function () {
    $usuario = usuarioConPermisoPerm('permisos.eliminar');
    $permiso = Permission::firstOrCreate(['name' => 'custom.eliminar_me', 'guard_name' => 'web']);

    $this->actingAs($usuario)
        ->deleteJson("/api/permisos/{$permiso->id}")
        ->assertNoContent();

    expect(Permission::where('name', 'custom.eliminar_me')->exists())->toBeFalse();
});

// P-22: DELETE /api/permisos/{id} permiso canónico retorna 422
test('eliminar permiso canónico retorna 422 con mensaje descriptivo', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoPerm('permisos.eliminar');
    $permisoCanónico = Permission::where('name', 'usuarios.ver')->first();

    $this->actingAs($usuario)
        ->deleteJson("/api/permisos/{$permisoCanónico->id}")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// P-23: DELETE /api/permisos/{id} permiso asignado a un rol retorna 422
test('eliminar permiso asignado a rol retorna 422 con mensaje descriptivo', function () {
    $usuario = usuarioConPermisoPerm('permisos.eliminar');

    $permiso = Permission::firstOrCreate(['name' => 'custom.con_rol', 'guard_name' => 'web']);
    $rol = Role::firstOrCreate(['name' => 'rol_prueba', 'guard_name' => 'web']);
    $rol->givePermissionTo($permiso);

    $this->actingAs($usuario)
        ->deleteJson("/api/permisos/{$permiso->id}")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// P-24: DELETE /api/permisos/{id} permiso no existente retorna 404
test('eliminar permiso inexistente retorna 404', function () {
    $usuario = usuarioConPermisoPerm('permisos.eliminar');

    $this->actingAs($usuario)
        ->deleteJson('/api/permisos/99999')
        ->assertNotFound();
});

// ---------------------------------------------------------------------------
// Mostrar permiso individual
// ---------------------------------------------------------------------------

// P-25: GET /api/permisos/{id} con permiso retorna 200 y estructura correcta
test('mostrar permiso existente retorna 200 con estructura correcta', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoPerm('permisos.ver');
    $permiso = Permission::where('name', 'usuarios.ver')->first();

    $this->actingAs($usuario)
        ->getJson("/api/permisos/{$permiso->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'usuarios.ver')
        ->assertJsonPath('data.modulo', 'usuarios')
        ->assertJsonPath('data.accion', 'ver')
        ->assertJsonPath('data.es_canonico', true);
});

// P-26: GET /api/permisos/{id} no existente retorna 404
test('mostrar permiso inexistente retorna 404', function () {
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $this->actingAs($usuario)
        ->getJson('/api/permisos/99999')
        ->assertNotFound();
});

// ---------------------------------------------------------------------------
// Query Builder — filtros, sorts y errores 400
// ---------------------------------------------------------------------------

// P-27: filter[search] filtra permisos por nombre parcial
// SCADA: se reemplazó 'lotes.ver' (SIGEMSA) por 'sensores.ver' (módulo SCADA).
it('filtra permisos por búsqueda parcial con filter[search]', function () {
    Permission::firstOrCreate(['name' => 'usuarios.ver', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'usuarios.crear', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'sensores.ver', 'guard_name' => 'web']);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?filter[search]=usuarios')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('usuarios.ver');
    expect($nombres)->toContain('usuarios.crear');
    expect($nombres)->not->toContain('sensores.ver');
});

// P-28: filter[modulo]=usuarios devuelve permisos del módulo usuarios
it('filtra permisos por modulo con filter[modulo]=usuarios devuelve usuarios.*', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?filter[modulo]=usuarios&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->not->toBeEmpty();
    foreach ($nombres as $nombre) {
        expect($nombre)->toStartWith('usuarios.');
    }
});

// P-29: filter[modulo]=sensores devuelve permisos del módulo sensores
// SCADA: se reemplazó 'lotes' (SIGEMSA) por 'sensores' (módulo SCADA).
it('filtra permisos por modulo con filter[modulo]=sensores devuelve sensores.*', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?filter[modulo]=sensores&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->not->toBeEmpty();
    foreach ($nombres as $nombre) {
        expect($nombre)->toStartWith('sensores.');
    }
});

// P-30: filter[es_canonico]=1 devuelve solo permisos canónicos
it('filtra permisos canónicos con filter[es_canonico]=1', function () {
    $this->seed(RolesYPermisosSeeder::class);
    Permission::firstOrCreate(['name' => 'custom.accion_extra', 'guard_name' => 'web']);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?filter[es_canonico]=1&per_page=200')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    $canonicos = RolesYPermisosSeeder::permisosCanonicos();

    foreach ($nombres as $nombre) {
        expect(in_array($nombre, $canonicos))->toBeTrue();
    }
    expect($nombres)->not->toContain('custom.accion_extra');
});

// P-31: filter[es_canonico]=0 devuelve solo permisos custom
it('filtra permisos custom con filter[es_canonico]=0', function () {
    $this->seed(RolesYPermisosSeeder::class);
    Permission::firstOrCreate(['name' => 'custom.accion_extra', 'guard_name' => 'web']);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?filter[es_canonico]=0&per_page=200')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->toContain('custom.accion_extra');
    $canonicos = RolesYPermisosSeeder::permisosCanonicos();
    foreach ($nombres as $nombre) {
        expect(in_array($nombre, $canonicos))->toBeFalse();
    }
});

// P-32: sort=name ordena ascendente por nombre
it('ordena permisos ascending por name con sort=name', function () {
    Permission::firstOrCreate(['name' => 'zzz.accion', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'aaa.accion', 'guard_name' => 'web']);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?sort=name&filter[search]=.accion&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    $nombresOrdenados = $nombres;
    sort($nombresOrdenados);
    expect($nombres)->toBe($nombresOrdenados);
});

// P-33: filter con campo inválido devuelve 400 Bad Request
it('retorna 400 con filter inválido en permisos', function () {
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $this->actingAs($usuario)
        ->getJson('/api/permisos?filter[campo_invalido]=x')
        ->assertStatus(400);
});

// P-34: guard_name=web se aplica siempre — permisos con otro guard no aparecen
it('preserva guard_name=web excluyendo permisos con guard distinto', function () {
    Permission::firstOrCreate(['name' => 'api.recurso', 'guard_name' => 'api']);
    Permission::firstOrCreate(['name' => 'custom.web_permiso', 'guard_name' => 'web']);
    $usuario = usuarioConPermisoPerm('permisos.ver');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/permisos?per_page=200')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    expect($nombres)->not->toContain('api.recurso');
    expect($nombres)->toContain('custom.web_permiso');
});
