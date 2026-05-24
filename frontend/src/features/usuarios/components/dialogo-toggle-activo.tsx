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

export function DialogoToggleActivo({
  abierto,
  alCerrar,
  usuario,
  alConfirmar,
  estaCargando = false,
  errorExterno,
}: Props) {
  const accion = usuario?.activo ? 'Desactivar' : 'Activar'

  function manejarCambioAbierto(nuevoEstado: boolean) {
    if (!nuevoEstado) {
      alCerrar()
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={manejarCambioAbierto}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>{accion} usuario</DialogTitle>
          <DialogDescription>
            ¿{accion} a{' '}
            <span className="font-medium text-foreground">{usuario?.name}</span>?{' '}
            {usuario?.activo
              ? 'El usuario no podrá iniciar sesión mientras esté inactivo.'
              : 'El usuario podrá iniciar sesión nuevamente.'}
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
            variant={usuario?.activo ? 'destructive' : 'default'}
            onClick={alConfirmar}
            disabled={estaCargando}
          >
            {estaCargando ? `${accion}ndo...` : accion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
