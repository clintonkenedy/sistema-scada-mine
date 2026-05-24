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
import type { Permiso } from '../types/permiso'

interface Props {
  permiso: Permiso | null
  alCerrar: () => void
  alConfirmar: () => void
  estaCargando?: boolean
  errorExterno?: string | null
}

export function DialogoEliminarPermiso({
  permiso,
  alCerrar,
  alConfirmar,
  estaCargando = false,
  errorExterno,
}: Props) {
  const estaAbierto = permiso !== null

  function manejarCambioAbierto(abierto: boolean) {
    if (!abierto) {
      alCerrar()
    }
  }

  return (
    <Dialog open={estaAbierto} onOpenChange={manejarCambioAbierto}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>Eliminar permiso</DialogTitle>
          <DialogDescription>
            ¿Eliminar el permiso{' '}
            <span className="font-mono font-medium text-foreground">
              {permiso?.name}
            </span>
            ? Esta acción no se puede deshacer.
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
