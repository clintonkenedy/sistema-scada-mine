import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import { usePermisos } from '../hooks/use-permisos'
import { useCrearPermiso, useActualizarPermiso, useEliminarPermiso } from '../hooks/use-mutaciones-permiso'
import { TablaPermisos } from './tabla-permisos'
import { FormularioPermiso } from './formulario-permiso'
import { DialogoEliminarPermiso } from './dialogo-eliminar-permiso'
import type { Permiso } from '../types/permiso'
import type { EsquemaCrearPermiso } from '../schemas/permiso-schema'
import type { AxiosError } from 'axios'

interface ErrorBackend {
  message?: string
  errors?: Record<string, string[]>
}

export function PaginaPermisos() {
  const [busqueda, setBusqueda] = useState('')
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [permisoEditando, setPermisoEditando] = useState<Permiso | null>(null)
  const [permisoAEliminar, setPermisoAEliminar] = useState<Permiso | null>(null)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const tienePermiso = useSesionStore((s) => s.tienePermiso)

  const { data, isLoading, isError } = usePermisos({
    buscar: busqueda || undefined,
    per_page: 100,
  })

  const mutacionCrear = useCrearPermiso()
  const mutacionActualizar = useActualizarPermiso()
  const mutacionEliminar = useEliminarPermiso()

  const permisos = data?.data ?? []

  function manejarAbrirCrear() {
    setPermisoEditando(null)
    setErrorFormulario(null)
    setModalCrearAbierto(true)
  }

  function manejarCerrarFormulario() {
    setModalCrearAbierto(false)
    setPermisoEditando(null)
    setErrorFormulario(null)
  }

  function manejarEditar(permiso: Permiso) {
    setPermisoEditando(permiso)
    setErrorFormulario(null)
    setModalCrearAbierto(true)
  }

  function manejarEliminar(permiso: Permiso) {
    setPermisoAEliminar(permiso)
    setErrorEliminar(null)
  }

  function manejarCerrarEliminar() {
    setPermisoAEliminar(null)
    setErrorEliminar(null)
  }

  function manejarSubmitFormulario(datos: EsquemaCrearPermiso) {
    setErrorFormulario(null)

    if (permisoEditando) {
      mutacionActualizar.mutate(
        { id: permisoEditando.id, datos: { name: datos.name } },
        {
          onSuccess: () => {
            manejarCerrarFormulario()
          },
          onError: (error: unknown) => {
            const axiosError = error as AxiosError<ErrorBackend>
            const mensaje =
              axiosError.response?.data?.errors?.name?.[0] ??
              axiosError.response?.data?.message ??
              'Error al actualizar el permiso'
            setErrorFormulario(mensaje)
          },
        },
      )
    } else {
      mutacionCrear.mutate(
        { name: datos.name },
        {
          onSuccess: () => {
            manejarCerrarFormulario()
          },
          onError: (error: unknown) => {
            const axiosError = error as AxiosError<ErrorBackend>
            const mensaje =
              axiosError.response?.data?.errors?.name?.[0] ??
              axiosError.response?.data?.message ??
              'Error al crear el permiso'
            setErrorFormulario(mensaje)
          },
        },
      )
    }
  }

  function manejarConfirmarEliminar() {
    if (!permisoAEliminar) return

    setErrorEliminar(null)
    mutacionEliminar.mutate(permisoAEliminar.id, {
      onSuccess: () => {
        manejarCerrarEliminar()
      },
      onError: (error: unknown) => {
        const axiosError = error as AxiosError<ErrorBackend>
        const mensaje =
          axiosError.response?.data?.message ??
          'No se puede eliminar este permiso'
        setErrorEliminar(mensaje)
      },
    })
  }

  const estaCargandoFormulario =
    mutacionCrear.isPending || mutacionActualizar.isPending

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-foreground">Permisos del sistema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de permisos de acceso del sistema
          </p>
        </div>
        {tienePermiso('permisos.crear') && (
          <Button className="shrink-0" onClick={manejarAbrirCrear}>
            <Plus className="h-4 w-4" />
            Crear permiso
          </Button>
        )}
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar permiso..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Contenido */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Error al cargar los permisos. Por favor recargá la página.
        </div>
      )}

      {!isLoading && !isError && (
        <TablaPermisos
          permisos={permisos}
          alEditar={manejarEditar}
          alEliminar={manejarEliminar}
        />
      )}

      {/* Modal crear/editar */}
      <FormularioPermiso
        abierto={modalCrearAbierto}
        alCerrar={manejarCerrarFormulario}
        alSubmit={manejarSubmitFormulario}
        permisoEditando={permisoEditando}
        estaCargando={estaCargandoFormulario}
        errorExterno={errorFormulario}
      />

      {/* Modal eliminar */}
      <DialogoEliminarPermiso
        permiso={permisoAEliminar}
        alCerrar={manejarCerrarEliminar}
        alConfirmar={manejarConfirmarEliminar}
        estaCargando={mutacionEliminar.isPending}
        errorExterno={errorEliminar}
      />
    </div>
  )
}
