/** Usuario del sistema para gestión (diferente de Usuario de sesión en autenticacion) */
export interface UsuarioGestion {
  id: number
  name: string
  email: string
  dni: string | null
  nombres: string
  apellido_paterno: string
  apellido_materno: string | null
  activo: boolean
  roles: string[]
  permisos: string[]
  created_at: string
}

export interface CrearUsuarioForm {
  name: string
  email: string
  password: string
  password_confirmation: string
  dni?: string | null
  nombres: string
  apellido_paterno: string
  apellido_materno?: string | null
  activo?: boolean
  rol?: string | null
}

export interface EditarUsuarioForm {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  dni?: string | null
  nombres?: string
  apellido_paterno?: string
  apellido_materno?: string | null
  activo?: boolean
  rol?: string | null
}

export interface AsignarRolUsuarioForm {
  rol: string
}
