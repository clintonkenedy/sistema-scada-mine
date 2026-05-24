import api from '@/shared/services/api'
import type { CredencialesLogin, Usuario } from '../types/sesion'

/**
 * Login exitoso: el backend retorna UsuarioResource (Opción B — contrato unificado).
 * El hook useLogin usa este usuario para poblar directamente el cache de TanStack Query
 * con setQueryData(), evitando un segundo request innecesario a /api/usuario.
 */
export async function login(credenciales: CredencialesLogin): Promise<Usuario> {
  const { data } = await api.post<{ data: Usuario }>('/login', credenciales)
  return data.data // UsuarioResource envuelve en { data: {...} }
}

export async function logout(): Promise<void> {
  await api.post('/logout')
}

/**
 * Usado en hydration (recarga de página). Durante el flujo de login normal
 * no se llama porque el cache ya está poblado desde useLogin.onSuccess.
 */
export async function obtenerUsuario(): Promise<Usuario> {
  const { data } = await api.get<{ data: Usuario }>('/api/usuario')
  return data.data // UsuarioResource envuelve en { data: {...} }
}
