<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUsuarioRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para crear un nuevo usuario.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'dni' => ['nullable', 'string', 'max:20', 'unique:users,dni'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'activo' => ['nullable', 'boolean'],
            'rol' => ['nullable', 'string', 'exists:roles,name'],
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
            'name.required' => 'El nombre de usuario es obligatorio.',
            'name.string' => 'El nombre debe ser una cadena de texto.',
            'name.max' => 'El nombre no puede superar los 255 caracteres.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'email.unique' => 'Ya existe un usuario con ese correo electrónico.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.string' => 'La contraseña debe ser una cadena de texto.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'dni.string' => 'El DNI debe ser una cadena de texto.',
            'dni.max' => 'El DNI no puede superar los 20 caracteres.',
            'dni.unique' => 'Ya existe un usuario con ese DNI.',
            'nombres.required' => 'Los nombres son obligatorios.',
            'nombres.string' => 'Los nombres deben ser una cadena de texto.',
            'nombres.max' => 'Los nombres no pueden superar los 100 caracteres.',
            'apellido_paterno.required' => 'El apellido paterno es obligatorio.',
            'apellido_paterno.string' => 'El apellido paterno debe ser una cadena de texto.',
            'apellido_paterno.max' => 'El apellido paterno no puede superar los 100 caracteres.',
            'apellido_materno.string' => 'El apellido materno debe ser una cadena de texto.',
            'apellido_materno.max' => 'El apellido materno no puede superar los 100 caracteres.',
            'activo.boolean' => 'El campo activo debe ser verdadero o falso.',
            'rol.string' => 'El rol debe ser una cadena de texto.',
            'rol.exists' => 'El rol especificado no existe en el sistema.',
        ];
    }
}
