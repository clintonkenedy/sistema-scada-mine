import { useQuery } from '@tanstack/react-query'
import api from '@/shared/services/api'

interface Permiso {
  id: number
  name: string
  guard_name: string
}

interface RespuestaPermisos {
  data: Permiso[]
}

async function obtenerTodosLosPermisos(): Promise<Permiso[]> {
  const { data } = await api.get<RespuestaPermisos>('/api/permisos?per_page=999')
  return data.data
}

export function useTodosLosPermisos() {
  return useQuery({
    queryKey: ['todos-los-permisos'],
    queryFn: obtenerTodosLosPermisos,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
