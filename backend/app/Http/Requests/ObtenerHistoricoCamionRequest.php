<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ObtenerHistoricoCamionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ventana' => 'sometimes|string|in:5min,1h,6h,24h',
            'desde' => 'sometimes|date',
            'hasta' => 'sometimes|date|after_or_equal:desde',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ventana.in' => 'La ventana debe ser una de: 5min, 1h, 6h, 24h',
            'hasta.after_or_equal' => 'La fecha "hasta" debe ser posterior o igual a "desde"',
        ];
    }
}
