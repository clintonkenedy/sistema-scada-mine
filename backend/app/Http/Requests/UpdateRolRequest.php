<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Spatie\Permission\Models\Role;

class UpdateRolRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para actualizar un rol.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        /** @var Role $rol */
        $rol = $this->route('rol');
        $rolId = $rol->id;

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z_-]+$/',
                "unique:roles,name,{$rolId}",
            ],
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
            'name.required' => 'El nombre del rol es obligatorio.',
            'name.string' => 'El nombre del rol debe ser una cadena de texto.',
            'name.max' => 'El nombre del rol no puede superar los 100 caracteres.',
            'name.regex' => 'El nombre del rol solo puede contener letras minúsculas, guiones y guiones bajos.',
            'name.unique' => 'Ya existe un rol con ese nombre.',
        ];
    }
}
