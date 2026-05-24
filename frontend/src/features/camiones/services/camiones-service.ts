import api from '@/shared/services/api'
import type {
  Camion,
  CrearCamionForm,
  EditarCamionForm,
} from '../types/camion'

export async function obtenerCamion(id: number): Promise<Camion> {
  const { data } = await api.get<{ data: Camion }>(`/api/camiones/${id}`)
  return data.data
}

export async function crearCamion(datos: CrearCamionForm): Promise<Camion> {
  const { data } = await api.post<{ data: Camion }>('/api/camiones', datos)
  return data.data
}

export async function actualizarCamion(
  id: number,
  datos: EditarCamionForm,
): Promise<Camion> {
  const { data } = await api.put<{ data: Camion }>(`/api/camiones/${id}`, datos)
  return data.data
}

export async function eliminarCamion(id: number): Promise<void> {
  await api.delete(`/api/camiones/${id}`)
}

export async function toggleActivoCamion(id: number): Promise<Camion> {
  const { data } = await api.post<{ data: Camion }>(
    `/api/camiones/${id}/toggle-activo`,
  )
  return data.data
}
