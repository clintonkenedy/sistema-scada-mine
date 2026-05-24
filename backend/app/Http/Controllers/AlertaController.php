<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\AlertaResource;
use App\Models\Alerta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AlertaController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $alertas = QueryBuilder::for(Alerta::class)
            ->with('camion')
            ->allowedFilters([
                AllowedFilter::exact('camion_id'),
                AllowedFilter::exact('tipo'),
                AllowedFilter::exact('severidad'),
                AllowedFilter::callback('leida', function ($q, $value) {
                    $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    if ($bool) {
                        $q->whereNotNull('leida_at');
                    } else {
                        $q->whereNull('leida_at');
                    }
                }),
                AllowedFilter::callback('desde', function ($q, $value) {
                    $q->where('timestamp', '>=', $value);
                }),
                AllowedFilter::callback('hasta', function ($q, $value) {
                    $q->where('timestamp', '<=', $value);
                }),
            ])
            ->allowedSorts(['timestamp', 'severidad', 'created_at'])
            ->defaultSort('-timestamp')
            ->paginate((int) request()->input('per_page', 20));

        return AlertaResource::collection($alertas);
    }

    public function show(Alerta $alerta): AlertaResource
    {
        $alerta->load('camion');

        return new AlertaResource($alerta);
    }

    public function marcarLeida(Alerta $alerta): AlertaResource
    {
        if ($alerta->leida_at === null) {
            $alerta->update([
                'leida_at' => now(),
                'leida_por_user_id' => auth()->id(),
            ]);
        }
        $alerta->load('camion');

        return new AlertaResource($alerta);
    }

    public function marcarTodasLeidas(): JsonResponse
    {
        $cantidad = Alerta::whereNull('leida_at')->update([
            'leida_at' => now(),
            'leida_por_user_id' => auth()->id(),
        ]);

        return response()->json(['actualizadas' => $cantidad]);
    }

    public function contadores(): JsonResponse
    {
        return response()->json([
            'no_leidas' => Alerta::whereNull('leida_at')->count(),
            'no_leidas_por_severidad' => [
                'info' => Alerta::whereNull('leida_at')->where('severidad', 'info')->count(),
                'warning' => Alerta::whereNull('leida_at')->where('severidad', 'warning')->count(),
                'danger' => Alerta::whereNull('leida_at')->where('severidad', 'danger')->count(),
            ],
        ]);
    }
}
