<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla maestra de camiones de la mina.
     * Mantiene la última posición conocida en denormalizado para acceso rápido.
     */
    public function up(): void
    {
        Schema::create('camiones', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->string('patente', 20)->unique()->nullable();
            $table->string('modelo', 100);
            $table->decimal('capacidad_toneladas', 8, 2);
            $table->string('estado_actual', 30);
            $table->boolean('activo')->default(true);
            $table->decimal('ultima_lat', 10, 7)->nullable();
            $table->decimal('ultima_lng', 10, 7)->nullable();
            $table->timestamp('ultima_actualizacion')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('codigo');
            $table->index('estado_actual');
            $table->index('activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camiones');
    }
};
