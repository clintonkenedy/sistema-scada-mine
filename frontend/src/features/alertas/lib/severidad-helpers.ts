import type { SeveridadAlerta, TipoAlerta } from '../types/alerta'

export const COLORES_SEVERIDAD: Record<SeveridadAlerta, string> = {
  info: 'bg-blue-500 text-white',
  warning: 'bg-amber-500 text-black',
  danger: 'bg-red-600 text-white',
}

export const ETIQUETAS_SEVERIDAD: Record<SeveridadAlerta, string> = {
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
}

export const ETIQUETAS_TIPO: Record<TipoAlerta, string> = {
  entrada_zona: 'Entrada a zona',
  salida_zona: 'Salida de zona',
  cambio_estado: 'Cambio de estado',
  tiempo_muerto: 'Tiempo muerto',
  calidad_gps_baja: 'Calidad GPS baja',
  temperatura_alta: 'Temperatura alta',
  salud_via_baja: 'Salud vía baja',
  tolva_fuera_zona: 'Tolva fuera de zona',
}

export function etiquetaTipo(tipo: string): string {
  return ETIQUETAS_TIPO[tipo as TipoAlerta] ?? tipo
}
