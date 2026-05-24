<?php

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

/*
|--------------------------------------------------------------------------
| Tests de Autenticación — Sanctum SPA
|--------------------------------------------------------------------------
|
| Cubre los escenarios T-B-01 a T-B-10 del spec.
| Contrato unificado (Opción B): POST /login retorna UsuarioResource.
|
*/

beforeEach(function () {
    // Limpia el rate limiter antes de cada test para evitar interferencias
    RateLimiter::clear('login');
});

// T-B-01: Login exitoso retorna 200 y UsuarioResource
test('login exitoso retorna 200 y datos del usuario en UsuarioResource', function () {
    $usuario = User::factory()->create(['password' => 'admin1234']);

    $this->postJson('/login', [
        'email' => $usuario->email,
        'password' => 'admin1234',
    ])
        ->assertOk()
        ->assertJsonStructure(['data' => ['id', 'name', 'email']])
        ->assertJsonMissing(['password'])
        ->assertJsonMissing(['remember_token']);
});

// T-B-02: Login con password incorrecta retorna 422
test('login con credenciales inválidas retorna 422', function () {
    $usuario = User::factory()->create();

    $this->postJson('/login', [
        'email' => $usuario->email,
        'password' => 'wrongpassword',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

// T-B-03: Login sin email retorna 422 con error de campo
test('login sin email retorna 422', function () {
    $this->postJson('/login', ['password' => 'admin1234'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

// T-B-04: Login sin password retorna 422 con error de campo
test('login sin password retorna 422', function () {
    $this->postJson('/login', ['email' => 'test@test.com'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

// T-B-05: Obtener usuario autenticado retorna 200
test('obtener usuario autenticado retorna datos', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)
        ->getJson('/api/usuario')
        ->assertOk()
        ->assertJsonStructure(['data' => ['id', 'name', 'email']])
        ->assertJson(['data' => ['id' => $usuario->id, 'email' => $usuario->email]]);
});

// T-B-06: Obtener usuario sin autenticación retorna 401
test('obtener usuario sin autenticación retorna 401', function () {
    $this->getJson('/api/usuario')
        ->assertUnauthorized();
});

// T-B-07: Logout exitoso retorna 204
test('logout invalida la sesión y retorna 204', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)
        ->postJson('/logout')
        ->assertNoContent();
});

// T-B-08: Logout sin sesión retorna 401
test('logout sin autenticación retorna 401', function () {
    $this->postJson('/logout')
        ->assertUnauthorized();
});

// T-B-09: Rate limiting bloquea después de 5 intentos fallidos
test('rate limiting bloquea después de 5 intentos', function () {
    $usuario = User::factory()->create();

    foreach (range(1, 5) as $i) {
        $this->postJson('/login', [
            'email' => $usuario->email,
            'password' => 'wrongpassword',
        ]);
    }

    $this->postJson('/login', [
        'email' => $usuario->email,
        'password' => 'wrongpassword',
    ])->assertStatus(429);
});
