import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { DireccionOrden } from '@/shared/types/filtros-api'

interface HeaderOrdenableProps {
  columna: string
  label: string
  ordenActual: { columna: string; direccion: DireccionOrden } | null
  onOrdenar: (columna: string, direccion: DireccionOrden | null) => void
  className?: string
}

/**
 * Header de columna clickeable para ordenar.
 * Ciclo: null (sin orden) → asc → desc → null (quitar orden).
 * Al clickear una columna nueva, empieza en asc.
 */
export function HeaderOrdenable({
  columna,
  label,
  ordenActual,
  onOrdenar,
  className,
}: HeaderOrdenableProps) {
  const esColumnaActiva = ordenActual?.columna === columna
  const esAsc = esColumnaActiva && ordenActual?.direccion === 'asc'
  const esDesc = esColumnaActiva && ordenActual?.direccion === 'desc'

  function manejarClick() {
    if (!esColumnaActiva) onOrdenar(columna, 'asc')
    else if (esAsc) onOrdenar(columna, 'desc')
    else onOrdenar(columna, null) // tercer click: quitar orden
  }

  const Icono = esAsc ? ArrowUp : esDesc ? ArrowDown : ArrowUpDown

  return (
    <th
      onClick={manejarClick}
      className={cn(
        'cursor-pointer select-none px-4 py-3 text-left font-medium text-muted-foreground',
        'hover:text-foreground transition-colors',
        esColumnaActiva && 'text-foreground',
        className,
      )}
      aria-sort={esAsc ? 'ascending' : esDesc ? 'descending' : 'none'}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icono className={cn('h-3.5 w-3.5', !esColumnaActiva && 'opacity-30')} />
      </span>
    </th>
  )
}
