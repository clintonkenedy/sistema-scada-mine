import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import type { Rol } from '../types/rol'

interface Props {
  rol: Rol | null
  alCerrar: () => void
  alConfirmar: () => void
  cargando?: boolean
  errorBackend?: string | null
}

export function DialogoEliminarRol({
  rol,
  alCerrar,
  alConfirmar,
  cargando = false,
  errorBackend = null,
}: Props) {
  const abierto = rol !== null

  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) alCerrar()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar rol</DialogTitle>
          <DialogDescription>
            ¿Eliminar el rol{' '}
            <span className="font-semibold text-foreground">{rol?.name}</span>? Esta acción no
            se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {errorBackend && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {errorBackend}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={alCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={alConfirmar} disabled={cargando}>
            {cargando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
