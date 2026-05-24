import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  asignarRol,
  toggleActivo,
} from '../services/usuarios-service'
import type { CrearUsuarioForm, EditarUsuarioForm, AsignarRolUsuarioForm } from '../types/usuario'

// Movido desde use-usuarios.ts (eliminado en este cambio)
export const QUERY_KEYS_USUARIOS = {
  todos: ['usuarios'] as const,
  lista: (params?: Record<string, unknown>) => ['usuarios', params] as const,
}

export function useCrearUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearUsuarioForm) => crearUsuario(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_USUARIOS.todos })
    },
  })
}

export function useActualizarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EditarUsuarioForm }) =>
      actualizarUsuario(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_USUARIOS.todos })
      queryClient.invalidateQueries({ queryKey: ['usuario-actual'] })
    },
  })
}

export function useEliminarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => eliminarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_USUARIOS.todos })
    },
  })
}

export function useAsignarRolUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AsignarRolUsuarioForm }) =>
      asignarRol(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_USUARIOS.todos })
      queryClient.invalidateQueries({ queryKey: ['usuario-actual'] })
    },
  })
}

export function useToggleActivoUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => toggleActivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS_USUARIOS.todos })
      queryClient.invalidateQueries({ queryKey: ['usuario-actual'] })
    },
  })
}
