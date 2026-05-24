export interface Permiso {
  id: number
  name: string
  guard_name: string
  modulo: string
  accion: string
  es_canonico: boolean
  created_at: string
  updated_at: string
}

export interface PermisoPaginado {
  data: Permiso[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface CrearPermisoForm {
  name: string
}

export interface EditarPermisoForm {
  name: string
}
