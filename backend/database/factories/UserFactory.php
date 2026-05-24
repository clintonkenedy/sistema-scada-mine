<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Factory para el modelo User.
 * Genera datos realistas con Faker en español (Perú).
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Password cacheado para evitar hashear en cada instancia.
     */
    protected static ?string $password;

    /**
     * Define el estado por defecto del modelo.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = fake('es_PE');

        $nombres = $faker->firstName().' '.$faker->firstName();
        $apellidoPaterno = $faker->lastName();
        $apellidoMaterno = $faker->lastName();

        return [
            'name' => "{$nombres} {$apellidoPaterno} {$apellidoMaterno}",
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'dni' => (string) $faker->unique()->numberBetween(10000000, 99999999),
            'nombres' => $nombres,
            'apellido_paterno' => $apellidoPaterno,
            'apellido_materno' => $apellidoMaterno,
            'activo' => true,
        ];
    }

    /**
     * Estado: email sin verificar.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Estado: usuario inactivo.
     */
    public function inactivo(): static
    {
        return $this->state(fn (array $attributes) => [
            'activo' => false,
        ]);
    }
}
