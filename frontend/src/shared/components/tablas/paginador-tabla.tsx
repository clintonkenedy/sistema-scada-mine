import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface PaginadorTablaProps {
  pagina: number
  ultimaPagina: number
  onCambio: (pagina: number) => void
}

/**
 * Paginador simple con botones Anterior/Siguiente + indicador "Página X de Y".
 * Retorna null si ultimaPagina <= 1.
 */
export function PaginadorTabla({ pagina, ultimaPagina, onCambio }: PaginadorTablaProps) {
  if (ultimaPagina <= 1) return null

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pagina === 1}
        onClick={() => onCambio(pagina - 1)}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {pagina} de {ultimaPagina}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={pagina === ultimaPagina}
        onClick={() => onCambio(pagina + 1)}
      >
        Siguiente
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  )
}
