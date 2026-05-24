import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import { useFiltrosApi } from '@/shared/hooks/use-filtros-api'
import { BuscadorTexto } from '@/shared/components/tablas/buscador-texto'
import { PaginadorTabla } from '@/shared/components/tablas/paginador-tabla'
import { TablaCamiones } from './tabla-camiones'
import { DialogoCrearCamion } from './dialogo-crear-camion'
import { DialogoEditarCamion } from './dialogo-editar-camion'
import { DialogoEliminarCamion } from './dialogo-eliminar-camion'
import {
  useCrearCamion,
  useActualizarCamion,
  useEliminarCamion,
  useToggleActivoCamion,
} from '../hooks/use-mutaciones-camion'
import { ESTADOS_CAMION } from '../schemas/camion-schema'
import { ETIQUETAS_ESTADO } from '../lib/estado-colors'
import type { Camion } from '../types/camion'
import type {
  EsquemaCrearCamion,
  EsquemaEditarCamion,
} from '../schemas/camion-schema'

function extraerMensaje422(error: unknown): Record<string, string[]> | null {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'status' in error.response &&
    error.response.status === 422 &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'errors' in error.response.data
  ) {
    return error.response.data.errors as Record<string, string[]>
  }
  return null
}

function extraerMensajeError(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message
  }
  return 'Ocurrió un error inesperado'
}

