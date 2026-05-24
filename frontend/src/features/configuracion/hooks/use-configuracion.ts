import { useQuery } from '@tanstack/react-query'
import { obtenerConfiguraciones } from '../services/configuracion-service'

export const QUERY_KEY_CONFIGURACION = ['configuracion-scada'] as const

export function useConfiguracion() {
  return useQuery({
    queryKey: QUERY_KEY_CONFIGURACION,
    queryFn: obtenerConfiguraciones,
    staleTime: 30 * 1000, // 30s
  })
}
