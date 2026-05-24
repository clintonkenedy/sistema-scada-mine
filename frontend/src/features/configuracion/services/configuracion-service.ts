import api from '@/shared/services/api'
import type { ConfiguracionScada } from '../types/configuracion'

export async function obtenerConfiguraciones(): Promise<ConfiguracionScada[]> {
  const { data } = await api.get<{ data: ConfiguracionScada[] }>(
    '/api/configuracion-scada',
  )
  return data.data
}

export async function actualizarConfiguracion(
  clave: string,
  valor: string,
): Promise<ConfiguracionScada> {
  const { data } = await api.put<{ data: ConfiguracionScada }>(
    `/api/configuracion-scada/${clave}`,
    { valor },
  )
  return data.data
}
