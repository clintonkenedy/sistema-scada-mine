import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actualizarConfiguracion } from '../services/configuracion-service'
import { QUERY_KEY_CONFIGURACION } from './use-configuracion'

export function useActualizarConfiguracion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clave, valor }: { clave: string; valor: string }) =>
      actualizarConfiguracion(clave, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_CONFIGURACION })
    },
  })
}
