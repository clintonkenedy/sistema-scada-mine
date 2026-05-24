import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { PuntoSerie } from '../types/historico'

type Props = {
  titulo: string
  serie: PuntoSerie[]
  unidad?: string
  color?: string
}

/** Chart de línea time-series basado en ApexCharts. No fetchea: recibe los puntos por props. */
export function ChartSerie({ titulo, serie, unidad, color = '#3b82f6' }: Props) {
  const data = serie
    .filter((p): p is PuntoSerie & { valor: number } => p.valor !== null)
    .map((p) => ({ x: new Date(p.ts).getTime(), y: p.valor }))

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      animations: { enabled: false },
      foreColor: 'currentColor',
    },
    stroke: { curve: 'smooth', width: 2 },
    colors: [color],
    xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
    yaxis: {
      labels: {
        formatter: (v: number) => `${v.toFixed(0)}${unidad ? ` ${unidad}` : ''}`,
      },
    },
    grid: { borderColor: 'rgba(127, 127, 127, 0.15)', strokeDashArray: 4 },
    tooltip: { theme: 'dark', x: { format: 'HH:mm' } },
    title: {
      text: titulo,
      align: 'left',
      style: { fontSize: '14px', fontWeight: 600 },
    },
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <Chart
        options={options}
        series={[{ name: titulo, data }]}
        type="line"
        height={220}
      />
    </div>
  )
}
