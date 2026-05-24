<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posiciones_camion', function (Blueprint $table) {
            $table->unsignedTinyInteger('calidad_gps')->nullable()->after('estado');
            $table->unsignedTinyInteger('satelites')->nullable()->after('calidad_gps');
            $table->decimal('roll_grados', 5, 2)->nullable()->after('satelites');
            $table->decimal('pitch_grados', 5, 2)->nullable()->after('roll_grados');
            $table->boolean('tolva_cerrada')->nullable()->after('pitch_grados');
            $table->unsignedTinyInteger('salud_via')->nullable()->after('tolva_cerrada');
            $table->smallInteger('temperatura_motor')->nullable()->after('salud_via');
        });
    }

    public function down(): void
    {
        Schema::table('posiciones_camion', function (Blueprint $table) {
            $table->dropColumn([
                'calidad_gps',
                'satelites',
                'roll_grados',
                'pitch_grados',
                'tolva_cerrada',
                'salud_via',
                'temperatura_motor',
            ]);
        });
    }
};
