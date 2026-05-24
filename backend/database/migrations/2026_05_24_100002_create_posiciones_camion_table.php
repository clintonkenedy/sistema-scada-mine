<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla time-series de posiciones GPS de camiones.
     * Cada fila representa un sample. Index optimizado para queries por camion y rango temporal.
     *
     * Columna geom (geometry POINT 4326) generada vía PostGIS como GENERATED ALWAYS AS (...).
     * Si la BD no es PostgreSQL+PostGIS, se omite (fallback solo lat/lng).
     */
    public function up(): void
    {
        Schema::create('posiciones_camion', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('camion_id')->constrained('camiones')->cascadeOnDelete();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->decimal('velocidad_kmh', 6, 2);
            $table->decimal('rumbo_grados', 5, 2);
            $table->decimal('carga_actual_toneladas', 8, 2)->default(0);
            $table->decimal('combustible_porcentaje', 5, 2);
            $table->string('estado', 30);
            $table->string('ruta_actual', 100)->nullable();
            $table->timestampTz('timestamp');
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['camion_id', 'timestamp'], 'posiciones_camion_camion_ts_idx');
        });

        // Generated geom column + GIST index — solo para PostgreSQL con PostGIS habilitado.
        if (DB::connection()->getDriverName() === 'pgsql') {
            try {
                DB::statement('ALTER TABLE posiciones_camion ADD COLUMN geom geometry(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED');
                DB::statement('CREATE INDEX posiciones_camion_geom_idx ON posiciones_camion USING GIST (geom)');
            } catch (Throwable $e) {
                // Si PostGIS no está disponible, dejamos solo lat/lng — log para follow-up.
                logger()->warning('No se pudo crear columna geom PostGIS en posiciones_camion: '.$e->getMessage());
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('posiciones_camion');
    }
};
