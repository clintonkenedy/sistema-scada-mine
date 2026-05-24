<?php

use App\Http\Controllers\AutenticacionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/login', [AutenticacionController::class, 'login'])
    ->middleware('throttle:5,1')
    ->name('login');

Route::post('/logout', [AutenticacionController::class, 'logout'])
    ->middleware('auth:sanctum')
    ->name('logout');
