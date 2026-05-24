import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  crearCamion,
  actualizarCamion,
  eliminarCamion,
  toggleActivoCamion,
} from '../services/camiones-service'
import type { CrearCamionForm, EditarCamionForm } from '../types/camion'

/** Query keys del feature camiones — usados para invalidar caches. */
export const QUERY_KEYS_CAMIONES = {
  todos: ['camiones'] as const,
  lista: (params?: Record<string, unknown>) => ['camiones', params] as const,
}

export function useCrearCamion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearCamionForm) => crearCamion(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_CAMIONES.todos })
      queryClient.invalidateQueries({ queryKey: ['/api/camiones'] })
    },
  })
}

export function useActualizarCamion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EditarCamionForm }) =>
      actualizarCamion(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_CAMIONES.todos })
      queryClient.invalidateQueries({ queryKey: ['/api/camiones'] })
    },
  })
}

export function useEliminarCamion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => eliminarCamion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_CAMIONES.todos })
      queryClient.invalidateQueries({ queryKey: ['/api/camiones'] })
    },
  })
}

export function useToggleActivoCamion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => toggleActivoCamion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_CAMIONES.todos })
      queryClient.invalidateQueries({ queryKey: ['/api/camiones'] })
    },
  })
}
