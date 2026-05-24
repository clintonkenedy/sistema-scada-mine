/** Estados operacionales que puede tener un camión en la mina. */
export type EstadoCamion =
  | 'en_ruta_vacio'
  | 'en_carguio'
  | 'en_ruta_cargado'
  | 'descargando'
  | 'detenido'
  | 'mantenimiento'
  | 'tiempo_muerto'

/** Camión / equipo de transporte de la mina. */
export interface Camion {
  id: number
  codigo: string
  patente: string | null
  modelo: string
  capacidad_toneladas: number
  estado_actual: EstadoCamion
  activo: boolean
  ultima_lat: number | null
  ultima_lng: number | null
  ultima_actualizacion: string | null
  created_at: string
}

export interface CrearCamionForm {
  codigo: string
  patente?: string | null
  modelo: string
  capacidad_toneladas: number
  estado_actual: EstadoCamion
  activo?: boolean
}

export interface EditarCamionForm {
  codigo?: string
  patente?: string | null
  modelo?: string
  capacidad_toneladas?: number
  estado_actual?: EstadoCamion
  activo?: boolean
}
