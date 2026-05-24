import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import { useRoles } from '../hooks/use-roles'
import {
  useCrearRol,
  useActualizarRol,
  useSincronizarPermisos,
  useEliminarRol,
} from '../hooks/use-mutaciones-rol'
import { TablaRoles } from './tabla-roles'
import { FormularioRol } from './formulario-rol'
import { DialogoPermisosRol } from './dialogo-permisos-rol'
import { DialogoEliminarRol } from './dialogo-eliminar-rol'
import type { Rol } from '../types/rol'
import type { EsquemaCrearRol } from '../schemas/rol-schema'

type ErrorApi = { response?: { data?: { message?: string } } }

function extraerMensajeError(error: unknown): string {
  const err = error as ErrorApi
  return err?.response?.data?.message ?? 'Ocurrió un error inesperado'
}

export function PaginaRoles() {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)

  const [busqueda, setBusqueda] = useState('')
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [rolEditando, setRolEditando] = useState<Rol | null>(null)
  const [rolPermisos, setRolPermisos] = useState<Rol | null>(null)
  const [rolAEliminar, setRolAEliminar] = useState<Rol | null>(null)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [errorEditar, setErrorEditar] = useState<string | null>(null)
  const [errorPermisos, setErrorPermisos] = useState<string | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const { data: respuesta, isLoading, isError } = useRoles()

  const mutacionCrear = useCrearRol()
  const mutacionActualizar = useActualizarRol()
  const mutacionPermisos = useSincronizarPermisos()
  const mutacionEliminar = useEliminarRol()

  const roles = respuesta?.data ?? []

  const rolesFiltrados = busqueda.trim()
    ? roles.filter((r) => r.name.toLowerCase().includes(busqueda.toLowerCase()))
    : roles

  function manejarCrear(datos: EsquemaCrearRol) {
    setErrorCrear(null)
    mutacionCrear.mutate(datos, {
      onSuccess: () => {
        setModalCrearAbierto(false)
      },
      onError: (error) => {
        setErrorCrear(extraerMensajeError(error))
      },
    })
  }

  function manejarEditar(datos: EsquemaCrearRol) {
    if (!rolEditando) return
    setErrorEditar(null)
    mutacionActualizar.mutate(
      { id: rolEditando.id, datos },
      {
        onSuccess: () => {
          setRolEditando(null)
        },
        onError: (error) => {
          setErrorEditar(extraerMensajeError(error))
        },
      },
    )
  }

  function manejarGuardarPermisos(permisos: string[]) {
    if (!rolPermisos) return
    setErrorPermisos(null)
    mutacionPermisos.mutate(
      { id: rolPermisos.id, permisos },
      {
        onSuccess: () => {
          setRolPermisos(null)
        },
        onError: (error) => {
          setErrorPermisos(extraerMensajeError(error))
        },
      },
    )
  }

  function manejarEliminar() {
    if (!rolAEliminar) return
    setErrorEliminar(null)
    mutacionEliminar.mutate(rolAEliminar.id, {
      onSuccess: () => {
        setRolAEliminar(null)
      },
      onError: (error) => {
        setErrorEliminar(extraerMensajeError(error))
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-foreground">Roles del sistema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administrá los roles y sus permisos asignados.
          </p>
        </div>
        {tienePermiso('roles.crear') && (
          <Button
            className="shrink-0"
            onClick={() => {
              setErrorCrear(null)
              setModalCrearAbierto(true)
            }}
          >
            <Plus className="size-4" />
            Crear rol
          </Button>
        )}
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Contenido */}
      {isLoading && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Cargando roles...
        </div>
      )}

      {isError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar los roles. Intentá de nuevo.
        </div>
      )}

      {!isLoading && !isError && (
        <TablaRoles
          roles={rolesFiltrados}
          puedeAsignarPermisos={tienePermiso('roles.editar')}
          puedeEditar={tienePermiso('roles.editar')}
          puedeEliminar={tienePermiso('roles.eliminar')}
          alAsignarPermisos={(rol) => {
            setErrorPermisos(null)
            setRolPermisos(rol)
          }}
          alEditar={(rol) => {
            setErrorEditar(null)
            setRolEditando(rol)
          }}
          alEliminar={(rol) => {
            setErrorEliminar(null)
            setRolAEliminar(rol)
          }}
        />
      )}

      {/* Modal crear */}
      <FormularioRol
        abierto={modalCrearAbierto}
        rolEditando={null}
        alCerrar={() => {
          setModalCrearAbierto(false)
          setErrorCrear(null)
        }}
        alSubmit={manejarCrear}
        cargando={mutacionCrear.isPending}
        errorBackend={errorCrear}
      />

      {/* Modal editar */}
      <FormularioRol
        abierto={rolEditando !== null}
        rolEditando={rolEditando}
        alCerrar={() => {
          setRolEditando(null)
          setErrorEditar(null)
        }}
        alSubmit={manejarEditar}
        cargando={mutacionActualizar.isPending}
        errorBackend={errorEditar}
      />

      {/* Modal permisos */}
      <DialogoPermisosRol
        rol={rolPermisos}
        alCerrar={() => {
          setRolPermisos(null)
          setErrorPermisos(null)
        }}
        alGuardar={manejarGuardarPermisos}
        cargando={mutacionPermisos.isPending}
        errorBackend={errorPermisos}
      />

      {/* Modal eliminar */}
      <DialogoEliminarRol
        rol={rolAEliminar}
        alCerrar={() => {
          setRolAEliminar(null)
          setErrorEliminar(null)
        }}
        alConfirmar={manejarEliminar}
        cargando={mutacionEliminar.isPending}
        errorBackend={errorEliminar}
      />
    </div>
  )
}
