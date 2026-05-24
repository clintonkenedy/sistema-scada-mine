<?php

namespace App\Http\Requests;

use App\Models\Camion;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCamionRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para actualizar un camión existente.
     * Todos los campos son opcionales (sometimes) — solo se actualizan los que se envían.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        /** @var Camion $camion */
        $camion = $this->route('camion');
        $camionId = $camion->id;

        return [
            'codigo' => ['sometimes', 'string', 'max:20', "unique:camiones,codigo,{$camionId}", 'regex:/^[A-Z0-9-]+$/'],
            'patente' => ['sometimes', 'nullable', 'string', 'max:20', "unique:camiones,patente,{$camionId}"],
            'modelo' => ['sometimes', 'string', 'max:100'],
            'capacidad_toneladas' => ['sometimes', 'numeric', 'min:0', 'max:9999.99'],
            'estado_actual' => ['sometimes', 'string', 'in:en_ruta_vacio,en_carguio,en_ruta_cargado,descargando,detenido,mantenimiento'],
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
            'codigo.string' => 'El código debe ser una cadena de texto.',
            'codigo.max' => 'El código no puede superar los 20 caracteres.',
            'codigo.unique' => 'Ya existe un camión con ese código.',
            'codigo.regex' => 'El código solo puede contener letras mayúsculas, números y guiones.',
            'patente.string' => 'La patente debe ser una cadena de texto.',
            'patente.max' => 'La patente no puede superar los 20 caracteres.',
            'patente.unique' => 'Ya existe un camión con esa patente.',
            'modelo.string' => 'El modelo debe ser una cadena de texto.',
            'modelo.max' => 'El modelo no puede superar los 100 caracteres.',
            'capacidad_toneladas.numeric' => 'La capacidad debe ser un valor numérico.',
            'capacidad_toneladas.min' => 'La capacidad no puede ser negativa.',
            'capacidad_toneladas.max' => 'La capacidad no puede superar 9999.99 toneladas.',
            'estado_actual.string' => 'El estado debe ser una cadena de texto.',
            'estado_actual.in' => 'El estado actual no es válido.',
            'activo.boolean' => 'El campo activo debe ser verdadero o falso.',
            'es_real.boolean' => 'El campo es_real debe ser verdadero o falso.',
        ];
    }
}
