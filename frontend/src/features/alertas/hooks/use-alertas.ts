import { useFiltrosApi } from '@/shared/hooks/use-filtros-api'
import type { Alerta } from '../types/alerta'

/**
 * Hook de listado paginado de alertas.
 * Reusa el pipeline JSON:API estándar del repo (useFiltrosApi).
 *
 * Filtros declarados:
 * - severidad: 'info' | 'warning' | 'danger'
 * - leida: '0' | '1'
 * - tipo: TipoAlerta
 */
export function useAlertas() {
  return useFiltrosApi<Alerta>({
    endpoint: '/api/alertas',
    filtrosDisponibles: {
      severidad: { tipo: 'seleccion' },
      leida: { tipo: 'seleccion' },
      tipo: { tipo: 'seleccion' },
    },
    ordenDisponibles: ['timestamp', 'severidad', 'created_at'],
    porPaginaDefault: 20,
  })
}
