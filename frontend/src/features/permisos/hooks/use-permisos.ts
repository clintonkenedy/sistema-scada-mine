import { useQuery } from '@tanstack/react-query'
import {
  listarPermisos,
  type ParamsListarPermisos,
} from '../services/permisos-service'

export const QUERY_KEYS_PERMISOS = {
  todos: ['permisos'] as const,
  lista: (params?: ParamsListarPermisos) => ['permisos', params] as const,
}

export function usePermisos(params?: ParamsListarPermisos) {
  return useQuery({
    queryKey: QUERY_KEYS_PERMISOS.lista(params),
    queryFn: () => listarPermisos(params),
    staleTime: 30_000,
  })
}
