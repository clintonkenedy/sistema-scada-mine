import api from '@/shared/services/api'
import type { HistoricoCamion, VentanaHistorico } from '../types/historico'

/**
 * Obtiene el histórico (agregados + series temporales) de un camión para una
 * ventana de tiempo. El backend exige el permiso `camiones.ver_historico`.
 */
export async function obtenerHistoricoCamion(
  camionId: number,
  ventana: VentanaHistorico,
): Promise<HistoricoCamion> {
  const { data } = await api.get<HistoricoCamion>(
    `/api/camiones/${camionId}/historico`,
    { params: { ventana } },
  )
  return data
}
