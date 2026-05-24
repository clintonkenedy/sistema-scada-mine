<?php

namespace App\QueryBuilder\Filters;

use Carbon\Carbon;
use Closure;
use Illuminate\Database\Eloquent\Builder;

class RangeFilters
{
    /**
     * WHERE {column} >= Carbon::parse($value)->startOfDay()
     * Uso: AllowedFilter::callback('created_from', RangeFilters::dateFrom('users.created_at'))
     */
    public static function dateFrom(string $column): Closure
    {
        return fn (Builder $query, $value) => $query->where($column, '>=', Carbon::parse($value)->startOfDay());
    }

    /**
     * WHERE {column} <= Carbon::parse($value)->endOfDay()
     * Uso: AllowedFilter::callback('created_to', RangeFilters::dateTo('users.created_at'))
     */
    public static function dateTo(string $column): Closure
    {
        return fn (Builder $query, $value) => $query->where($column, '<=', Carbon::parse($value)->endOfDay());
    }

    /**
     * WHERE {column} >= $value
     * Uso: AllowedFilter::callback('precio_min', RangeFilters::numericMin('precio'))
     */
    public static function numericMin(string $column): Closure
    {
        return fn (Builder $query, $value) => $query->where($column, '>=', $value);
    }

    /**
     * WHERE {column} <= $value
     * Uso: AllowedFilter::callback('precio_max', RangeFilters::numericMax('precio'))
     */
    public static function numericMax(string $column): Closure
    {
        return fn (Builder $query, $value) => $query->where($column, '<=', $value);
    }
}
