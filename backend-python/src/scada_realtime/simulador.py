"""Logica de simulacion: mueve los camiones, persiste, broadcast.

El simulador emite SOLO posicion + velocidad (como lo haria un GPS real).
La derivacion del estado vive en `DetectorEstado` (geocercas + reglas).
Cuando lleguen sensores fisicos, reemplazamos el simulador por el ingest
del sensor y el resto del pipeline funciona igual.
"""

from __future__ import annotations

import asyncio
import math
import random
from datetime import UTC, datetime

from loguru import logger
from shapely.geometry import LineString

from scada_realtime.config import settings
from scada_realtime.configuracion_dinamica import ConfiguracionDinamica
from scada_realtime.detector_estado import DetectorEstado
from scada_realtime.geojson_loader import Ruta
from scada_realtime.modelos import EstadoCamionMemoria
from scada_realtime.persistencia import Persistencia
from scada_realtime.servidor_ws import ServidorWebSocket

# Velocidades de referencia en movimiento (km/h en tiempo "real" 1x)
VELOCIDAD_VACIO_KMH = 35.0
VELOCIDAD_CARGADO_KMH = 25.0

# Pausa virtual en cada extremo de ruta (segundos virtuales) para que el
# detector vea "quieto dentro de zona" y dispare carguio / descarga.
PAUSA_EXTREMO_S = 35.0


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    lat1r, lat2r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1r) * math.cos(lat2r) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _bearing_deg(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    lat1r, lat2r = math.radians(lat1), math.radians(lat2)
    dlng = math.radians(lng2 - lng1)
    y = math.sin(dlng) * math.cos(lat2r)
    x = math.cos(lat1r) * math.sin(lat2r) - math.sin(lat1r) * math.cos(lat2r) * math.cos(dlng)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _longitud_ruta_km(ls: LineString) -> float:
    coords = list(ls.coords)
    total = 0.0
    for i in range(len(coords) - 1):
        total += _haversine_km(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0])
    return total


