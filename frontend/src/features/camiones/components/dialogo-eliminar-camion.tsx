import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import type { Camion } from '../types/camion'

interface Props {
  abierto: boolean
  alCerrar: () => void
  camion: Camion | null
  alConfirmar: () => void
  estaCargando?: boolean
  errorExterno?: string | null
}

export function DialogoEliminarCamion({
  abierto,
  alCerrar,
  camion,
  alConfirmar,
  estaCargando = false,
  errorExterno,
}: Props) {
  function manejarCambioAbierto(nuevoEstado: boolean) {
    if (!nuevoEstado) {
      alCerrar()
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={manejarCambioAbierto}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>Eliminar camión</DialogTitle>
          <DialogDescription>
            ¿Eliminar el camión{' '}
            <span className="font-medium text-foreground">{camion?.codigo}</span>
            {camion?.modelo ? ` (${camion.modelo})` : ''}? Podés recuperarlo después
            (soft delete).
          </DialogDescription>
        </DialogHeader>

        {errorExterno && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorExterno}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={estaCargando}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={alConfirmar}
            disabled={estaCargando}
          >
            {estaCargando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
