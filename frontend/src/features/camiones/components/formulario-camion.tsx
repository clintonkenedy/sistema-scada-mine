import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Switch } from '@/shared/components/ui/switch'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  esquemaCrearCamion,
  esquemaEditarCamion,
  ESTADOS_CAMION,
  type EsquemaCrearCamion,
  type EsquemaEditarCamion,
} from '../schemas/camion-schema'
import { ETIQUETAS_ESTADO } from '../lib/estado-colors'
import type { Camion } from '../types/camion'

type ModoCrear = {
  modo: 'crear'
  alSubmit: (datos: EsquemaCrearCamion) => void
}

type ModoEditar = {
  modo: 'editar'
  alSubmit: (datos: EsquemaEditarCamion) => void
}

type Props = (ModoCrear | ModoEditar) & {
  abierto: boolean
  alCerrar: () => void
  camionEditando?: Camion | null
  estaCargando?: boolean
  errores422?: Record<string, string[]>
}

export function FormularioCamion({
  abierto,
  alCerrar,
  camionEditando,
  estaCargando = false,
  errores422,
  ...resto
}: Props) {
  const esEdicion = resto.modo === 'editar'

  const formaCrear = useForm<EsquemaCrearCamion>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(esquemaCrearCamion) as any,
    defaultValues: {
      codigo: '',
      patente: '',
      modelo: '',
      capacidad_toneladas: 0,
      estado_actual: 'detenido',
      activo: true,
    },
  })

  const formaEditar = useForm<EsquemaEditarCamion>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(esquemaEditarCamion) as any,
    defaultValues: {
      codigo: '',
      patente: '',
      modelo: '',
      capacidad_toneladas: 0,
      estado_actual: 'detenido',
      activo: true,
    },
  })

  // Prellenar al editar
  useEffect(() => {
    if (esEdicion && camionEditando) {
      formaEditar.reset({
        codigo: camionEditando.codigo,
        patente: camionEditando.patente ?? '',
        modelo: camionEditando.modelo,
        capacidad_toneladas: camionEditando.capacidad_toneladas,
        estado_actual: camionEditando.estado_actual,
        activo: camionEditando.activo,
      })
    }
  }, [camionEditando, esEdicion, formaEditar])

  // Limpiar al cerrar
  useEffect(() => {
    if (!abierto) {
      formaCrear.reset()
      formaEditar.reset()
    }
  }, [abierto, formaCrear, formaEditar])

  // Mapear errores 422 del servidor a campos del form
  useEffect(() => {
    if (errores422) {
      Object.entries(errores422).forEach(([campo, mensajes]) => {
        const mensaje = mensajes[0] ?? 'Error en este campo'
        if (esEdicion) {
          formaEditar.setError(
            campo as Parameters<typeof formaEditar.setError>[0],
            { type: 'server', message: mensaje },
          )
        } else {
          formaCrear.setError(
            campo as Parameters<typeof formaCrear.setError>[0],
            { type: 'server', message: mensaje },
          )
        }
      })
    }
  }, [errores422, esEdicion, formaEditar, formaCrear])

  function manejarCambioAbierto(nuevoEstado: boolean) {
    if (!nuevoEstado) {
      alCerrar()
    }
  }

  function manejarSubmitCrear(datos: EsquemaCrearCamion) {
    if (resto.modo === 'crear') {
      // Normalizar string vacío de patente → null
      const payload: EsquemaCrearCamion = {
        ...datos,
        patente: datos.patente === '' ? null : datos.patente,
      }
      resto.alSubmit(payload)
    }
  }

  function manejarSubmitEditar(datos: EsquemaEditarCamion) {
    if (resto.modo === 'editar') {
      const payload: EsquemaEditarCamion = {
        ...datos,
        patente: datos.patente === '' ? null : datos.patente,
      }
      resto.alSubmit(payload)
    }
  }

  const titulo = esEdicion ? 'Editar camión' : 'Crear camión'

  return (
    <Dialog open={abierto} onOpenChange={manejarCambioAbierto}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>

        {/* Modo CREAR */}
        {!esEdicion && (
          <Form {...formaCrear}>
            <form
              onSubmit={formaCrear.handleSubmit(manejarSubmitCrear)}
              noValidate
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaCrear.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input placeholder="CAM-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaCrear.control}
                  name="patente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC-123"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={formaCrear.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Caterpillar 793F" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaCrear.control}
                  name="capacidad_toneladas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad (toneladas) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="240"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaCrear.control}
                  name="estado_actual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={estaCargando}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_CAMION.map((estado) => (
                              <SelectItem key={estado} value={estado}>
                                {ETIQUETAS_ESTADO[estado]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={formaCrear.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border border-border p-3">
                    <FormLabel className="m-0">Activo</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        disabled={estaCargando}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

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
        )}

        {/* Modo EDITAR */}
        {esEdicion && (
          <Form {...formaEditar}>
            <form
              onSubmit={formaEditar.handleSubmit(manejarSubmitEditar)}
              noValidate
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaEditar.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="CAM-001"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaEditar.control}
                  name="patente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC-123"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={formaEditar.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Caterpillar 793F"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaEditar.control}
                  name="capacidad_toneladas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad (toneladas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="240"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaEditar.control}
                  name="estado_actual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          disabled={estaCargando}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_CAMION.map((estado) => (
                              <SelectItem key={estado} value={estado}>
                                {ETIQUETAS_ESTADO[estado]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={formaEditar.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border border-border p-3">
                    <FormLabel className="m-0">Activo</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        disabled={estaCargando}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

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
        )}
      </DialogContent>
    </Dialog>
  )
}
