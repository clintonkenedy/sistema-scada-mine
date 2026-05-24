import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso,
} from '../services/permisos-service'
import { QUERY_KEYS_PERMISOS } from './use-permisos'
import type { CrearPermisoForm, EditarPermisoForm } from '../types/permiso'

export function useCrearPermiso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearPermisoForm) => crearPermiso(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_PERMISOS.todos })
    },
  })
}

export function useActualizarPermiso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EditarPermisoForm }) =>
      actualizarPermiso(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_PERMISOS.todos })
    },
  })
}

export function useEliminarPermiso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => eliminarPermiso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_PERMISOS.todos })
    },
  })
}
