import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
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
import { esquemaCrearRol, type EsquemaCrearRol } from '../schemas/rol-schema'
import type { Rol } from '../types/rol'

interface Props {
  abierto: boolean
  alCerrar: () => void
  alSubmit: (datos: EsquemaCrearRol) => void
  rolEditando: Rol | null
  cargando?: boolean
  errorBackend?: string | null
}

export function FormularioRol({
  abierto,
  alCerrar,
  alSubmit,
  rolEditando,
  cargando = false,
  errorBackend = null,
}: Props) {
  const esEdicion = rolEditando !== null
  const esRolInicial = rolEditando?.es_inicial ?? false

  const form = useForm<EsquemaCrearRol>({
    resolver: zodResolver(esquemaCrearRol),
    defaultValues: {
      name: '',
    },
  })

  useEffect(() => {
    if (abierto) {
      form.reset({
        name: rolEditando?.name ?? '',
      })
    }
  }, [abierto, rolEditando, form])

  function manejarSubmit(datos: EsquemaCrearRol) {
    alSubmit(datos)
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) alCerrar()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar rol' : 'Crear rol'}</DialogTitle>
        </DialogHeader>

        {esRolInicial && (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Este es un rol del sistema y no puede modificarse.
          </div>
        )}

        {!esRolInicial && (
          <Form {...form}>
            <form
              noValidate
              onSubmit={form.handleSubmit(manejarSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del rol</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej: supervisor"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errorBackend && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {errorBackend}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={alCerrar}
                  disabled={cargando}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={cargando}>
                  {cargando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear rol'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {esRolInicial && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={alCerrar}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
