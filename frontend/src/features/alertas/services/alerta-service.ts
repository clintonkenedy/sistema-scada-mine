import api from '@/shared/services/api'
import type { Alerta, ContadoresAlertas } from '../types/alerta'

export async function obtenerContadores(): Promise<ContadoresAlertas> {
  const { data } = await api.get<ContadoresAlertas>('/api/alertas/contadores')
  return data
}

export async function marcarLeida(id: number): Promise<Alerta> {
  const { data } = await api.patch<{ data: Alerta }>(`/api/alertas/${id}/marcar-leida`)
  return data.data
}

export async function marcarTodasLeidas(): Promise<{ actualizadas: number }> {
  const { data } = await api.post<{ actualizadas: number }>('/api/alertas/marcar-todas-leidas')
  return data
}
