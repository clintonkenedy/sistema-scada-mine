import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useTodosLosRoles } from '../hooks/use-todos-los-roles'
import type { UsuarioGestion } from '../types/usuario'

interface Props {
  abierto: boolean
  alCerrar: () => void
  usuario: UsuarioGestion | null
  alAsignar: (rol: string) => void
  estaCargando?: boolean
  errorExterno?: string | null
}

export function DialogoAsignarRol({
  abierto,
  alCerrar,
  usuario,
  alAsignar,
  estaCargando = false,
  errorExterno,
}: Props) {
  const rolActual = usuario?.roles[0] ?? ''
  const [rolSeleccionado, setRolSeleccionado] = useState<string | null>(rolActual || null)

  const { data: roles = [], isLoading: cargandoRoles } = useTodosLosRoles()

  // Actualizar selección cuando se abre el dialog
  function manejarCambioAbierto(nuevoEstado: boolean) {
    if (nuevoEstado) {
      setRolSeleccionado(usuario?.roles[0] ?? null)
    } else {
      alCerrar()
    }
  }

  function manejarAsignar() {
    if (rolSeleccionado) {
      alAsignar(rolSeleccionado)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={manejarCambioAbierto}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>Asignar rol</DialogTitle>
          <DialogDescription>
            Asignando rol a{' '}
            <span className="font-medium text-foreground">{usuario?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Rol</label>
          <Select
            value={rolSeleccionado ?? ''}
            onValueChange={setRolSeleccionado}
            disabled={cargandoRoles || estaCargando}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((rol) => (
                <SelectItem key={rol.id} value={rol.name}>
                  {rol.name}
                </SelectItem>
              ))}
              {roles.length === 0 && !cargandoRoles && (
                <div className="px-2.5 py-1.5 text-sm text-muted-foreground">
                  Sin roles disponibles
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

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
            onClick={manejarAsignar}
            disabled={estaCargando || rolSeleccionado === null}
          >
            {estaCargando ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