class Simulador:
    def __init__(
        self,
        rutas: list[Ruta],
        persistencia: Persistencia,
        servidor: ServidorWebSocket,
        detector: DetectorEstado,
        config: ConfiguracionDinamica,
    ) -> None:
        self.rutas = rutas
        self.persistencia = persistencia
        self.servidor = servidor
        self.detector = detector
        self.config = config
        self.camiones: list[EstadoCamionMemoria] = []
        self._longitudes_rutas_km = [_longitud_ruta_km(r.linestring) for r in rutas]
        self._tareas_pendientes: set[asyncio.Task[None]] = set()
        self._activo = True

        # hook desde el servidor WS
        self.servidor.on_set_speed = self._set_speed

    def pausar(self) -> None:
        self._activo = False
        logger.info("Simulador pausado (modo real)")

    def reanudar(self) -> None:
        self._activo = True
        logger.info("Simulador reanudado (modo simulación)")

    @property
    def activo(self) -> bool:
        return self._activo

    @property
    def speed_multiplier(self) -> float:
        # Preferir el valor de la config dinamica; fallback al env.
        try:
            return self.config.simulador_speed_multiplier
        except Exception:
            return settings.simulator_speed_multiplier

    def _set_speed(self, mult: float) -> None:
        # Persistimos via persistencia; el refresh periodico lo va a tomar.
        logger.info("set_speed recibido por WS: {}x (se persiste a DB)", mult)
        tarea = asyncio.create_task(self._persistir_speed(mult))
        self._tareas_pendientes.add(tarea)
        tarea.add_done_callback(self._tareas_pendientes.discard)

    async def _persistir_speed(self, mult: float) -> None:
        try:
            await self.persistencia.actualizar_speed_multiplier(mult)
        except Exception as e:
            logger.warning("No se pudo persistir speed_multiplier: {}", e)

    async def inicializar(self) -> None:
        camiones_db = await self.persistencia.cargar_camiones()
        if not camiones_db:
            logger.error("No hay camiones activos en la DB. Abortando.")
            raise RuntimeError("No hay camiones para simular.")

        for c in camiones_db:
            estado = EstadoCamionMemoria(
                id=c["id"],
                codigo=c["codigo"],
                capacidad_toneladas=c["capacidad_toneladas"],
            )
            self._asignar_ruta_random(estado)
            self.camiones.append(estado)
        logger.info("Inicializados {} camiones con rutas aleatorias", len(self.camiones))

    def _asignar_ruta_random(self, c: EstadoCamionMemoria) -> None:
        idx = random.randrange(len(self.rutas))
        ruta = self.rutas[idx]
        c.ruta_actual_idx = idx
        c.ruta_actual_nombre = ruta.nombre
        c.progreso_ruta = 0.0
        c.direccion = "adelante"
        c.lat = ruta.coordenadas[0][1]
        c.lng = ruta.coordenadas[0][0]
        c.tiempo_en_estado_s = 0.0  # reutilizado como "tiempo en pausa de extremo"

    def _interpolar_punto(self, ls: LineString, t: float) -> tuple[float, float, float]:
        t = max(0.0, min(1.0, t))
        coords = list(ls.coords)
        n = len(coords) - 1
        seg = t * n
        i = int(seg)
        if i >= n:
            i = n - 1
        frac = seg - i
        lng1, lat1 = coords[i]
        lng2, lat2 = coords[i + 1]
        lng = lng1 + (lng2 - lng1) * frac
        lat = lat1 + (lat2 - lat1) * frac
        rumbo = _bearing_deg(lat1, lng1, lat2, lng2)
        return lat, lng, rumbo

    async def tick(self) -> None:
        ahora = datetime.now(UTC)
        tick_s = settings.simulator_tick_seconds
        segs_virtuales = tick_s * self.speed_multiplier

        for c in self.camiones:
            estado_anterior = c.estado

            # 1) Mover el camion (solo fisica: posicion + velocidad)
            self._mover_camion(c, segs_virtuales)

            # 2) Combustible cae siempre
            c.combustible_pct = max(0.0, c.combustible_pct - 0.05 * segs_virtuales / 60)

            # 3) Delegar la deteccion de estado al detector (geocercas)
            nuevo_estado = self.detector.detectar(
                c.id, c.lat, c.lng, c.velocidad_kmh, segs_virtuales
            )
            c.estado = nuevo_estado

            # 4) Ajustar carga segun el estado detectado
            self._ajustar_carga(c, segs_virtuales)

            # 5) Persistir posicion
            try:
                await self.persistencia.insertar_posicion(
                    {
                        "camion_id": c.id,
                        "lat": c.lat,
                        "lng": c.lng,
                        "velocidad_kmh": c.velocidad_kmh,
                        "rumbo_grados": c.rumbo_grados,
                        "carga": c.carga_actual,
                        "combustible": c.combustible_pct,
                        "estado": c.estado,
                        "ruta_actual": c.ruta_actual_nombre,
                        "ts": ahora,
                    }
                )
            except Exception as e:
                logger.error("Error insertando posicion de camion {}: {}", c.codigo, e)
            try:
                await self.persistencia.actualizar_ultima_posicion_camion(
                    c.id, c.lat, c.lng, c.estado, ahora
                )
            except Exception as e:
                logger.error(
                    "Error actualizando ultima posicion de camion {}: {}",
                    c.codigo,
                    e,
                )

            # 6) Si hubo cambio de estado, evento + broadcast extra
            if c.estado != estado_anterior:
                try:
                    await self.persistencia.insertar_evento(
                        {
                            "camion_id": c.id,
                            "estado_anterior": estado_anterior,
                            "estado_nuevo": c.estado,
                            "lat": c.lat,
                            "lng": c.lng,
                            "ruta_actual": c.ruta_actual_nombre,
                            "ts": ahora,
                        }
                    )
                except Exception as e:
                    logger.error("Error persistiendo evento {}: {}", c.codigo, e)
                await self.servidor.broadcast(
                    {
                        "tipo": "cambio_estado",
                        "timestamp": ahora.isoformat(),
                        "camion_id": c.id,
                        "codigo": c.codigo,
                        "estado_anterior": estado_anterior,
                        "estado_nuevo": c.estado,
                    }
                )

            # 7) Broadcast snapshot regular
            await self.servidor.broadcast(
                {
                    "tipo": "actualizacion",
                    "timestamp": ahora.isoformat(),
                    "camion": {
                        "id": c.id,
                        "codigo": c.codigo,
                        "lat": c.lat,
                        "lng": c.lng,
                        "velocidad_kmh": c.velocidad_kmh,
                        "rumbo_grados": c.rumbo_grados,
                        "carga_actual_toneladas": c.carga_actual,
                        "combustible_porcentaje": c.combustible_pct,
                        "estado": c.estado,
                        "ruta_actual": c.ruta_actual_nombre,
                    },
                }
            )

    def _mover_camion(self, c: EstadoCamionMemoria, segs_virtuales: float) -> None:
        """Avanza al camion por la ruta. Pausa en extremos para que el detector
        vea 'quieto dentro de zona' y dispare carguio/descarga. Cuando vuelve
        al inicio sin carga, reasigna ruta random.
        """
        assert c.ruta_actual_idx is not None
        ruta = self.rutas[c.ruta_actual_idx]
        ls = ruta.linestring
        long_km = self._longitudes_rutas_km[c.ruta_actual_idx]

        # ¿Esta en pausa de extremo?
        en_extremo = (c.direccion == "adelante" and c.progreso_ruta >= 1.0) or (
            c.direccion == "atras" and c.progreso_ruta <= 0.0
        )

        if en_extremo:
            c.tiempo_en_estado_s += segs_virtuales
            c.velocidad_kmh = 0.0
            # Posicion sigue siendo el extremo (sin recalcular)
            if c.tiempo_en_estado_s >= PAUSA_EXTREMO_S:
                # Dar la vuelta o asignar nueva ruta
                if c.direccion == "adelante":
                    c.direccion = "atras"
                    c.tiempo_en_estado_s = 0.0
                else:
                    # Volvio al inicio: nueva ruta random
                    self._asignar_ruta_random(c)
            return

        # En movimiento: avanzar segun velocidad apropiada al sentido
        # (vacio cuando va adelante, cargado cuando vuelve)
        v_kmh = VELOCIDAD_VACIO_KMH if c.direccion == "adelante" else VELOCIDAD_CARGADO_KMH
        km_avanzados = v_kmh * (segs_virtuales / 3600.0)
        delta_t = km_avanzados / max(long_km, 0.001)

        if c.direccion == "adelante":
            c.progreso_ruta = min(1.0, c.progreso_ruta + delta_t)
        else:
            c.progreso_ruta = max(0.0, c.progreso_ruta - delta_t)

        lat, lng, rumbo = self._interpolar_punto(ls, c.progreso_ruta)
        if c.direccion == "atras":
            rumbo = (rumbo + 180) % 360
        c.lat, c.lng = lat, lng
        c.rumbo_grados = rumbo
        c.velocidad_kmh = v_kmh + random.uniform(-3, 3)

        # Si recien llego al extremo, frenar a 0 para este tick
        if (c.direccion == "adelante" and c.progreso_ruta >= 1.0) or (
            c.direccion == "atras" and c.progreso_ruta <= 0.0
        ):
            c.velocidad_kmh = 0.0
            c.tiempo_en_estado_s = 0.0

    def _ajustar_carga(self, c: EstadoCamionMemoria, segs_virtuales: float) -> None:
        """La carga se ajusta segun el estado que el detector infirio."""
        if c.estado == "en_carguio":
            # tiempo nominal para llenar
            duracion = 30.0
            c.carga_actual = min(
                c.capacidad_toneladas,
                c.carga_actual + (c.capacidad_toneladas / duracion) * segs_virtuales,
            )
        elif c.estado == "descargando":
            duracion = 20.0
            c.carga_actual = max(
                0.0,
                c.carga_actual - (c.capacidad_toneladas / duracion) * segs_virtuales,
            )

    async def loop_principal(self) -> None:
        tick_s = settings.simulator_tick_seconds
        logger.info(
            "Loop iniciado. tick={}s, multiplicador inicial={}x",
            tick_s,
            self.speed_multiplier,
        )
        while True:
            inicio = asyncio.get_event_loop().time()
            if self._activo:
                try:
                    await self.tick()
                except Exception as e:
                    logger.exception("Error en tick: {}", e)
            transcurrido = asyncio.get_event_loop().time() - inicio
            pausa = max(0.0, tick_s - transcurrido)
            await asyncio.sleep(pausa)
