/** Ventanas de tiempo soportadas por el endpoint de histórico. */
export type VentanaHistorico = '5min' | '1h' | '6h' | '24h'

/** Un punto de una serie temporal del histórico. */
export type PuntoSerie = {
  ts: string
  valor: number | null
}

/** Métricas agregadas sobre la ventana de tiempo seleccionada. */
export type AgregadosHistorico = {
  velocidad_promedio_kmh: number
  velocidad_maxima_kmh: number
  temp_motor_promedio: number | null
  temp_motor_maxima: number | null
  salud_via_promedio: number | null
  salud_via_minima: number | null
  combustible_promedio: number
  carga_maxima_toneladas: number
  total_puntos: number
  tiempo_por_estado: Record<string, number>
  distancia_metros: number
  cambios_estado: number
  vueltas_completadas: number
}

/** Series temporales (una por sensor) bucketizadas. */
export type SeriesHistorico = {
  bucket_segundos: number
  velocidad: PuntoSerie[]
  temperatura_motor: PuntoSerie[]
  salud_via: PuntoSerie[]
  calidad_gps: PuntoSerie[]
  combustible: PuntoSerie[]
  carga: PuntoSerie[]
}

/** Respuesta completa del endpoint GET /api/camiones/{id}/historico. */
export type HistoricoCamion = {
  camion: { id: number; codigo: string; es_real: boolean }
  ventana: VentanaHistorico
  desde: string
  hasta: string
  agregados: AgregadosHistorico
  series: SeriesHistorico
}
