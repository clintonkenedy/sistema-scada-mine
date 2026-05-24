<?php

use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Spatie\Permission\Models\Permission;

/*
|--------------------------------------------------------------------------
| Tests del CRUD de Usuarios — UsuarioController
|--------------------------------------------------------------------------
|
| Cubre los escenarios de autenticación, autorización y lógica de negocio
| para los endpoints de gestión de usuarios.
| Todos los tests usan RefreshDatabase (configurado en Pest.php).
|
*/

/**
 * Crea un usuario con el permiso indicado.
 */
function usuarioConPermisoUsr(string $permiso): User
{
    $usuario = User::factory()->create();
    Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
    $usuario->givePermissionTo($permiso);

    return $usuario;
}

/**
 * Crea un usuario sin ningún permiso.
 */
function usuarioSinPermisosUsr(): User
{
    return User::factory()->create();
}

/**
 * Prepara los permisos mínimos para los tests del CRUD de usuarios.
 */
function prepararPermisosUsuarios(): void
{
    $permisos = [
        'usuarios.ver',
        'usuarios.crear',
        'usuarios.editar',
        'usuarios.eliminar',
        'usuarios.asignar_rol',
        'usuarios.toggle_activo',
    ];

    foreach ($permisos as $permiso) {
        Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
    }
}

// ---------------------------------------------------------------------------
// Autenticación — 401 sin sesión
// ---------------------------------------------------------------------------

// U-01: GET /api/usuarios sin autenticación retorna 401
it('retorna 401 al listar usuarios sin autenticación', function () {
    $this->getJson('/api/usuarios')
        ->assertUnauthorized();
});

// ---------------------------------------------------------------------------
// Autorización — 403 sin permiso
// ---------------------------------------------------------------------------

// U-02: GET /api/usuarios autenticado sin permiso retorna 403
it('retorna 403 al listar usuarios sin permiso usuarios.ver', function () {
    $usuario = usuarioSinPermisosUsr();

    $this->actingAs($usuario)
        ->getJson('/api/usuarios')
        ->assertForbidden();
});

// ---------------------------------------------------------------------------
// Listado paginado
// ---------------------------------------------------------------------------

// U-03: GET /api/usuarios con permiso retorna 200 y estructura paginada
it('retorna 200 al listar usuarios con permiso usuarios.ver', function () {
    $usuario = usuarioConPermisoUsr('usuarios.ver');

    $this->actingAs($usuario)
        ->getJson('/api/usuarios')
        ->assertOk()
        ->assertJsonStructure([
            'data',
            'meta',
            'links',
        ]);
});

// U-04: Listado excluye usuarios con rol developer
it('excluye usuarios con rol developer del listado', function () {
    $this->seed(RolesYPermisosSeeder::class);

    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    // Obtener el usuario developer creado por el seeder
    $devEmail = env('DEV_USER_EMAIL', 'dev@scada.local');
    $usuarioDeveloper = User::where('email', $devEmail)->first();

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->not->toContain($usuarioDeveloper?->id);
});

// U-05: Listado filtra por ?filter[activo]=1
it('filtra usuarios activos con ?filter[activo]=1', function () {
    prepararPermisosUsuarios();

    $usuarioActivo = User::factory()->create(['activo' => true]);
    $usuarioInactivo = User::factory()->create(['activo' => false]);
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[activo]=1')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioActivo->id);
    expect($ids)->not->toContain($usuarioInactivo->id);
});

// U-06: Listado filtra por ?filter[activo]=0
it('filtra usuarios inactivos con ?filter[activo]=0', function () {
    prepararPermisosUsuarios();

    $usuarioActivo = User::factory()->create(['activo' => true]);
    $usuarioInactivo = User::factory()->create(['activo' => false]);
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[activo]=0')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioInactivo->id);
    expect($ids)->not->toContain($usuarioActivo->id);
});

// U-07: Listado busca por ?filter[search]=texto
it('filtra usuarios por búsqueda de texto', function () {
    prepararPermisosUsuarios();

    $usuarioBuscado = User::factory()->create(['nombres' => 'Buscado', 'apellido_paterno' => 'Especial']);
    $otroUsuario = User::factory()->create(['nombres' => 'Otro', 'apellido_paterno' => 'Cualquiera']);
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[search]=Buscado')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioBuscado->id);
    expect($ids)->not->toContain($otroUsuario->id);
});

// ---------------------------------------------------------------------------
// Creación
// ---------------------------------------------------------------------------

