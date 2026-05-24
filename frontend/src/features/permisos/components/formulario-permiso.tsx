import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { esquemaCrearPermiso, type EsquemaCrearPermiso } from '../schemas/permiso-schema'
import type { Permiso } from '../types/permiso'

interface Props {
  abierto: boolean
  alCerrar: () => void
  alSubmit: (datos: EsquemaCrearPermiso) => void
  permisoEditando?: Permiso | null
  estaCargando?: boolean
  errorExterno?: string | null
}

export function FormularioPermiso({
  abierto,
  alCerrar,
  alSubmit,
  permisoEditando,
  estaCargando = false,
  errorExterno,
}: Props) {
  const forma = useForm<EsquemaCrearPermiso>({
    resolver: zodResolver(esquemaCrearPermiso),
    defaultValues: {
      name: '',
    },
  })

  // Prellenar el campo cuando se está editando
  useEffect(() => {
    if (permisoEditando) {
      forma.setValue('name', permisoEditando.name)
    } else {
      forma.reset({ name: '' })
    }
  }, [permisoEditando, forma])

  // Limpiar al cerrar
  useEffect(() => {
    if (!abierto) {
      forma.reset({ name: '' })
    }
  }, [abierto, forma])

  const titulo = permisoEditando ? 'Editar permiso' : 'Crear permiso'

  function manejarSubmit(datos: EsquemaCrearPermiso) {
    alSubmit(datos)
  }

  function manejarCambioAbierto(abierto: boolean) {
    if (!abierto) {
      alCerrar()
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={manejarCambioAbierto}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>

        <Form {...forma}>
          <form
            onSubmit={forma.handleSubmit(manejarSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={forma.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del permiso</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="modulo.accion (ej: conexiones.ver)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorExterno && (
              <p className="text-sm font-medium text-destructive">{errorExterno}</p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={estaCargando}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={estaCargando}>
                {estaCargando ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
