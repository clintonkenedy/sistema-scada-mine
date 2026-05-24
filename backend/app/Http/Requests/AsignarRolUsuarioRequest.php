<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AsignarRolUsuarioRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para asignar un rol a un usuario.
     * El sistema asume 1 rol por usuario — syncRoles reemplaza.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'rol' => ['required', 'string', 'exists:roles,name'],
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
            'rol.required' => 'El rol es obligatorio.',
            'rol.string' => 'El rol debe ser una cadena de texto.',
            'rol.exists' => 'El rol especificado no existe en el sistema.',
        ];
    }
}
