<?php

namespace App\Http\Requests;

use App\Models\ConfiguracionScada;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ActualizarConfiguracionRequest extends FormRequest
{
    /**
     * Autorización manejada vía middleware permission — siempre true aquí.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para actualizar una configuración existente.
     * Solo se permite editar el valor — `clave`, `tipo`, etc. son inmutables (seeded).
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'valor' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Normaliza el booleano antes de validar para aceptar variantes (true/false/1/0).
     */
    protected function prepareForValidation(): void
    {
        $configuracion = $this->configuracionActual();

        if ($configuracion === null) {
            return;
        }

        if ($configuracion->tipo === 'booleano' && $this->has('valor')) {
            $valor = filter_var($this->input('valor'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($valor !== null) {
                $this->merge(['valor' => $valor ? 'true' : 'false']);
            }
        }
    }

    /**
     * Validaciones adicionales en base al tipo y a los límites del parámetro.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $configuracion = $this->configuracionActual();

            if ($configuracion === null) {
                return;
            }

            $valor = $this->input('valor');

            if ($valor === null || $valor === '') {
                return;
            }

            switch ($configuracion->tipo) {
                case 'entero':
                    if (! preg_match('/^-?\d+$/', (string) $valor)) {
                        $v->errors()->add('valor', 'El valor debe ser un número entero.');

                        return;
                    }
                    $this->validarRangoNumerico($v, (float) $valor, $configuracion);
                    break;

                case 'decimal':
                    if (! is_numeric($valor)) {
                        $v->errors()->add('valor', 'El valor debe ser un número decimal.');

                        return;
                    }
                    $this->validarRangoNumerico($v, (float) $valor, $configuracion);
                    break;

                case 'booleano':
                    if (! in_array($valor, ['true', 'false'], true)) {
                        $v->errors()->add('valor', 'El valor debe ser verdadero o falso.');
                    }
                    break;

                case 'texto':
                default:
                    // sin validaciones adicionales
                    break;
            }
        });
    }

    /**
     * Valida que el valor numérico esté dentro de [minimo, maximo] si están definidos.
     */
    private function validarRangoNumerico(Validator $v, float $valor, ConfiguracionScada $configuracion): void
    {
        if ($configuracion->minimo !== null && $valor < $configuracion->minimo) {
            $v->errors()->add('valor', "El valor no puede ser menor a {$configuracion->minimo}.");
        }

        if ($configuracion->maximo !== null && $valor > $configuracion->maximo) {
            $v->errors()->add('valor', "El valor no puede ser mayor a {$configuracion->maximo}.");
        }
    }

    /**
     * Devuelve la configuración apuntada por la ruta (bind por `clave`).
     */
    private function configuracionActual(): ?ConfiguracionScada
    {
        $clave = $this->route('clave');

        if (! is_string($clave) || $clave === '') {
            return null;
        }

        return ConfiguracionScada::where('clave', $clave)->first();
    }

    /**
     * Mensajes de error personalizados en español.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'valor.required' => 'El valor es obligatorio.',
            'valor.string' => 'El valor debe ser una cadena de texto.',
            'valor.max' => 'El valor no puede superar los 255 caracteres.',
        ];
    }
}
