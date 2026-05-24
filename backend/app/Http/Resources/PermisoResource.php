<?php

namespace App\Http\Resources;

use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermisoResource extends JsonResource
{
    /**
     * Transforma el modelo Permission en un array JSON.
     * Incluye módulo y acción derivados del nombre, y si es canónico del sistema.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        [$modulo, $accion] = $this->parsearNombre($this->name);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'guard_name' => $this->guard_name,
            'modulo' => $modulo,
            'accion' => $accion,
            'es_canonico' => in_array($this->name, RolesYPermisosSeeder::permisosCanonicos(), true),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Parsea el nombre del permiso y retorna [módulo, acción].
     * Formato esperado: módulo.accion (ej: usuarios.ver)
     *
     * @return array{string, string}
     */
    private function parsearNombre(string $nombre): array
    {
        $partes = explode('.', $nombre, 2);

        return [
            $partes[0] ?? $nombre,
            $partes[1] ?? '',
        ];
    }
}
