export type SeveridadAlerta = 'info' | 'warning' | 'danger'

export type TipoAlerta =
  | 'entrada_zona'
  | 'salida_zona'
  | 'cambio_estado'
  | 'tiempo_muerto'
  | 'calidad_gps_baja'
  | 'temperatura_alta'
  | 'salud_via_baja'
  | 'tolva_fuera_zona'

export interface Alerta {
  id: number
  camion: {
    id: number
    codigo: string | null
    es_real: boolean | null
  }
  tipo: TipoAlerta
  severidad: SeveridadAlerta
  titulo: string
  mensaje: string | null
  lat: number | null
  lng: number | null
  zona_nombre: string | null
  estado_anterior: string | null
  estado_nuevo: string | null
  contexto: Record<string, unknown> | null
  timestamp: string
  leida: boolean
  leida_at: string | null
  created_at: string | null
}

export interface ContadoresAlertas {
  no_leidas: number
  no_leidas_por_severidad: {
    info: number
    warning: number
    danger: number
  }
}
