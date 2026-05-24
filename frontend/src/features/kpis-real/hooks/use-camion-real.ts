import { useQuery } from '@tanstack/react-query'
import api from '@/shared/services/api'
import type { Camion } from '@/features/camiones/types/camion'

type RespuestaPaginadaCamiones = {
  data: Camion[]
  meta?: { total: number }
}

export function useCamionReal() {
  return useQuery({
    queryKey: ['camion-real'],
    queryFn: async () => {
      const { data } = await api.get<RespuestaPaginadaCamiones>('/api/camiones', {
        params: { 'filter[es_real]': 'true', per_page: 5 },
      })
      // Buscar el primer camión activo con es_real=true (debería ser solo uno: REAL-01)
      const camionReal = data.data.find((c) => c.es_real === true && c.activo)
      return camionReal ?? null
    },
    staleTime: 5 * 60 * 1000,
  })
}