// U-08: POST /api/usuarios sin autenticación retorna 401
it('retorna 401 al crear usuario sin autenticación', function () {
    $this->postJson('/api/usuarios', [
        'name' => 'Nuevo Usuario',
        'email' => 'nuevo@test.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'nombres' => 'Nuevo',
        'apellido_paterno' => 'Usuario',
    ])->assertUnauthorized();
});

// U-09: POST /api/usuarios sin permiso retorna 403
it('retorna 403 al crear usuario sin permiso usuarios.crear', function () {
    $usuario = usuarioConPermisoUsr('usuarios.ver');

    $this->actingAs($usuario)
        ->postJson('/api/usuarios', [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nombres' => 'Nuevo',
            'apellido_paterno' => 'Usuario',
        ])->assertForbidden();
});

// U-10: POST /api/usuarios con datos válidos retorna 201
it('retorna 201 al crear usuario con datos válidos', function () {
    $usuario = usuarioConPermisoUsr('usuarios.crear');

    $this->actingAs($usuario)
        ->postJson('/api/usuarios', [
            'name' => 'Juan Pérez',
            'email' => 'juan@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nombres' => 'Juan',
            'apellido_paterno' => 'Pérez',
            'apellido_materno' => 'García',
        ])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'name', 'email', 'nombres', 'apellido_paterno', 'activo', 'roles', 'permisos']]);

    $this->assertDatabaseHas('users', ['email' => 'juan@test.com']);
});

