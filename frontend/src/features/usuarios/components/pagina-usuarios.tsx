import { useState } from 'react'
import { UserPlus } from 'lucide-react'
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
import { useTodosLosRoles } from '../hooks/use-todos-los-roles'
import {
  useCrearUsuario,
  useActualizarUsuario,
  useEliminarUsuario,
  useAsignarRolUsuario,
  useToggleActivoUsuario,
} from '../hooks/use-mutaciones-usuario'
import { TablaUsuarios } from './tabla-usuarios'
import { FormularioUsuario } from './formulario-usuario'
import { DialogoAsignarRol } from './dialogo-asignar-rol'
import { DialogoToggleActivo } from './dialogo-toggle-activo'
import { DialogoEliminarUsuario } from './dialogo-eliminar-usuario'
import type { UsuarioGestion } from '../types/usuario'
import type { EsquemaCrearUsuario, EsquemaEditarUsuario } from '../schemas/usuario-schema'

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

export function PaginaUsuarios() {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)

  // ── Estados de modales ────────────────────────────────────────────────────
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioGestion | null>(null)
  const [usuarioRol, setUsuarioRol] = useState<UsuarioGestion | null>(null)
  const [usuarioToggle, setUsuarioToggle] = useState<UsuarioGestion | null>(null)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioGestion | null>(null)

  // ── Estados de errores de modales ─────────────────────────────────────────
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [errores422Crear, setErrores422Crear] = useState<Record<string, string[]> | undefined>()
  const [errores422Editar, setErrores422Editar] = useState<Record<string, string[]> | undefined>()

  // ── Hook principal — lee/escribe URL ──────────────────────────────────────
  const resultado = useFiltrosApi<UsuarioGestion>({
    endpoint: '/api/usuarios',
    filtrosDisponibles: {
      search: { tipo: 'texto' },
      activo: { tipo: 'seleccion' },
      rol: { tipo: 'seleccion' },
    },
    ordenDisponibles: ['name', 'email', 'dni', 'created_at'],
    porPaginaDefault: 15,
  })

  // ── Hook auxiliar — roles para el select ─────────────────────────────────
  // useTodosLosRoles retorna data: Rol[] directamente (TanStack Query wrappea el resultado)
  const { data: rolesDisponibles } = useTodosLosRoles()

  // ── Mutaciones ────────────────────────────────────────────────────────────
  const crearMutation = useCrearUsuario()
  const actualizarMutation = useActualizarUsuario()
  const eliminarMutation = useEliminarUsuario()
  const asignarRolMutation = useAsignarRolUsuario()
  const toggleActivoMutation = useToggleActivoUsuario()

  // ── Handlers de crear ─────────────────────────────────────────────────────
  function manejarSubmitCrear(datos: EsquemaCrearUsuario) {
    setErrores422Crear(undefined)
    crearMutation.mutate(datos, {
      onSuccess: () => {
        setModalCrearAbierto(false)
      },
      onError: (err) => {
        const errores = extraerMensaje422(err)
        if (errores) {
          setErrores422Crear(errores)
        } else {
          setErrores422Crear(undefined)
        }
      },
    })
  }

  // ── Handlers de editar ────────────────────────────────────────────────────
  function manejarSubmitEditar(datos: EsquemaEditarUsuario) {
    if (!usuarioEditando) return
    setErrores422Editar(undefined)
    actualizarMutation.mutate(
      { id: usuarioEditando.id, datos },
      {
        onSuccess: () => {
          setUsuarioEditando(null)
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

  // ── Handlers de asignar rol ───────────────────────────────────────────────
  function manejarAsignarRol(rol: string) {
    if (!usuarioRol) return
    setErrorModal(null)
    asignarRolMutation.mutate(
      { id: usuarioRol.id, datos: { rol } },
      {
        onSuccess: () => {
          setUsuarioRol(null)
        },
        onError: (err) => {
          setErrorModal(extraerMensajeError(err))
        },
      },
    )
  }

  // ── Handlers de toggle activo ─────────────────────────────────────────────
  function manejarToggleActivo() {
    if (!usuarioToggle) return
    setErrorModal(null)
    toggleActivoMutation.mutate(usuarioToggle.id, {
      onSuccess: () => {
        setUsuarioToggle(null)
      },
      onError: (err) => {
        setErrorModal(extraerMensajeError(err))
      },
    })
  }

  // ── Handlers de eliminar ──────────────────────────────────────────────────
  function manejarEliminar() {
    if (!usuarioAEliminar) return
    setErrorModal(null)
    eliminarMutation.mutate(usuarioAEliminar.id, {
      onSuccess: () => {
        setUsuarioAEliminar(null)
      },
      onError: (err) => {
        setErrorModal(extraerMensajeError(err))
      },
    })
  }

  const puedeCrear = tienePermiso('usuarios.crear')

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">Usuarios del sistema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de usuarios y sus roles de acceso
          </p>
        </div>

        {puedeCrear && (
          <Button onClick={() => setModalCrearAbierto(true)} className="shrink-0">
            <UserPlus className="mr-2 h-4 w-4" />
            Crear usuario
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BuscadorTexto
          valor={resultado.estado.filtros.search ?? ''}
          onCambio={(v) => resultado.setFiltro('search', v)}
          placeholder="Buscar por nombre o email..."
          className="max-w-sm flex-1"
        />
        <Select
          value={resultado.estado.filtros.activo ?? '__todos__'}
          onValueChange={(v) => resultado.setFiltro('activo', v === '__todos__' ? null : v)}
        >
          <SelectTrigger aria-label="Filtrar por estado" className="h-10 w-auto min-w-[160px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos__">Todos los estados</SelectItem>
            <SelectItem value="1">Activos</SelectItem>
            <SelectItem value="0">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={resultado.estado.filtros.rol ?? '__todos__'}
          onValueChange={(v) => resultado.setFiltro('rol', v === '__todos__' ? null : v)}
        >
          <SelectTrigger aria-label="Filtrar por rol" className="h-10 w-auto min-w-[160px]">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos__">Todos los roles</SelectItem>
            {rolesDisponibles?.map((rol) => (
              <SelectItem key={rol.id} value={rol.name}>
                {rol.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {resultado.isLoading && (
        <div className="space-y-3" aria-label="Cargando usuarios">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {resultado.isError && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <p className="text-sm">
            Error al cargar usuarios:{' '}
            {resultado.error instanceof Error ? resultado.error.message : 'Error desconocido'}
          </p>
        </div>
      )}

      {/* Tabla + Paginador */}
      {!resultado.isLoading && !resultado.isError && resultado.data && (
        <>
          <TablaUsuarios
            datos={resultado.data.data}
            ordenActual={resultado.estado.orden}
            onOrdenar={(col, dir) => {
              if (dir === null) resultado.quitarOrden()
              else resultado.setOrden(col, dir)
            }}
            alEditar={(u) => {
              setUsuarioEditando(u)
              setErrores422Editar(undefined)
            }}
            alAsignarRol={(u) => {
              setUsuarioRol(u)
              setErrorModal(null)
            }}
            alToggleActivo={(u) => {
              setUsuarioToggle(u)
              setErrorModal(null)
            }}
            alEliminar={(u) => {
              setUsuarioAEliminar(u)
              setErrorModal(null)
            }}
          />
          <PaginadorTabla
            pagina={resultado.estado.pagina}
            ultimaPagina={resultado.data.meta.last_page}
            onCambio={resultado.setPagina}
          />
        </>
      )}

      {/* Modal Crear */}
      <FormularioUsuario
        modo="crear"
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
      <FormularioUsuario
        modo="editar"
        abierto={usuarioEditando !== null}
        alCerrar={() => {
          setUsuarioEditando(null)
          setErrores422Editar(undefined)
        }}
        alSubmit={manejarSubmitEditar}
        usuarioEditando={usuarioEditando}
        estaCargando={actualizarMutation.isPending}
        errores422={errores422Editar}
      />

      {/* Modal Asignar Rol */}
      <DialogoAsignarRol
        abierto={usuarioRol !== null}
        alCerrar={() => {
          setUsuarioRol(null)
          setErrorModal(null)
        }}
        usuario={usuarioRol}
        alAsignar={manejarAsignarRol}
        estaCargando={asignarRolMutation.isPending}
        errorExterno={errorModal}
      />

      {/* Modal Toggle Activo */}
      <DialogoToggleActivo
        abierto={usuarioToggle !== null}
        alCerrar={() => {
          setUsuarioToggle(null)
          setErrorModal(null)
        }}
        usuario={usuarioToggle}
        alConfirmar={manejarToggleActivo}
        estaCargando={toggleActivoMutation.isPending}
        errorExterno={errorModal}
      />

      {/* Modal Eliminar */}
      <DialogoEliminarUsuario
        abierto={usuarioAEliminar !== null}
        alCerrar={() => {
          setUsuarioAEliminar(null)
          setErrorModal(null)
        }}
        usuario={usuarioAEliminar}
        alConfirmar={manejarEliminar}
        estaCargando={eliminarMutation.isPending}
        errorExterno={errorModal}
      />
    </div>
  )
}
