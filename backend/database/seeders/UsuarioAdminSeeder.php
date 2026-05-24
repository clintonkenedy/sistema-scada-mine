<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UsuarioAdminSeeder extends Seeder
{
    /**
     * Crea el usuario administrador del sistema.
     * Idempotente — usa firstOrCreate para no fallar si se corre dos veces.
     * El cast 'hashed' del modelo User hashea el password automáticamente.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@scada.local'],
            [
                'name' => 'Administrador SCADA',
                'password' => env('ADMIN_PASSWORD', 'admin1234'),
            ]
        );
    }
}
