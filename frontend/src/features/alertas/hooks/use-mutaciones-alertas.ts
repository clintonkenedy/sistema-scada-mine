import { useMutation, useQueryClient } from '@tanstack/react-query'
import { marcarLeida, marcarTodasLeidas } from '../services/alerta-service'
import { QUERY_KEY_CONTADORES_ALERTAS } from './use-contadores-alertas'

export function useMarcarLeida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => marcarLeida(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/alertas'] })
      qc.invalidateQueries({ queryKey: QUERY_KEY_CONTADORES_ALERTAS })
    },
  })
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/alertas'] })
      qc.invalidateQueries({ queryKey: QUERY_KEY_CONTADORES_ALERTAS })
    },
  })
}
