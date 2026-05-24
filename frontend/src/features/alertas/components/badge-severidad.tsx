import { cn } from '@/shared/lib/utils'
import { COLORES_SEVERIDAD, ETIQUETAS_SEVERIDAD } from '../lib/severidad-helpers'
import type { SeveridadAlerta } from '../types/alerta'

interface PropiedadesBadgeSeveridad {
  severidad: SeveridadAlerta
  className?: string
}

export function BadgeSeveridad({ severidad, className }: PropiedadesBadgeSeveridad) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
        COLORES_SEVERIDAD[severidad],
        className,
      )}
    >
      {ETIQUETAS_SEVERIDAD[severidad]}
    </span>
  )
}
