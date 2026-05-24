<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AsignarPermisosRolRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para sincronizar permisos de un rol.
     * El array PUEDE estar vacío para quitar todos los permisos — usar 'present' no 'required'.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'permisos' => ['present', 'array'],
            'permisos.*' => ['string', 'exists:permissions,name'],
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
            'permisos.present' => 'La clave permisos debe estar presente en la solicitud (puede ser un array vacío para quitar todos).',
            'permisos.array' => 'Los permisos deben enviarse como un array.',
            'permisos.*.string' => 'Cada permiso debe ser una cadena de texto.',
            'permisos.*.exists' => 'Uno o más permisos especificados no existen en el sistema.',
        ];
    }
}
