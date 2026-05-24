<?php

use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Support\Facades\RateLimiter;

/*
|--------------------------------------------------------------------------
| Tests de respuesta enriquecida de sesión RBAC
|--------------------------------------------------------------------------
|
| Verifica que el response de GET /api/usuario y POST /login incluya
| los campos de roles y permisos, y que el login de usuarios inactivos
| sea bloqueado correctamente.
|
*/

beforeEach(function () {
    // Limpia el rate limiter antes de cada test para evitar interferencias
    RateLimiter::clear('login');
});

// S-01: GET /api/usuario retorna roles y permisos en el response
it('GET /api/usuario retorna roles y permisos en el response', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = User::factory()->create();
    $usuario->assignRole('operador');

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/usuario')
        ->assertOk()
        ->assertJsonStructure(['data' => ['id', 'name', 'email', 'roles', 'permisos']]);

    $roles = $respuesta->json('data.roles');
    $permisos = $respuesta->json('data.permisos');

    expect($roles)->toContain('operador');
    expect($permisos)->not->toBeEmpty();
});

// S-02: GET /api/usuario retorna campos adicionales del usuario
it('GET /api/usuario retorna dni, nombres, apellido_paterno, apellido_materno y activo', function () {
    $usuario = User::factory()->create([
        'dni' => '12345678',
        'nombres' => 'Carlos',
        'apellido_paterno' => 'Pérez',
        'apellido_materno' => 'García',
        'activo' => true,
    ]);

    $respuesta = $this->actingAs($usuario)
        ->getJson('/api/usuario')
        ->assertOk()
        ->assertJsonStructure(['data' => [
            'id',
            'name',
            'email',
            'dni',
            'nombres',
            'apellido_paterno',
            'apellido_materno',
            'activo',
            'roles',
            'permisos',
        ]]);

    expect($respuesta->json('data.dni'))->toBe('12345678');
    expect($respuesta->json('data.nombres'))->toBe('Carlos');
    expect($respuesta->json('data.apellido_paterno'))->toBe('Pérez');
    expect($respuesta->json('data.activo'))->toBeTrue();
});

// S-03: Login con usuario activo retorna 200 y UsuarioResource enriquecido
it('login con usuario activo retorna 200 y UsuarioResource con roles y permisos', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $usuario = User::factory()->create([
        'password' => 'password123',
        'activo' => true,
    ]);
    $usuario->assignRole('consulta');

    $respuesta = $this->postJson('/login', [
        'email' => $usuario->email,
        'password' => 'password123',
    ])
        ->assertOk()
        ->assertJsonStructure(['data' => [
            'id',
            'name',
            'email',
            'activo',
            'roles',
            'permisos',
        ]]);

    expect($respuesta->json('data.activo'))->toBeTrue();
    $roles = $respuesta->json('data.roles');
    expect($roles)->toContain('consulta');
});

// S-04: Login con usuario inactivo retorna 422 con error en email
it('login con usuario inactivo retorna 422 con error en el campo email', function () {
    $usuario = User::factory()->create([
        'password' => 'password123',
        'activo' => false,
    ]);

    $this->postJson('/login', [
        'email' => $usuario->email,
        'password' => 'password123',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

// S-05: Logout funciona correctamente y retorna 204
it('logout retorna 204 y cierra la sesión correctamente', function () {
    $usuario = User::factory()->create(['activo' => true]);

    $this->actingAs($usuario)
        ->postJson('/logout')
        ->assertNoContent();
});
