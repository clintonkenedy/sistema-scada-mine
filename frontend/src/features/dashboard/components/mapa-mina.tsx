import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { CamionEnVivo } from '@/shared/hooks/use-websocket-camiones'
import type { EstadoCamion } from '@/features/camiones/types/camion'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const CENTRO_MINA: [number, number] = [-69.61148, -14.65251]
const ZOOM_INICIAL = 16

/**
 * Mapeo hex para colorear los marcadores DOM de los camiones.
 * TODO: derivar de `COLORES_ESTADO` en `@/features/camiones/lib/estado-colors`
 * cuando movamos esos tokens a CSS variables — hoy esas clases son utilidades
 * Tailwind (bg-blue-500 etc.) que no se pueden aplicar al estilo inline de un
 * div fuera del árbol React (los markers de Mapbox son nodos DOM imperativos).
 */
const COLOR_HEX_ESTADO: Record<EstadoCamion, string> = {
  en_ruta_vacio: '#3b82f6',
  en_carguio: '#eab308',
  en_ruta_cargado: '#22c55e',
  descargando: '#f97316',
  detenido: '#ef4444',
  mantenimiento: '#6b7280',
  tiempo_muerto: '#b45309',
}

type Props = {
  camiones: Map<number, CamionEnVivo>
  onCamionClick: (camionId: number) => void
}

export function MapaMina({ camiones, onCamionClick }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<mapboxgl.Map | null>(null)
  const marcadoresRef = useRef<Map<number, mapboxgl.Marker>>(new Map())
  const mapaListoRef = useRef(false)

  // Inicialización del mapa + capas GeoJSON (rutas y zonas operativas).
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return
    if (!mapboxgl.accessToken) {
      console.error(
        'VITE_MAPBOX_TOKEN no configurado. Pegá tu token en frontend/.env',
      )
      return
    }

    const mapa = new mapboxgl.Map({
      container: contenedorRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: CENTRO_MINA,
      zoom: ZOOM_INICIAL,
    })

    mapaRef.current = mapa

    mapa.on('load', async () => {
      try {
        const resp = await fetch('/rutas-mina.geojson')
        const data = (await resp.json()) as GeoJSON.FeatureCollection

        mapa.addSource('rutas-zonas', { type: 'geojson', data })

        // Zonas operativas: fill semi-transparente + outline + label.
        mapa.addLayer({
          id: 'zonas-fill',
          type: 'fill',
          source: 'rutas-zonas',
          filter: ['==', ['get', 'categoria'], 'zona'],
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.25,
          },
        })

        mapa.addLayer({
          id: 'zonas-outline',
          type: 'line',
          source: 'rutas-zonas',
          filter: ['==', ['get', 'categoria'], 'zona'],
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
          },
        })

        mapa.addLayer({
          id: 'zonas-label',
          type: 'symbol',
          source: 'rutas-zonas',
          filter: ['==', ['get', 'categoria'], 'zona'],
          layout: {
            'text-field': ['get', 'nombre'],
            'text-size': 12,
            'text-anchor': 'center',
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1.5,
          },
        })

        // Rutas de acarreo (LineString) coloreadas por feature.
        mapa.addLayer({
          id: 'rutas-line',
          type: 'line',
          source: 'rutas-zonas',
          filter: ['==', ['get', 'categoria'], 'ruta'],
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 3,
            'line-opacity': 0.85,
          },
        })

        mapaListoRef.current = true
        // Disparar un re-render de markers una vez que el estilo cargó.
        sincronizarMarcadores()
      } catch (error) {
        console.error('No se pudo cargar /rutas-mina.geojson', error)
      }
    })

    return () => {
      mapa.remove()
      mapaRef.current = null
      mapaListoRef.current = false
      marcadoresRef.current.clear()
    }
    // sincronizarMarcadores se define abajo y captura `camiones` via ref-less
    // closure — pero usamos el efecto siguiente para sincronizar en updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincronización de marcadores cuando cambia el mapa de camiones.
  useEffect(() => {
    sincronizarMarcadores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camiones, onCamionClick])

  function sincronizarMarcadores() {
    const mapa = mapaRef.current
    if (!mapa || !mapaListoRef.current) return

    const idsActuales = new Set<number>()

    for (const camion of camiones.values()) {
      idsActuales.add(camion.id)
      const existente = marcadoresRef.current.get(camion.id)
      const color = COLOR_HEX_ESTADO[camion.estado] ?? '#6b7280'
      const esReal = !!camion.es_real

      if (existente) {
        existente.setLngLat([camion.lng, camion.lat])
        existente.setRotation(camion.rumbo_grados)
        const el = existente.getElement()
        el.dataset.estado = camion.estado
        el.style.background = color
        // El flag `es_real` puede cambiar entre snapshots: re-aplicamos los
        // estilos distintivos cada vez para mantener consistencia.
        if (esReal) {
          el.classList.add('marker-camion-real')
          el.style.width = '44px'
          el.style.height = '44px'
          el.style.fontSize = '11px'
          el.style.border = '3px solid #facc15'
          el.style.boxShadow =
            '0 0 0 3px rgba(250, 204, 21, 0.4), 0 2px 6px rgba(0,0,0,0.5)'
        } else {
          el.classList.remove('marker-camion-real')
          el.style.width = '36px'
          el.style.height = '36px'
          el.style.fontSize = '10px'
          el.style.border = '2px solid white'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)'
        }
        const codigoEl = el.querySelector('.codigo-camion')
        if (codigoEl) codigoEl.textContent = camion.codigo
      } else {
        const el = document.createElement('div')
        el.className = esReal
          ? 'marker-camion marker-camion-real'
          : 'marker-camion'
        el.dataset.estado = camion.estado
        el.style.cssText = `
          width: ${esReal ? '44px' : '36px'}; height: ${esReal ? '44px' : '36px'}; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: ${esReal ? '11px' : '10px'}; color: white;
          cursor: pointer;
          border: ${esReal ? '3px solid #facc15' : '2px solid white'};
          box-shadow: ${esReal ? '0 0 0 3px rgba(250, 204, 21, 0.4), 0 2px 6px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.4)'};
          background: ${color};
          transition: transform 0.5s ease-out;
        `
        el.innerHTML = `<span class="codigo-camion">${camion.codigo}</span>`

        const marker = new mapboxgl.Marker({
          element: el,
          rotationAlignment: 'map',
        })
          .setLngLat([camion.lng, camion.lat])
          .setRotation(camion.rumbo_grados)
          .addTo(mapa)

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onCamionClick(camion.id)
        })

        marcadoresRef.current.set(camion.id, marker)
      }
    }

    // Eliminar marcadores de camiones que ya no aparecen en el snapshot.
    for (const [id, marker] of marcadoresRef.current.entries()) {
      if (!idsActuales.has(id)) {
        marker.remove()
        marcadoresRef.current.delete(id)
      }
    }
  }

  return (
    <div ref={contenedorRef} className="w-full h-full" data-testid="mapa-mina" />
  )
}
