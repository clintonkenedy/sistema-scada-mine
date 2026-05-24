import api from '@/shared/services/api'
import type { Permiso, CrearPermisoForm, EditarPermisoForm } from '../types/permiso'

export interface ParamsListarPermisos {
  buscar?: string
  per_page?: number
  page?: number
}

export interface RespuestaPermisosPaginada {
  data: Permiso[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export async function listarPermisos(
  params?: ParamsListarPermisos,
): Promise<RespuestaPermisosPaginada> {
  const { data } = await api.get<RespuestaPermisosPaginada>('/api/permisos', {
    params,
  })
  return data
}

export async function crearPermiso(datos: CrearPermisoForm): Promise<Permiso> {
  const { data } = await api.post<{ data: Permiso }>('/api/permisos', datos)
  return data.data
}

export async function obtenerPermiso(id: number): Promise<Permiso> {
  const { data } = await api.get<{ data: Permiso }>(`/api/permisos/${id}`)
  return data.data
}

export async function actualizarPermiso(
  id: number,
  datos: EditarPermisoForm,
): Promise<Permiso> {
  const { data } = await api.put<{ data: Permiso }>(`/api/permisos/${id}`, datos)
  return data.data
}

export async function eliminarPermiso(id: number): Promise<void> {
  await api.delete(`/api/permisos/${id}`)
}
