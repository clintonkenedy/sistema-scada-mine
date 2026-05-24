<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camion_id')->constrained('camiones')->cascadeOnDelete();
            $table->string('tipo', 50);
            $table->string('severidad', 20);
            $table->string('titulo', 200);
            $table->text('mensaje')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->string('zona_nombre', 100)->nullable();
            $table->string('estado_anterior', 30)->nullable();
            $table->string('estado_nuevo', 30)->nullable();
            $table->jsonb('contexto')->nullable();
            $table->timestampTz('timestamp');
            $table->timestampTz('leida_at')->nullable();
            $table->foreignId('leida_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('created_at');

            $table->index(['camion_id', 'timestamp']);
            $table->index('severidad');
            $table->index('tipo');
            $table->index('leida_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas');
    }
};
