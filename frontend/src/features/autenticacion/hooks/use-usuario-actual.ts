import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { obtenerUsuario } from '../services/autenticacion-service'
import { useSesionStore } from '../stores/sesion-store'
import type { Usuario } from '../types/sesion'

export const QUERY_KEY_USUARIO = ['usuario-actual'] as const

// NOTA TanStack Query v5: los callbacks onSuccess y onError fueron REMOVIDOS de useQuery.
// Solo permanecen en useMutation. Se usa useEffect reactivo al data/isError como alternativa.
export function useUsuarioActual() {
  const iniciarSesion = useSesionStore((s) => s.iniciarSesion)
  const cerrarSesion = useSesionStore((s) => s.cerrarSesion)

  const query = useQuery<Usuario>({
    queryKey: QUERY_KEY_USUARIO,
    queryFn: obtenerUsuario,
    staleTime: Infinity, // Sesión no caduca hasta logout explícito
    retry: false, // 401 es estado válido (no autenticado), NO reintentar
  })

  // Sincronizar el store Zustand cuando la query devuelve datos exitosamente.
  // Esto aplica principalmente al flujo de hydration (recarga de página).
  // Durante el submit del formulario de login, useLogin.onSuccess llama a
  // iniciarSesion() directamente (porque setQueryData no dispara este useEffect).
  useEffect(() => {
    if (query.isSuccess && query.data) {
      iniciarSesion(query.data)
    }
  }, [query.isSuccess, query.data, iniciarSesion])

  // Sincronizar el store Zustand cuando la query falla (ej: 401 al recargar sin sesión)
  useEffect(() => {
    if (query.isError) {
      cerrarSesion()
    }
  }, [query.isError, cerrarSesion])

  return query
}
