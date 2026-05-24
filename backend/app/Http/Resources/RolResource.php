<?php

namespace App\Http\Resources;

use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RolResource extends JsonResource
{
    /**
     * Transforma el modelo Role de Spatie en un array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'guard_name' => $this->guard_name,
            'es_inicial' => in_array($this->name, RolesYPermisosSeeder::rolesIniciales(), true),
            'permisos' => PermisoResource::collection($this->whenLoaded('permissions')),
            'cantidad_usuarios' => $this->users()->count(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
