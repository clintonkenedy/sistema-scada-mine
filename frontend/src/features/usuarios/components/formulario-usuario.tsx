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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  esquemaCrearUsuario,
  esquemaEditarUsuario,
  type EsquemaCrearUsuario,
  type EsquemaEditarUsuario,
} from '../schemas/usuario-schema'
import { useTodosLosRoles } from '../hooks/use-todos-los-roles'
import type { UsuarioGestion } from '../types/usuario'

type ModoCrear = {
  modo: 'crear'
  alSubmit: (datos: EsquemaCrearUsuario) => void
}

type ModoEditar = {
  modo: 'editar'
  alSubmit: (datos: EsquemaEditarUsuario) => void
}

type Props = (ModoCrear | ModoEditar) & {
  abierto: boolean
  alCerrar: () => void
  usuarioEditando?: UsuarioGestion | null
  estaCargando?: boolean
  errores422?: Record<string, string[]>
}

export function FormularioUsuario({
  abierto,
  alCerrar,
  usuarioEditando,
  estaCargando = false,
  errores422,
  ...resto
}: Props) {
  const esEdicion = resto.modo === 'editar'
  const { data: roles = [] } = useTodosLosRoles()

  const formaCrear = useForm<EsquemaCrearUsuario>({
    resolver: zodResolver(esquemaCrearUsuario),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      dni: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      activo: true,
      rol: null,
    },
  })

  const formaEditar = useForm<EsquemaEditarUsuario>({
    resolver: zodResolver(esquemaEditarUsuario),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      dni: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      activo: true,
      rol: null,
    },
  })

  // Prellenar al editar
  useEffect(() => {
    if (esEdicion && usuarioEditando) {
      formaEditar.reset({
        name: usuarioEditando.name,
        email: usuarioEditando.email,
        password: '',
        password_confirmation: '',
        dni: usuarioEditando.dni ?? '',
        nombres: usuarioEditando.nombres,
        apellido_paterno: usuarioEditando.apellido_paterno,
        apellido_materno: usuarioEditando.apellido_materno ?? '',
        activo: usuarioEditando.activo,
        rol: usuarioEditando.roles[0] ?? null,
      })
    }
  }, [usuarioEditando, esEdicion, formaEditar])

  // Limpiar al cerrar
  useEffect(() => {
    if (!abierto) {
      formaCrear.reset()
      formaEditar.reset()
    }
  }, [abierto, formaCrear, formaEditar])

  // Mapear errores 422 a campos del form (errores del servidor)
  useEffect(() => {
    if (errores422) {
      Object.entries(errores422).forEach(([campo, mensajes]) => {
        const mensaje = mensajes[0] ?? 'Error en este campo'
        // Los errores del servidor pueden incluir campos no tipados en el schema local
        // Se usa root.{campo} como fallback si el campo no existe en el schema
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

  function manejarSubmitCrear(datos: EsquemaCrearUsuario) {
    if (resto.modo === 'crear') {
      resto.alSubmit(datos)
    }
  }

  function manejarSubmitEditar(datos: EsquemaEditarUsuario) {
    if (resto.modo === 'editar') {
      // Limpiar password y password_confirmation vacíos antes de enviar
      const payload: EsquemaEditarUsuario = { ...datos }
      if (!payload.password) {
        delete payload.password
        delete payload.password_confirmation
      }
      resto.alSubmit(payload)
    }
  }

  const titulo = esEdicion ? 'Editar usuario' : 'Crear usuario'

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
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Carlos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaCrear.control}
                  name="apellido_paterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido paterno *</FormLabel>
                      <FormControl>
                        <Input placeholder="Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaCrear.control}
                  name="apellido_materno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido materno</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="García"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaCrear.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678"
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de usuario *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formaCrear.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jperez@scada.local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaCrear.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaCrear.control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repetí la contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={formaCrear.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v || null)}
                        disabled={estaCargando}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin rol asignado" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((rol) => (
                            <SelectItem key={rol.id} value={rol.name}>
                              {rol.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
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
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Carlos" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaEditar.control}
                  name="apellido_paterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido paterno</FormLabel>
                      <FormControl>
                        <Input placeholder="Pérez" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaEditar.control}
                  name="apellido_materno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido materno</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="García"
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
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678"
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formaEditar.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jperez@scada.local"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Dejar vacío para no cambiar"
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
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repetí la contraseña"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={formaEditar.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? 'activo' : 'inactivo'}
                          onValueChange={(v) => field.onChange(v === 'activo')}
                          disabled={estaCargando}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formaEditar.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v || null)}
                          disabled={estaCargando}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sin rol asignado" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((rol) => (
                              <SelectItem key={rol.id} value={rol.name}>
                                {rol.name}
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
