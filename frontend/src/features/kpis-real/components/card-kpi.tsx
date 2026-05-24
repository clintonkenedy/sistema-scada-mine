import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

type Acento = 'normal' | 'warning' | 'danger' | 'success'

type Props = {
  etiqueta: string
  valor: ReactNode
  unidad?: string
  icono?: ReactNode
  advertencia?: string
  acento?: Acento
}

const CLASES_ACENTO: Record<Acento, string> = {
  normal: 'text-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-destructive',
  success: 'text-green-600 dark:text-green-400',
}

/** Card genérica para mostrar una métrica KPI con icono y advertencia opcional. */
export function CardKpi({
  etiqueta,
  valor,
  unidad,
  icono,
  advertencia,
  acento = 'normal',
}: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {etiqueta}
          </span>
          {icono && <span className="text-muted-foreground">{icono}</span>}
        </div>
        <div className={cn('font-mono text-2xl font-bold', CLASES_ACENTO[acento])}>
          {valor}
          {unidad && <span className="ml-1 text-sm font-normal">{unidad}</span>}
        </div>
        {advertencia && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>{advertencia}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
