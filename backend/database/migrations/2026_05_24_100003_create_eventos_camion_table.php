<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de eventos (transiciones de estado) de camiones.
     * Solo se inserta cuando cambia estado_actual — no es time-series de posiciones.
     */
    public function up(): void
    {
        Schema::create('eventos_camion', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('camion_id')->constrained('camiones')->cascadeOnDelete();
            $table->string('estado_anterior', 30)->nullable();
            $table->string('estado_nuevo', 30);
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->string('ruta_actual', 100)->nullable();
            $table->timestampTz('timestamp');
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['camion_id', 'timestamp'], 'eventos_camion_camion_ts_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_camion');
    }
};
