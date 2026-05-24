/** Datos del usuario autenticado — refleja UsuarioResource del backend */
export interface Usuario {
  id: number
  name: string // campo 'name' del modelo User de Laravel (NO renombrar)
  email: string
  dni: string | null
  nombres: string | null
  apellido_paterno: string | null
  apellido_materno: string | null
  activo: boolean
  roles: string[]
  permisos: string[]
}

/** Payload para POST /login */
export interface CredencialesLogin {
  email: string
  password: string
}

/** Estado del store Zustand de sesión */
export interface EstadoSesion {
  usuario: Usuario | null
  estaAutenticado: boolean
  iniciarSesion: (usuario: Usuario) => void
  cerrarSesion: () => void
  tienePermiso: (permiso: string) => boolean
}
