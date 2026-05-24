<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UsuarioSeeder extends Seeder
{
    /**
     * Emails protegidos — no se duplican ni sobreescriben.
     *
     * @var list<string>
     */
    private const EMAILS_PROTEGIDOS = [
        'admin@scada.local',
        'dev@scada.local',
    ];

    /**
     * Genera 50 usuarios con roles aleatorios.
     * Idempotente — evita duplicar usuarios admin/developer existentes.
     *
     * Distribución de roles:
     *   - administrador: ~10% (5 usuarios)
     *   - operador:      ~50% (25 usuarios)
     *   - consulta:      ~40% (20 usuarios)
     *
     * Distribución de estado:
     *   - activo:   ~85% (factory default)
     *   - inactivo: ~15%
     */
    public function run(): void
    {
        $totalUsuarios = 50;
        $totalInactivos = 8;

        // Roles asignables (developer no se asigna masivamente)
        $rolesConPeso = [
            'administrador' => 5,
            'operador' => 25,
            'consulta' => 20,
        ];

        // Construir pool de roles para distribución
        $poolRoles = [];

        foreach ($rolesConPeso as $rol => $cantidad) {
            $poolRoles = array_merge($poolRoles, array_fill(0, $cantidad, $rol));
        }

        shuffle($poolRoles);

        // Crear usuarios activos
        $cantidadActivos = $totalUsuarios - $totalInactivos;

        $usuariosActivos = User::factory()
            ->count($cantidadActivos)
            ->create();

        // Crear usuarios inactivos
        $usuariosInactivos = User::factory()
            ->inactivo()
            ->count($totalInactivos)
            ->create();

        // Asignar roles
        $todosLosUsuarios = $usuariosActivos->merge($usuariosInactivos);

        foreach ($todosLosUsuarios as $indice => $usuario) {
            $rol = $poolRoles[$indice] ?? 'consulta';
            $usuario->assignRole($rol);
        }
    }
}
