import { useQuery } from '@tanstack/react-query'
import api from '@/shared/services/api'
import type { Rol } from '@/features/roles/types/rol'

interface RespuestaRoles {
  data: Rol[]
}

/** Hook auxiliar local para listar todos los roles en modales de asignación.
 *  Independiente del feature roles para mantener cohesión del feature usuarios. */
export function useTodosLosRoles() {
  return useQuery({
    queryKey: ['todos-los-roles'] as const,
    queryFn: async () => {
      const { data } = await api.get<RespuestaRoles>('/api/roles', {
        params: { per_page: 999 },
      })
      return data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
