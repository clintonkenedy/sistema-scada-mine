import api from '@/shared/services/api'
import type { Rol, RolPaginado, CrearRolForm, EditarRolForm } from '../types/rol'

export interface ParamsListarRoles {
  per_page?: number
  buscar?: string
  page?: number
}

export async function listarRoles(params?: ParamsListarRoles): Promise<RolPaginado> {
  const { data } = await api.get<RolPaginado>('/api/roles', { params })
  return data
}

export async function obtenerRol(id: number): Promise<Rol> {
  const { data } = await api.get<{ data: Rol }>(`/api/roles/${id}`)
  return data.data
}

export async function crearRol(datos: CrearRolForm): Promise<Rol> {
  const { data } = await api.post<{ data: Rol }>('/api/roles', datos)
  return data.data
}

export async function actualizarRol(id: number, datos: EditarRolForm): Promise<Rol> {
  const { data } = await api.put<{ data: Rol }>(`/api/roles/${id}`, datos)
  return data.data
}

export async function sincronizarPermisos(id: number, permisos: string[]): Promise<Rol> {
  const { data } = await api.post<{ data: Rol }>(`/api/roles/${id}/permisos`, { permisos })
  return data.data
}

export async function eliminarRol(id: number): Promise<void> {
  await api.delete(`/api/roles/${id}`)
}
