import type { SeriesHistorico } from '../types/historico'
import { ChartSerie } from './chart-serie'

type Props = {
  series: SeriesHistorico
}

/** Grid 2x2 con los 4 charts principales del histórico. */
export function ChartsHistorico({ series }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartSerie
        titulo="Velocidad (km/h)"
        serie={series.velocidad}
        unidad="km/h"
        color="#3b82f6"
      />
      <ChartSerie
        titulo="Temperatura motor (°C)"
        serie={series.temperatura_motor}
        unidad="°C"
        color="#ef4444"
      />
      <ChartSerie
        titulo="Salud vía (%)"
        serie={series.salud_via}
        unidad="%"
        color="#10b981"
      />
      <ChartSerie
        titulo="Calidad GPS"
        serie={series.calidad_gps}
        color="#f59e0b"
      />
    </div>
  )
}
