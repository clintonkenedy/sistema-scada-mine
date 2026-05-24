import { useQuery } from '@tanstack/react-query'
import { obtenerContadores } from '../services/alerta-service'

export const QUERY_KEY_CONTADORES_ALERTAS = ['contadores-alertas'] as const

interface OpcionesContadores {
  enabled?: boolean
}

/**
 * Polling cada 30s del endpoint /api/alertas/contadores.
 * Permite deshabilitarlo via `enabled` cuando el usuario no tiene permiso `alertas.ver`.
 */
export function useContadoresAlertas(opciones?: OpcionesContadores) {
  return useQuery({
    queryKey: QUERY_KEY_CONTADORES_ALERTAS,
    queryFn: obtenerContadores,
    refetchInterval: 30_000,
    staleTime: 15_000,
    enabled: opciones?.enabled ?? true,
  })
}
