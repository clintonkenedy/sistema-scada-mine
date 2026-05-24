import { describe, it, expect, beforeEach } from 'vitest'
import { useSesionStore } from '../stores/sesion-store'
import type { Usuario } from '../types/sesion'

const usuarioMock: Usuario = {
  id: 1,
  name: 'Administrador SCADA',
  email: 'admin@scada.local',
  dni: null,
  nombres: 'Administrador',
  apellido_paterno: 'SCADA',
  apellido_materno: null,
  activo: true,
  roles: ['administrador'],
  permisos: ['usuarios.ver', 'usuarios.crear', 'roles.ver'],
}

// Resetear el store antes de cada test para evitar contaminación entre tests.
// Zustand stores son singletons globales en tests.
beforeEach(() => {
  useSesionStore.setState({ usuario: null, estaAutenticado: false })
})

describe('useSesionStore', () => {
  it('tiene el estado inicial correcto', () => {
    const { usuario, estaAutenticado } = useSesionStore.getState()

    expect(usuario).toBeNull()
    expect(estaAutenticado).toBe(false)
  })

  it('iniciarSesion setea usuario y estaAutenticado correctamente', () => {
    useSesionStore.getState().iniciarSesion(usuarioMock)

    const { usuario, estaAutenticado } = useSesionStore.getState()

    expect(usuario).toEqual(usuarioMock)
    expect(estaAutenticado).toBe(true)
  })

  it('cerrarSesion vuelve al estado inicial', () => {
    // Primero iniciamos sesión
    useSesionStore.getState().iniciarSesion(usuarioMock)

    // Luego cerramos
    useSesionStore.getState().cerrarSesion()

    const { usuario, estaAutenticado } = useSesionStore.getState()

    expect(usuario).toBeNull()
    expect(estaAutenticado).toBe(false)
  })

  it('cerrarSesion después de iniciarSesion limpia todo', () => {
    useSesionStore.getState().iniciarSesion(usuarioMock)

    // Verificar que iniciarSesion funcionó
    expect(useSesionStore.getState().estaAutenticado).toBe(true)
    expect(useSesionStore.getState().usuario).not.toBeNull()

    // Cerrar sesión
    useSesionStore.getState().cerrarSesion()

    // Verificar que todo fue limpiado
    expect(useSesionStore.getState().usuario).toBeNull()
    expect(useSesionStore.getState().estaAutenticado).toBe(false)
  })

  describe('tienePermiso', () => {
    it('retorna false si no hay usuario', () => {
      expect(useSesionStore.getState().tienePermiso('usuarios.ver')).toBe(false)
    })

    it('retorna true si el usuario tiene el permiso exacto', () => {
      useSesionStore.getState().iniciarSesion(usuarioMock)

      expect(useSesionStore.getState().tienePermiso('usuarios.ver')).toBe(true)
      expect(useSesionStore.getState().tienePermiso('usuarios.crear')).toBe(true)
      expect(useSesionStore.getState().tienePermiso('roles.ver')).toBe(true)
    })

    it('retorna false si el usuario NO tiene el permiso', () => {
      useSesionStore.getState().iniciarSesion(usuarioMock)

      expect(useSesionStore.getState().tienePermiso('usuarios.eliminar')).toBe(false)
      expect(useSesionStore.getState().tienePermiso('permisos.ver')).toBe(false)
    })

    it('es case-sensitive', () => {
      useSesionStore.getState().iniciarSesion(usuarioMock)

      expect(useSesionStore.getState().tienePermiso('Usuarios.ver')).toBe(false)
      expect(useSesionStore.getState().tienePermiso('USUARIOS.VER')).toBe(false)
      expect(useSesionStore.getState().tienePermiso('usuarios.ver')).toBe(true)
    })
  })
})
