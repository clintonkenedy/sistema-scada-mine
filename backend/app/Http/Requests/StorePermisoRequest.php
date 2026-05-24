<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermisoRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para crear un nuevo permiso.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z]+\.[a-z_]+$/',
                'unique:permissions,name',
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
            'name.required' => 'El nombre del permiso es obligatorio.',
            'name.string' => 'El nombre del permiso debe ser una cadena de texto.',
            'name.max' => 'El nombre del permiso no puede superar los 100 caracteres.',
            'name.regex' => 'El nombre del permiso debe tener el formato módulo.acción (ej: usuarios.ver). Solo se permiten letras minúsculas, punto como separador y guiones bajos en la acción.',
            'name.unique' => 'Ya existe un permiso con ese nombre.',
        ];
    }
}
