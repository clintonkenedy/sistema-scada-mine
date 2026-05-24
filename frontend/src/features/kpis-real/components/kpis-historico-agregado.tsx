import type { AgregadosHistorico } from '../types/historico'
import { CardKpi } from './card-kpi'
import { ETIQUETAS_ESTADO } from '@/features/camiones/lib/estado-colors'
import type { EstadoCamion } from '@/features/camiones/types/camion'
import { formatearMinutos, formatearMetros } from '../lib/formatters'
import { Gauge, Thermometer, Activity, Route, RotateCw, Layers } from 'lucide-react'

type Props = {
  agregados: AgregadosHistorico
}

/** Cards con las métricas agregadas del histórico + top 3 de tiempo por estado. */
export function KpisHistoricoAgregado({ agregados }: Props) {
  // tiempo_por_estado viene como cantidad de puntos por estado; asumimos ~5s por
  // punto para una estimación legible. Top 3 estados con más tiempo acumulado.
  const tiempoPorEstadoStr =
    Object.entries(agregados.tiempo_por_estado)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([estado, puntos]) => {
        const segundos = puntos * 5
        const etiqueta = ETIQUETAS_ESTADO[estado as EstadoCamion] ?? estado
        return `${etiqueta}: ${formatearMinutos(segundos)}`
      })
      .join(' · ')

  const tempMaxAcento: 'warning' | 'normal' =
    agregados.temp_motor_maxima != null && agregados.temp_motor_maxima > 95
      ? 'warning'
      : 'normal'

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <CardKpi
        etiqueta="Velocidad promedio"
        valor={agregados.velocidad_promedio_kmh.toFixed(1)}
        unidad="km/h"
        icono={<Gauge className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Velocidad máxima"
        valor={agregados.velocidad_maxima_kmh.toFixed(1)}
        unidad="km/h"
        icono={<Gauge className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Temp motor prom."
        valor={agregados.temp_motor_promedio ?? '—'}
        unidad={agregados.temp_motor_promedio != null ? '°C' : ''}
        icono={<Thermometer className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Temp motor máx."
        valor={agregados.temp_motor_maxima ?? '—'}
        unidad={agregados.temp_motor_maxima != null ? '°C' : ''}
        icono={<Thermometer className="h-4 w-4" />}
        acento={tempMaxAcento}
      />

      <CardKpi
        etiqueta="Salud vía prom."
        valor={agregados.salud_via_promedio ?? '—'}
        unidad={agregados.salud_via_promedio != null ? '%' : ''}
        icono={<Activity className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Distancia recorrida"
        valor={formatearMetros(agregados.distancia_metros)}
        icono={<Route className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Vueltas completadas"
        valor={agregados.vueltas_completadas}
        icono={<RotateCw className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Cambios de estado"
        valor={agregados.cambios_estado}
        icono={<Layers className="h-4 w-4" />}
      />

      <div className="col-span-2 md:col-span-4">
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            Top 3 estados por tiempo
          </div>
          <div>{tiempoPorEstadoStr || '—'}</div>
        </div>
      </div>
    </div>
  )
}
