<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega campos de perfil y control RBAC a la tabla users.
     * Los campos de nombre son nullable para no romper usuarios existentes.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('dni', 20)->nullable()->after('email');
            $table->string('nombres', 100)->nullable()->after('dni');
            $table->string('apellido_paterno', 100)->nullable()->after('nombres');
            $table->string('apellido_materno', 100)->nullable()->after('apellido_paterno');
            $table->boolean('activo')->default(true)->after('apellido_materno');
            $table->softDeletes()->after('activo');
        });
    }

    /**
     * Revierte los cambios a la tabla users.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['dni', 'nombres', 'apellido_paterno', 'apellido_materno', 'activo']);
        });
    }
};
