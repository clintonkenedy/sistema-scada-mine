export interface PermisoEnRol {
  id: number
  name: string
}

export interface Rol {
  id: number
  name: string
  guard_name: string
  es_inicial: boolean
  permisos: PermisoEnRol[]
  cantidad_usuarios: number
  created_at: string
  updated_at: string
}

export interface RolPaginado {
  data: Rol[]
  meta: { current_page: number; last_page: number; total: number; per_page: number }
  links: { first: string; last: string; prev: string | null; next: string | null }
}

export interface CrearRolForm {
  name: string
}

export interface EditarRolForm {
  name: string
}

export interface AsignarPermisosForm {
  permisos: string[]
}
