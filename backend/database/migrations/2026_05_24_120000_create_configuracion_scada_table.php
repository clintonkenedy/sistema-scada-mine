<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de configuración key-value del sistema SCADA.
     * Permite parámetros runtime-tunables consumidos por el simulador Python
     * y editables desde el frontend vía REST.
     */
    public function up(): void
    {
        Schema::create('configuracion_scada', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 100)->unique();
            $table->string('valor', 255);
            $table->enum('tipo', ['entero', 'decimal', 'texto', 'booleano'])->default('texto');
            $table->text('descripcion')->nullable();
            $table->string('unidad', 20)->nullable();
            $table->decimal('minimo', 10, 2)->nullable();
            $table->decimal('maximo', 10, 2)->nullable();
            $table->foreignId('modificado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('clave');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_scada');
    }
};
