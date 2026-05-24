/**
 * Tipos base para el hook useFiltrosApi.
 * Infraestructura para consumir endpoints con filtros JSON:API desde React.
 */

/**
 * Tipos de filtro soportados.
 * Usado para la declaración en ConfigFiltrosApi.filtrosDisponibles.
 */
export type TipoFiltro = 'texto' | 'booleano' | 'numero' | 'fecha' | 'seleccion'

/**
 * Descriptor de un filtro disponible en la configuración del hook.
 */
export interface DefinicionFiltro {
  tipo: TipoFiltro
}

/**
 * Dirección de orden para una columna.
 */
export type DireccionOrden = 'asc' | 'desc'

/**
 * Shape genérico de la respuesta paginada de Laravel (JSON:API).
 * Compatible con `->paginate()` del backend.
 *
 * @template T - Tipo de cada elemento en `data`
 */
export interface RespuestaPaginada<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

/**
 * Configuración que recibe el hook useFiltrosApi.
 * Describe qué endpoints y filtros hay — no depende del shape de los items.
 * El genérico T vive en useFiltrosApi<T> y en RetornoFiltrosApi<T>.
 *
 * @example
 * const config: ConfigFiltrosApi = {
 *   endpoint: '/api/usuarios',
 *   filtrosDisponibles: {
 *     search: { tipo: 'texto' },
 *     activo: { tipo: 'booleano' },
 *   },
 *   ordenDisponibles: ['name', 'email', 'created_at'] as const,
 *   porPaginaDefault: 15,
 * }
 */
export interface ConfigFiltrosApi {
  /** Endpoint del API. Ej: '/api/usuarios' */
  endpoint: string
  /**
   * Filtros que el hook reconoce y gestiona.
   * Filtros en la URL que NO estén aquí se ignoran silenciosamente.
   */
  filtrosDisponibles: Record<string, DefinicionFiltro>
  /**
   * Columnas de sort permitidas.
   * Columnas en la URL que NO estén aquí producen estado.orden = null.
   */
  ordenDisponibles: readonly string[]
  /**
   * Cantidad de items por página si no hay per_page en la URL.
   * @default 15
   */
  porPaginaDefault?: number
  /**
   * Tiempo en ms antes de que los datos se consideren stale.
   * @default 30_000
   */
  staleTime?: number
}

/**
 * Estado actual derivado de la URL.
 * Es la fuente de verdad para el componente consumidor.
 */
export interface EstadoFiltros {
  /** Filtros activos (solo los declarados en filtrosDisponibles). */
  filtros: Record<string, string>
  /** Orden activo, o null si no hay sort en la URL o si la columna no está permitida. */
  orden: { columna: string; direccion: DireccionOrden } | null
  /** Página actual (default: 1). */
  pagina: number
  /** Items por página (default: config.porPaginaDefault ?? 15). */
  porPagina: number
}

/**
 * Retorno del hook useFiltrosApi<T>.
 * Combina el estado actual, los datos del servidor y las acciones para modificar filtros.
 *
 * @template T - Tipo del recurso paginado
 */
export interface RetornoFiltrosApi<T> {
  /** Respuesta paginada del servidor. undefined mientras carga la primera vez. */
  data: RespuestaPaginada<T> | undefined
  /** true solo en la primera carga (sin datos previos en cache). */
  isLoading: boolean
  /** true si la query falló. */
  isError: boolean
  /**
   * true mientras se cargan datos nuevos y se muestran los datos anteriores.
   * Útil para mostrar un indicador sutil sin ocultar la tabla.
   */
  isPlaceholderData: boolean
  /** Error de la query, o null. */
  error: Error | null
  /** Estado actual derivado de la URL. */
  estado: EstadoFiltros
  /**
   * Establece o actualiza un filtro en la URL.
   * - Usa replace:true (no llena el history).
   * - Por defecto resetea page a 1.
   * - Valor null/undefined/'' equivale a quitarFiltro(clave).
   *
   * @param clave - Clave del filtro (debe estar en filtrosDisponibles)
   * @param valor - Valor del filtro. null/undefined/'' lo elimina.
   * @param opts.resetPagina - Si resetear page a 1 (default: true)
   */
  setFiltro: (
    clave: string,
    valor: string | number | boolean | null | undefined,
    opts?: { resetPagina?: boolean },
  ) => void
  /**
   * Elimina un filtro de la URL.
   * - Usa replace:true.
   * - Resetea page a 1.
   */
  quitarFiltro: (clave: string) => void
  /**
   * Establece el orden activo.
   * - Usa replace:false (agrega al history para botón atrás).
   * - Si no se provee dirección, usa 'asc'.
   *
   * @param columna - Columna a ordenar (debe estar en ordenDisponibles)
   * @param direccion - 'asc' | 'desc' (default: 'asc')
   */
  setOrden: (columna: string, direccion?: DireccionOrden) => void
  /**
   * Elimina el orden activo.
   * - Usa replace:false.
   */
  quitarOrden: () => void
  /**
   * Navega a una página específica.
   * - Usa replace:false (el botón atrás vuelve a la página anterior).
   */
  setPagina: (pagina: number) => void
  /**
   * Cambia la cantidad de items por página y resetea a página 1.
   * - Usa replace:true.
   */
  setPorPagina: (porPagina: number) => void
  /**
   * Limpia todos los params controlados por el hook (filtros, sort, page, per_page).
   * - Usa replace:true.
   * - Params no controlados (ej: utm_source) se mantienen intactos.
   */
  resetear: () => void
}