// U-11: POST /api/usuarios con email duplicado retorna 422
it('retorna 422 al crear usuario con email duplicado', function () {
    $usuarioExistente = User::factory()->create(['email' => 'duplicado@test.com']);
    $usuario = usuarioConPermisoUsr('usuarios.crear');

    $this->actingAs($usuario)
        ->postJson('/api/usuarios', [
            'name' => 'Otro Usuario',
            'email' => 'duplicado@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nombres' => 'Otro',
            'apellido_paterno' => 'Usuario',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

// U-12: POST /api/usuarios con DNI duplicado retorna 422
it('retorna 422 al crear usuario con DNI duplicado', function () {
    $usuarioExistente = User::factory()->create(['dni' => '12345678']);
    $usuario = usuarioConPermisoUsr('usuarios.crear');

    $this->actingAs($usuario)
        ->postJson('/api/usuarios', [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nombres' => 'Nuevo',
            'apellido_paterno' => 'Usuario',
            'dni' => '12345678',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['dni']);
});

// U-13: POST /api/usuarios con name vacío retorna 422
it('retorna 422 al crear usuario sin campo name', function () {
    $usuario = usuarioConPermisoUsr('usuarios.crear');

    $this->actingAs($usuario)
        ->postJson('/api/usuarios', [
            'email' => 'nuevo@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nombres' => 'Nuevo',
            'apellido_paterno' => 'Usuario',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// U-14: POST /api/usuarios con password sin confirmar retorna 422
it('retorna 422 al crear usuario con password sin confirmar', function () {
    $usuario = usuarioConPermisoUsr('usuarios.crear');

    $this->actingAs($usuario)
        ->postJson('/api/usuarios', [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@test.com',
            'password' => 'password123',
            // sin password_confirmation
            'nombres' => 'Nuevo',
            'apellido_paterno' => 'Usuario',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

// U-15: POST /api/usuarios con rol asigna el rol al usuario creado
it('asigna rol al usuario creado si se envía rol en la creación', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoUsr('usuarios.crear');

    $respuesta = $this->actingAs($usuario)
        ->postJson('/api/usuarios', [
            'name' => 'Operador Nuevo',
            'email' => 'operador@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nombres' => 'Operador',
            'apellido_paterno' => 'Nuevo',
            'rol' => 'operador',
        ])
        ->assertCreated();

    $roles = $respuesta->json('data.roles');
    expect($roles)->toContain('operador');
});

// ---------------------------------------------------------------------------
// Edición
// ---------------------------------------------------------------------------

// U-16: PUT /api/usuarios/{id} con datos válidos retorna 200
it('retorna 200 al editar usuario con datos válidos', function () {
    $usuario = usuarioConPermisoUsr('usuarios.editar');
    $usuarioEditar = User::factory()->create();

    $this->actingAs($usuario)
        ->putJson("/api/usuarios/{$usuarioEditar->id}", [
            'name' => 'Nombre Actualizado',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Nombre Actualizado');
});

// U-17: PUT /api/usuarios/{id} sin password no cambia la contraseña
it('no modifica la contraseña si no se envía password en la edición', function () {
    $usuario = usuarioConPermisoUsr('usuarios.editar');
    $usuarioEditar = User::factory()->create(['password' => 'contraseña_original']);
    $hashOriginal = $usuarioEditar->password;

    $this->actingAs($usuario)
        ->putJson("/api/usuarios/{$usuarioEditar->id}", [
            'name' => 'Nombre Nuevo',
        ])
        ->assertOk();

    $usuarioEditar->refresh();
    expect($usuarioEditar->password)->toBe($hashOriginal);
});

// U-18: PUT /api/usuarios/{id} con email duplicado retorna 422
it('retorna 422 al editar usuario con email de otro usuario', function () {
    $usuario = usuarioConPermisoUsr('usuarios.editar');
    $otroUsuario = User::factory()->create(['email' => 'ocupado@test.com']);
    $usuarioEditar = User::factory()->create();

    $this->actingAs($usuario)
        ->putJson("/api/usuarios/{$usuarioEditar->id}", [
            'email' => 'ocupado@test.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

// ---------------------------------------------------------------------------
// Detalle individual
// ---------------------------------------------------------------------------

// U-19: GET /api/usuarios/{id} con permiso retorna 200
it('retorna 200 al ver usuario con permiso usuarios.ver', function () {
    $usuario = usuarioConPermisoUsr('usuarios.ver');
    $usuarioVer = User::factory()->create();

    $this->actingAs($usuario)
        ->getJson("/api/usuarios/{$usuarioVer->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $usuarioVer->id);
});

// U-20: GET /api/usuarios/{id} usuario inexistente retorna 404
it('retorna 404 al ver usuario inexistente', function () {
    $usuario = usuarioConPermisoUsr('usuarios.ver');

    $this->actingAs($usuario)
        ->getJson('/api/usuarios/99999')
        ->assertNotFound();
});

// ---------------------------------------------------------------------------
// Eliminación (soft delete)
// ---------------------------------------------------------------------------

// U-21: DELETE /api/usuarios/{id} retorna 204 y el usuario queda con deleted_at
it('retorna 204 al eliminar usuario y registra deleted_at en la base de datos', function () {
    $usuario = usuarioConPermisoUsr('usuarios.eliminar');
    $usuarioEliminar = User::factory()->create();

    $this->actingAs($usuario)
        ->deleteJson("/api/usuarios/{$usuarioEliminar->id}")
        ->assertNoContent();

    // Verificar soft delete — el registro existe con deleted_at poblado
    $this->assertSoftDeleted('users', ['id' => $usuarioEliminar->id]);
});

// U-22: DELETE /api/usuarios/{id} auto-eliminación retorna 422
it('retorna 422 al intentar eliminar el propio usuario', function () {
    $usuario = usuarioConPermisoUsr('usuarios.eliminar');

    $this->actingAs($usuario)
        ->deleteJson("/api/usuarios/{$usuario->id}")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// U-23: DELETE /api/usuarios/{id} usuario developer retorna 422
it('retorna 422 al intentar eliminar el usuario developer', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoUsr('usuarios.eliminar');

    $devEmail = env('DEV_USER_EMAIL', 'dev@scada.local');
    $usuarioDeveloper = User::where('email', $devEmail)->firstOrFail();

    $this->actingAs($usuario)
        ->deleteJson("/api/usuarios/{$usuarioDeveloper->id}")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// ---------------------------------------------------------------------------
// Asignación de rol
// ---------------------------------------------------------------------------

// U-24: POST /api/usuarios/{id}/rol retorna 200 y sincroniza rol
it('retorna 200 al asignar rol a un usuario', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoUsr('usuarios.asignar_rol');
    $usuarioEditar = User::factory()->create();

    $respuesta = $this->actingAs($usuario)
        ->postJson("/api/usuarios/{$usuarioEditar->id}/rol", ['rol' => 'consulta'])
        ->assertOk();

    $roles = $respuesta->json('data.roles');
    expect($roles)->toContain('consulta');
});

// U-25: POST /api/usuarios/{id}/rol auto-modificación retorna 422
it('retorna 422 al intentar asignar rol al propio usuario', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoUsr('usuarios.asignar_rol');

    $this->actingAs($usuario)
        ->postJson("/api/usuarios/{$usuario->id}/rol", ['rol' => 'consulta'])
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// U-26: POST /api/usuarios/{id}/rol con rol inexistente retorna 422
it('retorna 422 al asignar rol inexistente a un usuario', function () {
    $usuario = usuarioConPermisoUsr('usuarios.asignar_rol');
    $usuarioEditar = User::factory()->create();

    $this->actingAs($usuario)
        ->postJson("/api/usuarios/{$usuarioEditar->id}/rol", ['rol' => 'rol_que_no_existe'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rol']);
});

// ---------------------------------------------------------------------------
// Toggle activo
// ---------------------------------------------------------------------------

// U-27: POST /api/usuarios/{id}/toggle-activo retorna 200 e invierte activo
it('retorna 200 al hacer toggle del estado activo de un usuario', function () {
    $usuario = usuarioConPermisoUsr('usuarios.toggle_activo');
    $usuarioToggle = User::factory()->create(['activo' => true]);

    $respuesta = $this->actingAs($usuario)
        ->postJson("/api/usuarios/{$usuarioToggle->id}/toggle-activo")
        ->assertOk();

    expect($respuesta->json('data.activo'))->toBeFalse();

    // Volver a hacer toggle
    $respuesta2 = $this->actingAs($usuario)
        ->postJson("/api/usuarios/{$usuarioToggle->id}/toggle-activo")
        ->assertOk();

    expect($respuesta2->json('data.activo'))->toBeTrue();
});

// U-28: POST /api/usuarios/{id}/toggle-activo propio usuario retorna 422
it('retorna 422 al intentar hacer toggle del propio usuario', function () {
    $usuario = usuarioConPermisoUsr('usuarios.toggle_activo');

    $this->actingAs($usuario)
        ->postJson("/api/usuarios/{$usuario->id}/toggle-activo")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// U-29: POST /api/usuarios/{id}/toggle-activo usuario developer retorna 422
it('retorna 422 al intentar hacer toggle del usuario developer', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = usuarioConPermisoUsr('usuarios.toggle_activo');

    $devEmail = env('DEV_USER_EMAIL', 'dev@scada.local');
    $usuarioDeveloper = User::where('email', $devEmail)->firstOrFail();

    $this->actingAs($usuario)
        ->postJson("/api/usuarios/{$usuarioDeveloper->id}/toggle-activo")
        ->assertUnprocessable()
        ->assertJsonStructure(['message']);
});

// ---------------------------------------------------------------------------
// QueryBuilder — filtros, sorts, errores (Spatie Laravel Query Builder)
// ---------------------------------------------------------------------------

// U-30: filter[search] busca en los 6 campos de forma parcial
it('filtra por búsqueda en múltiples campos', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    // Crear un usuario con "objetivo" en cada campo
    $usuarioName = User::factory()->create(['name' => 'objetivo_name']);
    $usuarioEmail = User::factory()->create(['email' => 'objetivo@test.com']);
    $usuarioDni = User::factory()->create(['dni' => '00objetivo00']);
    $usuarioNombres = User::factory()->create(['nombres' => 'objetivo_nombres']);
    $usuarioApellidoP = User::factory()->create(['apellido_paterno' => 'objetivo_paterno']);
    $usuarioApellidoM = User::factory()->create(['apellido_materno' => 'objetivo_materno']);
    // Usuario que NO debe aparecer
    $usuarioFuera = User::factory()->create(['name' => 'fuera', 'email' => 'fuera@test.com']);

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[search]=objetivo')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioName->id);
    expect($ids)->toContain($usuarioEmail->id);
    expect($ids)->toContain($usuarioDni->id);
    expect($ids)->toContain($usuarioNombres->id);
    expect($ids)->toContain($usuarioApellidoP->id);
    expect($ids)->toContain($usuarioApellidoM->id);
    expect($ids)->not->toContain($usuarioFuera->id);
});

// U-31: filter[rol]=operador devuelve solo usuarios con ese rol
it('filtra por rol', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $usuarioOperador = User::factory()->create();
    $usuarioOperador->assignRole('operador');

    $usuarioConsulta = User::factory()->create();
    $usuarioConsulta->assignRole('consulta');

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[rol]=operador')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioOperador->id);
    expect($ids)->not->toContain($usuarioConsulta->id);
});

// U-32: filter[rol]=developer devuelve lista vacía (base query excluye developer)
it('excluye usuario developer del filtro por rol', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[rol]=developer')
        ->assertOk();

    $data = $respuesta->json('data');
    expect($data)->toBeEmpty();
});

// U-33: filter[created_from] filtra desde esa fecha inclusive
it('filtra por created_from', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $usuarioAntes = User::factory()->create(['created_at' => '2025-12-31 23:59:59']);
    $usuarioDespues = User::factory()->create(['created_at' => '2026-04-01 08:00:00']);

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[created_from]=2026-01-01')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioDespues->id);
    expect($ids)->not->toContain($usuarioAntes->id);
});

// U-34: filter[created_to] filtra hasta esa fecha inclusive (endOfDay)
it('filtra por created_to', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $usuarioAntes = User::factory()->create(['created_at' => '2026-01-15 10:00:00']);
    $usuarioDespues = User::factory()->create(['created_at' => '2026-07-01 10:00:00']);

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[created_to]=2026-06-30')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioAntes->id);
    expect($ids)->not->toContain($usuarioDespues->id);
});

// U-35: filter[created_from] + filter[created_to] combinados
it('combina created_from y created_to', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $usuarioEnero = User::factory()->create(['created_at' => '2026-01-15 10:00:00']);
    $usuarioMarzo = User::factory()->create(['created_at' => '2026-03-10 10:00:00']);
    $usuarioJulio = User::factory()->create(['created_at' => '2026-07-01 10:00:00']);

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[created_from]=2026-01-01&filter[created_to]=2026-06-30')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    expect($ids)->toContain($usuarioEnero->id);
    expect($ids)->toContain($usuarioMarzo->id);
    expect($ids)->not->toContain($usuarioJulio->id);
});

// U-36: sort ascending por name
it('ordena ascending por name', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    User::factory()->create(['name' => 'zeta_usuario']);
    User::factory()->create(['name' => 'alfa_usuario']);
    User::factory()->create(['name' => 'mu_usuario']);

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?sort=name&per_page=100')
        ->assertOk();

    $nombres = collect($respuesta->json('data'))->pluck('name')->toArray();
    $nombresOrdenados = $nombres;
    sort($nombresOrdenados);
    expect($nombres)->toBe($nombresOrdenados);
});

// U-37: sort descending por created_at
it('ordena descending por created_at', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $usuarioPrimero = User::factory()->create(['created_at' => '2026-01-01 10:00:00']);
    $usuarioUltimo = User::factory()->create(['created_at' => '2026-06-01 10:00:00']);

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?sort=-created_at&per_page=100')
        ->assertOk();

    $ids = collect($respuesta->json('data'))->pluck('id')->toArray();
    $posicionUltimo = array_search($usuarioUltimo->id, $ids);
    $posicionPrimero = array_search($usuarioPrimero->id, $ids);
    expect($posicionUltimo)->toBeLessThan($posicionPrimero);
});

// U-38: sort por defecto es name ascending (sin parámetro sort)
it('aplica default sort ascending by name', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    User::factory()->create(['name' => 'zzz_ultimo']);
    User::factory()->create(['name' => 'aaa_primero']);

    $respuestaSinSort = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?per_page=100')
        ->assertOk();

    $respuestaConSort = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?sort=name&per_page=100')
        ->assertOk();

    expect($respuestaSinSort->json('data'))->toBe($respuestaConSort->json('data'));
});

// U-39: filtro no permitido devuelve 400
it('devuelve 400 con filtro no permitido', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[campo_invalido]=valor')
        ->assertStatus(400);
});

// U-40: sort no permitido devuelve 400
it('devuelve 400 con sort no permitido', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?sort=columna_no_permitida')
        ->assertStatus(400);
});

// U-41: combinación de filtros, sort y paginación simultánea
it('combina filtros, sort y paginación', function () {
    prepararPermisosUsuarios();
    $usuarioConPermiso = usuarioConPermisoUsr('usuarios.ver');

    // Crear usuarios activos con nombre que contiene "activo"
    User::factory()->count(3)->create(['activo' => true, 'name' => 'activo_usuario_test_'.rand(1000, 9999)]);
    // Crear usuarios inactivos que no deben aparecer
    User::factory()->count(2)->create(['activo' => false]);

    $respuesta = $this->actingAs($usuarioConPermiso)
        ->getJson('/api/usuarios?filter[activo]=1&sort=name&per_page=5')
        ->assertOk()
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'per_page', 'total'],
            'links',
        ]);

    $meta = $respuesta->json('meta');
    expect($meta['per_page'])->toBe(5);

    $data = $respuesta->json('data');
    foreach ($data as $usuario) {
        expect($usuario['activo'])->toBeTrue();
    }
});
