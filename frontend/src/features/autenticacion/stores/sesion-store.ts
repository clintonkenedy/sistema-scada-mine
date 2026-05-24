import { create } from 'zustand'
import type { EstadoSesion, Usuario } from '../types/sesion'

export const useSesionStore = create<EstadoSesion>((set, get) => ({
  usuario: null,
  estaAutenticado: false,

  iniciarSesion: (usuario: Usuario) => set({ usuario, estaAutenticado: true }),

  cerrarSesion: () => set({ usuario: null, estaAutenticado: false }),

  tienePermiso: (permiso: string): boolean => {
    return get().usuario?.permisos?.includes(permiso) ?? false
  },
}))
