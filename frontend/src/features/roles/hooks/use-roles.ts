import { useQuery } from '@tanstack/react-query'
import { listarRoles, type ParamsListarRoles } from '../services/roles-service'

export const QUERY_KEYS_ROLES = {
  all: ['roles'] as const,
  lista: (params?: ParamsListarRoles) => ['roles', 'lista', params] as const,
}

export function useRoles(params?: ParamsListarRoles) {
  return useQuery({
    queryKey: QUERY_KEYS_ROLES.lista(params),
    queryFn: () => listarRoles(params),
  })
}
