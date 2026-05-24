<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUsuarioRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para actualizar un usuario existente.
     * Todos los campos son opcionales (sometimes) — solo se actualizan los que se envían.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        /** @var User $usuario */
        $usuario = $this->route('usuario');
        $usuarioId = $usuario->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', "unique:users,email,{$usuarioId}"],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'dni' => ['sometimes', 'nullable', 'string', 'max:20', "unique:users,dni,{$usuarioId}"],
            'nombres' => ['sometimes', 'string', 'max:100'],
            'apellido_paterno' => ['sometimes', 'string', 'max:100'],
            'apellido_materno' => ['sometimes', 'nullable', 'string', 'max:100'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Mensajes de error personalizados en español.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.string' => 'El nombre debe ser una cadena de texto.',
            'name.max' => 'El nombre no puede superar los 255 caracteres.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'email.unique' => 'Ya existe un usuario con ese correo electrónico.',
            'password.string' => 'La contraseña debe ser una cadena de texto.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'dni.string' => 'El DNI debe ser una cadena de texto.',
            'dni.max' => 'El DNI no puede superar los 20 caracteres.',
            'dni.unique' => 'Ya existe un usuario con ese DNI.',
            'nombres.string' => 'Los nombres deben ser una cadena de texto.',
            'nombres.max' => 'Los nombres no pueden superar los 100 caracteres.',
            'apellido_paterno.string' => 'El apellido paterno debe ser una cadena de texto.',
            'apellido_paterno.max' => 'El apellido paterno no puede superar los 100 caracteres.',
            'apellido_materno.string' => 'El apellido materno debe ser una cadena de texto.',
            'apellido_materno.max' => 'El apellido materno no puede superar los 100 caracteres.',
            'activo.boolean' => 'El campo activo debe ser verdadero o falso.',
        ];
    }
}
