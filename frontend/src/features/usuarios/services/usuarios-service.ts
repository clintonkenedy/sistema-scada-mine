import api from '@/shared/services/api'
import type {
  UsuarioGestion,
  CrearUsuarioForm,
  EditarUsuarioForm,
  AsignarRolUsuarioForm,
} from '../types/usuario'

export async function obtenerUsuario(id: number): Promise<UsuarioGestion> {
  const { data } = await api.get<{ data: UsuarioGestion }>(`/api/usuarios/${id}`)
  return data.data
}

export async function crearUsuario(datos: CrearUsuarioForm): Promise<UsuarioGestion> {
  const { data } = await api.post<{ data: UsuarioGestion }>('/api/usuarios', datos)
  return data.data
}

export async function actualizarUsuario(
  id: number,
  datos: EditarUsuarioForm,
): Promise<UsuarioGestion> {
  const { data } = await api.put<{ data: UsuarioGestion }>(`/api/usuarios/${id}`, datos)
  return data.data
}

export async function eliminarUsuario(id: number): Promise<void> {
  await api.delete(`/api/usuarios/${id}`)
}

export async function asignarRol(
  id: number,
  datos: AsignarRolUsuarioForm,
): Promise<UsuarioGestion> {
  const { data } = await api.post<{ data: UsuarioGestion }>(
    `/api/usuarios/${id}/rol`,
    datos,
  )
  return data.data
}

export async function toggleActivo(id: number): Promise<UsuarioGestion> {
  const { data } = await api.post<{ data: UsuarioGestion }>(
    `/api/usuarios/${id}/toggle-activo`,
  )
  return data.data
}
