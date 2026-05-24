<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('camiones', function (Blueprint $table) {
            $table->boolean('es_real')->default(false)->after('activo');
            $table->index('es_real');
        });
    }

    public function down(): void
    {
        Schema::table('camiones', function (Blueprint $table) {
            $table->dropIndex(['es_real']);
            $table->dropColumn('es_real');
        });
    }
};
