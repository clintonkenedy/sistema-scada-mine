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
import type { UsuarioGestion } from '../types/usuario'

interface Props {
  abierto: boolean
  alCerrar: () => void
  usuario: UsuarioGestion | null
  alConfirmar: () => void
  estaCargando?: boolean
  errorExterno?: string | null
}

export function DialogoEliminarUsuario({
  abierto,
  alCerrar,
  usuario,
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
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            ¿Eliminar a{' '}
            <span className="font-medium text-foreground">{usuario?.name}</span>? Podés
            recuperarlo después (soft delete).
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
