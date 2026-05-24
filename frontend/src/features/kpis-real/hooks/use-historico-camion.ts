import { useQuery } from '@tanstack/react-query'
import { obtenerHistoricoCamion } from '../services/historico-service'
import type { VentanaHistorico } from '../types/historico'

export const QUERY_KEY_HISTORICO_CAMION = 'historico-camion'

/**
 * Trae el histórico de un camión para la ventana indicada y lo refresca cada
 * 30s. Si `camionId` es null la query queda en pausa.
 */
export function useHistoricoCamion(
  camionId: number | null,
  ventana: VentanaHistorico,
) {
  return useQuery({
    queryKey: [QUERY_KEY_HISTORICO_CAMION, camionId, ventana],
    queryFn: () => obtenerHistoricoCamion(camionId as number, ventana),
    enabled: camionId !== null,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