export function PaginaCamiones() {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)

  // ── Estados de modales ────────────────────────────────────────────────────
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [camionEditando, setCamionEditando] = useState<Camion | null>(null)
  const [camionAEliminar, setCamionAEliminar] = useState<Camion | null>(null)
  const [toggleActivoCargandoId, setToggleActivoCargandoId] = useState<number | null>(
    null,
  )

  // ── Estados de errores ────────────────────────────────────────────────────
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [errores422Crear, setErrores422Crear] = useState<
    Record<string, string[]> | undefined
  >()
  const [errores422Editar, setErrores422Editar] = useState<
    Record<string, string[]> | undefined
  >()

  // ── Hook principal — lee/escribe URL ──────────────────────────────────────
  const resultado = useFiltrosApi<Camion>({
    endpoint: '/api/camiones',
    filtrosDisponibles: {
      search: { tipo: 'texto' },
      estado_actual: { tipo: 'seleccion' },
      activo: { tipo: 'seleccion' },
    },
    ordenDisponibles: ['codigo', 'modelo', 'capacidad_toneladas', 'created_at'],
    porPaginaDefault: 15,
  })

  // ── Mutaciones ────────────────────────────────────────────────────────────
  const crearMutation = useCrearCamion()
  const actualizarMutation = useActualizarCamion()
  const eliminarMutation = useEliminarCamion()
  const toggleActivoMutation = useToggleActivoCamion()

  // ── Handlers ──────────────────────────────────────────────────────────────
  function manejarSubmitCrear(datos: EsquemaCrearCamion) {
    setErrores422Crear(undefined)
    crearMutation.mutate(datos, {
      onSuccess: () => {
        setModalCrearAbierto(false)
      },
      onError: (err) => {
        const errores = extraerMensaje422(err)
        if (errores) {
          setErrores422Crear(errores)
        }
      },
    })
  }

  function manejarSubmitEditar(datos: EsquemaEditarCamion) {
    if (!camionEditando) return
    setErrores422Editar(undefined)
    actualizarMutation.mutate(
      { id: camionEditando.id, datos },
      {
        onSuccess: () => {
          setCamionEditando(null)
        },
        onError: (err) => {
          const errores = extraerMensaje422(err)
          if (errores) {
            setErrores422Editar(errores)
          }
        },
      },
    )
  }

  function manejarEliminar() {
    if (!camionAEliminar) return
    setErrorModal(null)
    eliminarMutation.mutate(camionAEliminar.id, {
      onSuccess: () => {
        setCamionAEliminar(null)
      },
      onError: (err) => {
        setErrorModal(extraerMensajeError(err))
      },
    })
  }

  function manejarToggleActivo(camion: Camion) {
    setToggleActivoCargandoId(camion.id)
    toggleActivoMutation.mutate(camion.id, {
      onSettled: () => {
        setToggleActivoCargandoId(null)
      },
    })
  }

  const puedeCrear = tienePermiso('camiones.crear')

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">Camiones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Flota de camiones mineros y su estado operacional en tiempo real
          </p>
        </div>

        {puedeCrear && (
          <Button onClick={() => setModalCrearAbierto(true)} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo camión
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BuscadorTexto
          valor={resultado.estado.filtros.search ?? ''}
          onCambio={(v) => resultado.setFiltro('search', v)}
          placeholder="Buscar por código, patente o modelo..."
          className="max-w-sm flex-1"
        />
        <Select
          value={resultado.estado.filtros.estado_actual ?? '__todos__'}
          onValueChange={(v) =>
            resultado.setFiltro('estado_actual', v === '__todos__' ? null : v)
          }
        >
          <SelectTrigger
            aria-label="Filtrar por estado operacional"
            className="h-10 w-auto min-w-[180px]"
          >
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos__">Todos los estados</SelectItem>
            {ESTADOS_CAMION.map((estado) => (
              <SelectItem key={estado} value={estado}>
                {ETIQUETAS_ESTADO[estado]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={resultado.estado.filtros.activo ?? '__todos__'}
          onValueChange={(v) =>
            resultado.setFiltro('activo', v === '__todos__' ? null : v)
          }
        >
          <SelectTrigger
            aria-label="Filtrar por activo"
            className="h-10 w-auto min-w-[160px]"
          >
            <SelectValue placeholder="Activos e inactivos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos__">Activos e inactivos</SelectItem>
            <SelectItem value="1">Solo activos</SelectItem>
            <SelectItem value="0">Solo inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {resultado.isLoading && (
        <div className="space-y-3" aria-label="Cargando camiones">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {resultado.isError && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <p className="text-sm">
            Error al cargar camiones:{' '}
            {resultado.error instanceof Error
              ? resultado.error.message
              : 'Error desconocido'}
          </p>
        </div>
      )}

      {/* Tabla + Paginador */}
      {!resultado.isLoading && !resultado.isError && resultado.data && (
        <>
          <TablaCamiones
            datos={resultado.data.data}
            ordenActual={resultado.estado.orden}
            onOrdenar={(col, dir) => {
              if (dir === null) resultado.quitarOrden()
              else resultado.setOrden(col, dir)
            }}
            alEditar={(c) => {
              setCamionEditando(c)
              setErrores422Editar(undefined)
            }}
            alEliminar={(c) => {
              setCamionAEliminar(c)
              setErrorModal(null)
            }}
            alToggleActivo={manejarToggleActivo}
            toggleActivoCargandoId={toggleActivoCargandoId}
          />
          <PaginadorTabla
            pagina={resultado.estado.pagina}
            ultimaPagina={resultado.data.meta.last_page}
            onCambio={resultado.setPagina}
          />
        </>
      )}

      {/* Modal Crear */}
      <DialogoCrearCamion
        abierto={modalCrearAbierto}
        alCerrar={() => {
          setModalCrearAbierto(false)
          setErrores422Crear(undefined)
        }}
        alSubmit={manejarSubmitCrear}
        estaCargando={crearMutation.isPending}
        errores422={errores422Crear}
      />

      {/* Modal Editar */}
      <DialogoEditarCamion
        abierto={camionEditando !== null}
        alCerrar={() => {
          setCamionEditando(null)
          setErrores422Editar(undefined)
        }}
        camion={camionEditando}
        alSubmit={manejarSubmitEditar}
        estaCargando={actualizarMutation.isPending}
        errores422={errores422Editar}
      />

      {/* Modal Eliminar */}
      <DialogoEliminarCamion
        abierto={camionAEliminar !== null}
        alCerrar={() => {
          setCamionAEliminar(null)
          setErrorModal(null)
        }}
        camion={camionAEliminar}
        alConfirmar={manejarEliminar}
        estaCargando={eliminarMutation.isPending}
        errorExterno={errorModal}
      />
    </div>
  )
}
