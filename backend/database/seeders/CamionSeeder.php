<?php

namespace Database\Seeders;

use App\Models\Camion;
use Faker\Factory as FakerFactory;
use Illuminate\Database\Seeder;

class CamionSeeder extends Seeder
{
    /**
     * Crea 10 camiones de prueba (C001..C010) en estado 'en_ruta_vacio'.
     * Idempotente — usa firstOrCreate.
     */
    public function run(): void
    {
        $faker = FakerFactory::create('es_PE');

        $modelos = [
            'Caterpillar 793F',
            'Komatsu 930E',
            'Volvo FMX',
            'Scania G500',
        ];

        for ($i = 1; $i <= 10; $i++) {
            $codigo = sprintf('C%03d', $i);

            Camion::firstOrCreate(
                ['codigo' => $codigo],
                [
                    'patente' => strtoupper($faker->bothify('???-###')),
                    'modelo' => $faker->randomElement($modelos),
                    'capacidad_toneladas' => $faker->randomFloat(2, 100, 300),
                    'estado_actual' => 'en_ruta_vacio',
                    'activo' => true,
                ]
            );
        }

        Camion::updateOrCreate(
            ['codigo' => 'REAL-01'],
            [
                'codigo' => 'REAL-01',
                'patente' => 'REAL-001',
                'modelo' => 'Vehículo de seguimiento real (ESP32)',
                'capacidad_toneladas' => 0,
                'estado_actual' => 'en_ruta_vacio',
                'activo' => true,
                'es_real' => true,
            ],
        );
    }
}
