<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCamionRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para crear un nuevo camión.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:20', 'unique:camiones,codigo', 'regex:/^[A-Z0-9-]+$/'],
            'patente' => ['nullable', 'string', 'max:20', 'unique:camiones,patente'],
            'modelo' => ['required', 'string', 'max:100'],
            'capacidad_toneladas' => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'estado_actual' => ['required', 'string', 'in:en_ruta_vacio,en_carguio,en_ruta_cargado,descargando,detenido,mantenimiento'],
            'activo' => ['sometimes', 'boolean'],
            'es_real' => ['sometimes', 'boolean'],
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
            'codigo.required' => 'El código del camión es obligatorio.',
            'codigo.string' => 'El código debe ser una cadena de texto.',
            'codigo.max' => 'El código no puede superar los 20 caracteres.',
            'codigo.unique' => 'Ya existe un camión con ese código.',
            'codigo.regex' => 'El código solo puede contener letras mayúsculas, números y guiones.',
            'patente.string' => 'La patente debe ser una cadena de texto.',
            'patente.max' => 'La patente no puede superar los 20 caracteres.',
            'patente.unique' => 'Ya existe un camión con esa patente.',
            'modelo.required' => 'El modelo del camión es obligatorio.',
            'modelo.string' => 'El modelo debe ser una cadena de texto.',
            'modelo.max' => 'El modelo no puede superar los 100 caracteres.',
            'capacidad_toneladas.required' => 'La capacidad en toneladas es obligatoria.',
            'capacidad_toneladas.numeric' => 'La capacidad debe ser un valor numérico.',
            'capacidad_toneladas.min' => 'La capacidad no puede ser negativa.',
            'capacidad_toneladas.max' => 'La capacidad no puede superar 9999.99 toneladas.',
            'estado_actual.required' => 'El estado actual del camión es obligatorio.',
            'estado_actual.string' => 'El estado debe ser una cadena de texto.',
            'estado_actual.in' => 'El estado actual no es válido.',
            'activo.boolean' => 'El campo activo debe ser verdadero o falso.',
            'es_real.boolean' => 'El campo es_real debe ser verdadero o falso.',
        ];
    }
}
