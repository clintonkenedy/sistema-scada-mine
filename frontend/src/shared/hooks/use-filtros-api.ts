import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '@/shared/services/api'
import type {
  ConfigFiltrosApi,
  DireccionOrden,
  EstadoFiltros,
  RespuestaPaginada,
  RetornoFiltrosApi,
} from '@/shared/types/filtros-api'

// ─── Funciones puras privadas del módulo ─────────────────────────────────────

/**
 * Parsea los searchParams de la URL y devuelve el EstadoFiltros.
 * Solo extrae los filtros declarados en config.filtrosDisponibles.
 * Filtros no declarados son ignorados silenciosamente.
 * Columnas de orden no declaradas en config.ordenDisponibles producen orden: null.
 */
function parsearEstadoDeUrl(
  searchParams: URLSearchParams,
  config: ConfigFiltrosApi,
): EstadoFiltros {
  // Filtros: solo los declarados
  const filtros: Record<string, string> = {}
  for (const clave of Object.keys(config.filtrosDisponibles)) {
    const valor = searchParams.get(`filter[${clave}]`)
    if (valor !== null && valor !== '') {
      filtros[clave] = valor
    }
  }

  // Orden: parsear sort=columna (asc) o sort=-columna (desc)
  let orden: EstadoFiltros['orden'] = null
  const sortParam = searchParams.get('sort')
  if (sortParam !== null && sortParam !== '') {
    const esDesc = sortParam.startsWith('-')
    const columna = esDesc ? sortParam.slice(1) : sortParam
    if (config.ordenDisponibles.includes(columna)) {
      orden = {
        columna,
        direccion: esDesc ? 'desc' : 'asc',
      }
    }
    // Si la columna no está permitida → orden queda null (ignorado silenciosamente)
  }

  // Paginación
  const pageParam = searchParams.get('page')
  const pagina = pageParam !== null ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  const perPageParam = searchParams.get('per_page')
  const porPagina =
    perPageParam !== null
      ? Math.max(1, parseInt(perPageParam, 10) || (config.porPaginaDefault ?? 15))
      : (config.porPaginaDefault ?? 15)

  return { filtros, orden, pagina, porPagina }
}

/**
 * Construye el objeto de query params para pasar a axios.
 * Serializa el EstadoFiltros al formato JSON:API estándar:
 * - filter[clave]=valor
 * - sort=columna (asc) o sort=-columna (desc)
 * - page=N
 * - per_page=N
 */
function construirQueryParams(estado: EstadoFiltros): Record<string, string> {
  const params: Record<string, string> = {}

  // Filtros → filter[clave]=valor
  for (const [clave, valor] of Object.entries(estado.filtros)) {
    params[`filter[${clave}]`] = valor
  }

  // Orden → sort=columna o sort=-columna
  if (estado.orden !== null) {
    params['sort'] =
      estado.orden.direccion === 'desc'
        ? `-${estado.orden.columna}`
        : estado.orden.columna
  }

  // Paginación
  params['page'] = String(estado.pagina)
  params['per_page'] = String(estado.porPagina)

  return params
}

// ─── Hook principal ───────────────────────────────────────────────────────────

/**
 * Hook para consumir endpoints con filtros JSON:API desde React.
 *
 * Usa useSearchParams (React Router 7) como fuente de verdad del estado de filtros,
 * orden y paginación. Encapsula useQuery (TanStack Query 5) para caching y deduplicación.
 *
 * @template T - Tipo de cada elemento en la respuesta paginada.
 *   Si no se infiere automáticamente, especificarlo explícitamente:
 *   `useFiltrosApi<Usuario>({ endpoint: '/api/usuarios', ... })`
 *
 * @example
 * const { data, isLoading, estado, setFiltro, setPagina } = useFiltrosApi<Usuario>({
 *   endpoint: '/api/usuarios',
 *   filtrosDisponibles: {
 *     search: { tipo: 'texto' },
 *     activo: { tipo: 'booleano' },
 *   },
 *   ordenDisponibles: ['name', 'email', 'created_at'],
 * })
 */
export function useFiltrosApi<T>(config: ConfigFiltrosApi): RetornoFiltrosApi<T> {
  const [searchParams, setSearchParams] = useSearchParams()

  // Derivar estado de la URL — recalculado en cada render con nuevos searchParams
  const estado = parsearEstadoDeUrl(searchParams, config)

  // TanStack Query 5 — fetch con cache y placeholderData para evitar flicker
  const query = useQuery<RespuestaPaginada<T>>({
    queryKey: [
      config.endpoint,
      estado.filtros,
      estado.orden,
      estado.pagina,
      estado.porPagina,
    ],
    queryFn: async () => {
      const respuesta = await api.get<RespuestaPaginada<T>>(config.endpoint, {
        params: construirQueryParams(estado),
      })
      return respuesta.data
    },
    staleTime: config.staleTime ?? 30_000,
    placeholderData: keepPreviousData,
  })

  // ─── Acciones ───────────────────────────────────────────────────────────────

  const setFiltro = (
    clave: string,
    valor: string | number | boolean | null | undefined,
    opts: { resetPagina?: boolean } = {},
  ): void => {
    const { resetPagina = true } = opts

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        const paramKey = `filter[${clave}]`

        if (valor === null || valor === undefined || valor === '') {
          next.delete(paramKey)
        } else {
          next.set(paramKey, String(valor))
        }

        if (resetPagina) {
          next.delete('page')
        }

        return next
      },
      { replace: true },
    )
  }

  const quitarFiltro = (clave: string): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(`filter[${clave}]`)
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const setOrden = (columna: string, direccion: DireccionOrden = 'asc'): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('sort', direccion === 'desc' ? `-${columna}` : columna)
        return next
      },
      { replace: false },
    )
  }

  const quitarOrden = (): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('sort')
        return next
      },
      { replace: false },
    )
  }

  const setPagina = (pagina: number): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(pagina))
        return next
      },
      { replace: false },
    )
  }

  const setPorPagina = (porPagina: number): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('per_page', String(porPagina))
        next.delete('page') // Resetear a página 1
        return next
      },
      { replace: true },
    )
  }

  const resetear = (): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        // Eliminar todos los filtros declarados
        for (const clave of Object.keys(config.filtrosDisponibles)) {
          next.delete(`filter[${clave}]`)
        }
        // Eliminar params de paginación y orden
        next.delete('sort')
        next.delete('page')
        next.delete('per_page')
        return next
      },
      { replace: true },
    )
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    estado,
    setFiltro,
    quitarFiltro,
    setOrden,
    quitarOrden,
    setPagina,
    setPorPagina,
    resetear,
  }
}
