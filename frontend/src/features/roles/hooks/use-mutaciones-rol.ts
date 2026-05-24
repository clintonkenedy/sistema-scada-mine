import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  crearRol,
  actualizarRol,
  sincronizarPermisos,
  eliminarRol,
} from '../services/roles-service'
import { QUERY_KEYS_ROLES } from './use-roles'
import type { CrearRolForm, EditarRolForm } from '../types/rol'

export function useCrearRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearRolForm) => crearRol(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_ROLES.all })
    },
  })
}

export function useActualizarRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EditarRolForm }) =>
      actualizarRol(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_ROLES.all })
    },
  })
}

export function useSincronizarPermisos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, permisos }: { id: number; permisos: string[] }) =>
      sincronizarPermisos(id, permisos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_ROLES.all })
    },
  })
}

export function useEliminarRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => eliminarRol(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_ROLES.all })
    },
  })
}
