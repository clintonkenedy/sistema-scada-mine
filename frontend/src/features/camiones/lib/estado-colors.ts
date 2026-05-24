import type { EstadoCamion } from '../types/camion'

/** Clases Tailwind para el badge de estado_actual en la tabla de camiones. */
export const COLORES_ESTADO: Record<EstadoCamion, string> = {
  en_ruta_vacio: 'bg-blue-500 text-white',
  en_carguio: 'bg-yellow-500 text-black',
  en_ruta_cargado: 'bg-green-500 text-white',
  descargando: 'bg-orange-500 text-white',
  detenido: 'bg-red-500 text-white',
  mantenimiento: 'bg-gray-500 text-white',
  tiempo_muerto: 'bg-amber-700 text-white',
}

/** Etiquetas legibles en español para cada estado_actual. */
export const ETIQUETAS_ESTADO: Record<EstadoCamion, string> = {
  en_ruta_vacio: 'En ruta vacío',
  en_carguio: 'En carguío',
  en_ruta_cargado: 'En ruta cargado',
  descargando: 'Descargando',
  detenido: 'Detenido',
  mantenimiento: 'Mantenimiento',
  tiempo_muerto: 'Tiempo muerto',
}
