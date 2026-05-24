<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    /**
     * Transforma el modelo en un array JSON.
     * Whitelist estricta por seguridad — solo expone campos seguros.
     * Usado tanto en POST /login como en GET /api/usuario.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'dni' => $this->dni,
            'nombres' => $this->nombres,
            'apellido_paterno' => $this->apellido_paterno,
            'apellido_materno' => $this->apellido_materno,
            'activo' => $this->activo ?? true,
            'roles' => $this->getRoleNames()->toArray(),
            'permisos' => $this->getAllPermissions()->pluck('name')->toArray(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
