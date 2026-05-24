<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AutenticacionController extends Controller
{
    /**
     * Inicia sesión del usuario.
     * Contrato unificado (Opción B): retorna UsuarioResource para que el frontend
     * lo cachee directamente con setQueryData() sin un segundo request.
     */
    public function login(LoginRequest $request): UsuarioResource
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        // Verificar que el usuario esté activo — se bloquea con el mismo mensaje de credenciales
        // para no revelar el estado real de la cuenta (security by obscurity)
        $usuario = $request->user();
        if ($usuario !== null && $usuario->activo === false) {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $request->session()->regenerate();

        return new UsuarioResource($request->user());
    }

    /**
     * Cierra la sesión del usuario.
     * Retorna 204 No Content — NO redirect.
     */
    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
