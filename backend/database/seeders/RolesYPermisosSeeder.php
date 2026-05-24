<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesYPermisosSeeder extends Seeder
{
    /**
     * Define el árbol de módulos y acciones del sistema.
     * Fuente de verdad para permisos canónicos.
     *
     * @return array<string, list<string>>
     */
    public static function arbolModulos(): array
    {
        return [
            // Gestión RBAC del sistema
            'usuarios' => ['ver', 'crear', 'editar', 'eliminar', 'asignar_rol', 'toggle_activo'],
            'roles' => ['ver', 'crear', 'editar', 'eliminar', 'asignar_permisos'],
            'permisos' => ['ver', 'crear', 'editar', 'eliminar'],

            // Módulos SCADA
            'dashboard' => ['ver'],
            'sensores' => ['ver', 'crear', 'editar', 'eliminar', 'calibrar'],
            'mediciones' => ['ver', 'exportar'],
            'alertas' => ['ver', 'reconocer', 'silenciar', 'configurar'],
            'equipos' => ['ver', 'crear', 'editar', 'eliminar'],
            'rutas' => ['ver', 'crear', 'editar', 'eliminar'],
            'reportes' => ['ver', 'generar', 'exportar'],
        ];
    }

    /**
     * Lista de roles iniciales del sistema. Protegidos contra rename y eliminación.
     * Fuente única de verdad — usada por RolController, RolResource y tests.
     *
     * @return list<string>
     */
    public static function rolesIniciales(): array
    {
        return ['developer', 'administrador', 'operador', 'consulta'];
    }

    /**
     * Retorna la lista plana de todos los nombres de permisos canónicos.
     * Usado por Form Requests y Controller para proteger permisos del sistema.
     *
     * @return list<string>
     */
    public static function permisosCanonicos(): array
    {
        $nombres = [];

        foreach (self::arbolModulos() as $modulo => $acciones) {
            foreach ($acciones as $accion) {
                $nombres[] = "{$modulo}.{$accion}";
            }
        }

        return $nombres;
    }

    /**
     * Árbol canónico de permisos del sistema SCADA Mine.
     * Naming: {modulo}.{accion} — todo en minúsculas.
     * Idempotente — usa firstOrCreate para no fallar si se corre múltiples veces.
     */
    public function run(): void
    {
        // 1. Crear árbol canónico de permisos
        $this->crearPermisos();

        // 2. Crear roles y asignar permisos
        $this->crearRoles();

        // 3. Asignar rol administrador al usuario admin existente
        $this->asignarRolAdmin();

        // 4. Crear usuario developer y asignarle su rol
        $this->crearUsuarioDeveloper();

        // 5. Limpiar cache de Spatie
        $this->limpiarCachePermisos();
    }

    /**
     * Crea el árbol canónico de permisos del sistema.
     * Delega a arbolModulos() para evitar duplicación.
     */
    private function crearPermisos(): void
    {
        foreach (self::arbolModulos() as $modulo => $acciones) {
            foreach ($acciones as $accion) {
                Permission::firstOrCreate([
                    'name' => "{$modulo}.{$accion}",
                    'guard_name' => 'web',
                ]);
            }
        }
    }

    /**
     * Crea los 4 roles iniciales del sistema y asigna sus permisos.
     */
    private function crearRoles(): void
    {
        $todosLosPermisos = Permission::where('guard_name', 'web')->get();

        // Permisos de módulos operativos SCADA (sin gestión RBAC)
        $modulosOperativos = ['dashboard', 'sensores', 'mediciones', 'alertas', 'equipos', 'rutas', 'reportes'];
        $permisosOperativos = Permission::where('guard_name', 'web')
            ->where(function ($query) use ($modulosOperativos) {
                foreach ($modulosOperativos as $modulo) {
                    $query->orWhere('name', 'like', "{$modulo}.%");
                }
            })
            ->get();

        // Solo permisos de lectura (*.ver)
        $permisosConsulta = Permission::where('guard_name', 'web')
            ->where('name', 'like', '%.ver')
            ->get();

        // developer — todos los permisos
        $rolDeveloper = Role::firstOrCreate(['name' => 'developer', 'guard_name' => 'web']);
        $rolDeveloper->syncPermissions($todosLosPermisos);

        // administrador — todos los permisos
        $rolAdministrador = Role::firstOrCreate(['name' => 'administrador', 'guard_name' => 'web']);
        $rolAdministrador->syncPermissions($todosLosPermisos);

        // operador — módulos operativos completos; SIN gestión RBAC
        $rolOperador = Role::firstOrCreate(['name' => 'operador', 'guard_name' => 'web']);
        $rolOperador->syncPermissions($permisosOperativos);

        // consulta — solo *.ver en módulos operativos
        $rolConsulta = Role::firstOrCreate(['name' => 'consulta', 'guard_name' => 'web']);
        $rolConsulta->syncPermissions($permisosConsulta);
    }

    /**
     * Busca el usuario admin existente y le asigna el rol administrador.
     * NO recrea el usuario — eso lo hace UsuarioAdminSeeder.
     */
    private function asignarRolAdmin(): void
    {
        $adminUsuario = User::where('email', 'admin@scada.local')->first();

        if ($adminUsuario && ! $adminUsuario->hasRole('administrador')) {
            $adminUsuario->assignRole('administrador');
        }
    }

    /**
     * Crea el usuario developer con credenciales del .env y le asigna el rol developer.
     * Idempotente — usa firstOrCreate.
     */
    private function crearUsuarioDeveloper(): void
    {
        $devUsuario = User::firstOrCreate(
            ['email' => env('DEV_USER_EMAIL', 'dev@scada.local')],
            [
                'name' => 'Developer',
                'nombres' => 'Developer',
                'apellido_paterno' => 'SCADA',
                'password' => env('DEV_USER_PASSWORD', 'dev1234'),
                'activo' => true,
            ]
        );

        if (! $devUsuario->hasRole('developer')) {
            $devUsuario->assignRole('developer');
        }
    }

    /**
     * Limpia el cache de Spatie Permission para forzar recarga de permisos.
     */
    private function limpiarCachePermisos(): void
    {
        $cacheStore = config('permission.cache.store') !== 'default'
            ? config('permission.cache.store')
            : null;

        app('cache')
            ->store($cacheStore)
            ->forget(config('permission.cache.key'));
    }
}
