import type { Usuario } from '../types/sesion'

/**
 * Bypass total de autenticación.
 *
 * Cuando `VITE_BYPASS_AUTH === 'true'` la app inyecta un `Usuario` mock con
 * TODOS los permisos del sistema y NO consulta el backend para validar sesión.
 *
 * PELIGRO: este bypass está habilitado por decisión EXPLÍCITA del usuario
 * tanto en desarrollo como en producción. Si esto queda activo en un build de
 * producción, cualquiera que abra la app tiene acceso administrativo total.
 */
export const BYPASS_AUTH_HABILITADO = import.meta.env.VITE_BYPASS_AUTH === 'true'

/**
 * Construye el `Usuario` mock que se usa cuando el bypass está habilitado.
 *
 * Mantenemos la lista de permisos sincronizada con los `permiso` declarados
 * en `sidebar-admin.tsx` + las acciones CRUD documentadas en el backend.
 */
export function obtenerUsuarioBypass(): Usuario {
  return {
    id: 1,
    name: 'Dev Bypass',
    email: 'dev@local.test',
    dni: '00000000',
    nombres: 'Dev',
    apellido_paterno: 'Bypass',
    apellido_materno: null,
    activo: true,
    roles: ['super-admin'],
    permisos: [
      'dashboard.ver',
      'sensores.ver',
      'mediciones.ver',
      'alertas.ver',
      'alertas.marcar_leida',
      'equipos.ver',
      'camiones.ver',
      'camiones.crear',
      'camiones.editar',
      'camiones.eliminar',
      'camiones.ver_historico',
      'rutas.ver',
      'reportes.ver',
      'usuarios.ver',
      'usuarios.crear',
      'usuarios.editar',
      'usuarios.eliminar',
      'roles.ver',
      'roles.crear',
      'roles.editar',
      'roles.eliminar',
      'permisos.ver',
      'permisos.crear',
      'permisos.editar',
      'permisos.eliminar',
      'configuracion.ver',
    ],
  }
}
