<?php

use App\QueryBuilder\Filters\RangeFilters;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

/*
|--------------------------------------------------------------------------
| Tests unitarios de RangeFilters
|--------------------------------------------------------------------------
|
| Verifica que cada factory estática retorna un Closure que aplica
| la cláusula WHERE correcta al Builder de Eloquent, sin necesidad
| de HTTP request ni contexto de framework.
|
*/

afterEach(fn () => Mockery::close());

it('dateFrom retorna closure que aplica WHERE >= startOfDay', function () {
    Carbon::setTestNow('2026-01-15 12:00:00');

    $builder = Mockery::mock(Builder::class);
    $builder->shouldReceive('where')
        ->once()
        ->with('created_at', '>=', Mockery::on(function ($value) {
            return $value instanceof Carbon
                && $value->format('Y-m-d H:i:s') === '2026-01-15 00:00:00';
        }))
        ->andReturnSelf();

    $closure = RangeFilters::dateFrom('created_at');
    $closure($builder, '2026-01-15');

    Carbon::setTestNow();
});

it('dateTo retorna closure que aplica WHERE <= endOfDay', function () {
    Carbon::setTestNow('2026-12-31 12:00:00');

    $builder = Mockery::mock(Builder::class);
    $builder->shouldReceive('where')
        ->once()
        ->with('created_at', '<=', Mockery::on(function ($value) {
            return $value instanceof Carbon
                && $value->format('Y-m-d H:i:s') === '2026-12-31 23:59:59';
        }))
        ->andReturnSelf();

    $closure = RangeFilters::dateTo('created_at');
    $closure($builder, '2026-12-31');

    Carbon::setTestNow();
});

it('numericMin retorna closure que aplica WHERE >= value', function () {
    $builder = Mockery::mock(Builder::class);
    $builder->shouldReceive('where')
        ->once()
        ->with('edad', '>=', 18)
        ->andReturnSelf();

    $closure = RangeFilters::numericMin('edad');
    $closure($builder, 18);
});

it('numericMax retorna closure que aplica WHERE <= value', function () {
    $builder = Mockery::mock(Builder::class);
    $builder->shouldReceive('where')
        ->once()
        ->with('precio', '<=', 999.99)
        ->andReturnSelf();

    $closure = RangeFilters::numericMax('precio');
    $closure($builder, 999.99);
});

it('dateFrom acepta cualquier columna como parámetro', function () {
    $builder = Mockery::mock(Builder::class);
    $builder->shouldReceive('where')
        ->once()
        ->with('deleted_at', '>=', Mockery::any())
        ->andReturnSelf();

    $closure = RangeFilters::dateFrom('deleted_at');
    $closure($builder, '2026-06-01');
});

it('dateTo acepta cualquier columna como parámetro', function () {
    $builder = Mockery::mock(Builder::class);
    $builder->shouldReceive('where')
        ->once()
        ->with('updated_at', '<=', Mockery::any())
        ->andReturnSelf();

    $closure = RangeFilters::dateTo('updated_at');
    $closure($builder, '2026-03-01');
});
