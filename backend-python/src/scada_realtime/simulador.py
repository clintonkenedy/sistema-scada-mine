"""Lógica de simulación: mueve los camiones, persiste, broadcast."""

from __future__ import annotations

import asyncio
import math
import random
from datetime import UTC, datetime

from loguru import logger
from shapely.geometry import LineString

from scada_realtime.config import settings
from scada_realtime.geojson_loader import Ruta
from scada_realtime.modelos import EstadoCamionMemoria
from scada_realtime.persistencia import Persistencia
from scada_realtime.servidor_ws import ServidorWebSocket

# Velocidades de referencia por estado (km/h en tiempo "real" 1x)
VELOCIDAD_BASE = {
    "en_ruta_vacio": 35.0,
    "en_ruta_cargado": 25.0,
    "en_carguio": 0.0,
    "descargando": 0.0,
    "detenido": 0.0,
    "mantenimiento": 0.0,
}

# Duración fija en cada estado estacionario (segundos virtuales)
DURACION_CARGUIO_S = 30.0
DURACION_DESCARGA_S = 20.0
DURACION_DETENIDO_S = 60.0
DURACION_MANTENIMIENTO_S = 300.0


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distancia haversine en kilómetros."""
    r = 6371.0
    lat1r, lat2r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1r) * math.cos(lat2r) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _bearing_deg(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Bearing inicial en grados, 0=N, 90=E, 180=S, 270=W."""
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
    ) -> None:
        self.rutas = rutas
        self.persistencia = persistencia
        self.servidor = servidor
        self.camiones: list[EstadoCamionMemoria] = []
        self.speed_multiplier = settings.simulator_speed_multiplier
        self._longitudes_rutas_km = [_longitud_ruta_km(r.linestring) for r in rutas]

        # hook desde el servidor WS
        self.servidor.on_set_speed = self._set_speed

    def _set_speed(self, mult: float) -> None:
        logger.info("Cambiando speed_multiplier de {} a {}", self.speed_multiplier, mult)
        self.speed_multiplier = mult

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
        c.estado = "en_ruta_vacio"
        c.lat = ruta.coordenadas[0][1]
        c.lng = ruta.coordenadas[0][0]

    def _interpolar_punto(self, ls: LineString, t: float) -> tuple[float, float, float]:
        """Devuelve (lat, lng, rumbo_grados) en el progreso t ∈ [0, 1]."""
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
            await self._procesar_camion(c, segs_virtuales, ahora)

            # Persistir SIEMPRE la posición
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
                logger.error("Error insertando posición de camion {}: {}", c.codigo, e)
            try:
                await self.persistencia.actualizar_ultima_posicion_camion(
                    c.id, c.lat, c.lng, c.estado, ahora
                )
            except Exception as e:
                logger.error(
                    "Error actualizando última posición de camion {}: {}",
                    c.codigo,
                    e,
                )

            # Si hubo cambio de estado, evento + broadcast extra
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

            # Broadcast snapshot regular
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

    async def _procesar_camion(
        self, c: EstadoCamionMemoria, segs_virtuales: float, ahora: datetime
    ) -> None:
        # Combustible cae siempre (lentamente)
        c.combustible_pct = max(0.0, c.combustible_pct - 0.05 * segs_virtuales / 60)

        # Tiempo acumulado en este estado
        c.tiempo_en_estado_s += segs_virtuales

        if c.estado in ("en_ruta_vacio", "en_ruta_cargado"):
            assert c.ruta_actual_idx is not None
            ruta = self.rutas[c.ruta_actual_idx]
            ls = ruta.linestring
            long_km = self._longitudes_rutas_km[c.ruta_actual_idx]
            v = VELOCIDAD_BASE[c.estado]
            km_avanzados = v * (segs_virtuales / 3600.0)
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
            c.velocidad_kmh = v + random.uniform(-3, 3)

            # ¿Llegó al final?
            if c.direccion == "adelante" and c.progreso_ruta >= 1.0:
                if c.estado == "en_ruta_vacio":
                    c.estado = "en_carguio"
                    c.tiempo_en_estado_s = 0.0
                else:  # en_ruta_cargado
                    c.estado = "descargando"
                    c.tiempo_en_estado_s = 0.0
            elif c.direccion == "atras" and c.progreso_ruta <= 0.0:
                if c.estado == "en_ruta_cargado":
                    c.estado = "descargando"
                    c.tiempo_en_estado_s = 0.0
                else:  # vuelve vacío al inicio → nuevo ciclo random
                    self._asignar_ruta_random(c)
                    c.tiempo_en_estado_s = 0.0

        elif c.estado == "en_carguio":
            c.velocidad_kmh = 0.0
            c.carga_actual = min(
                c.capacidad_toneladas,
                c.carga_actual + (c.capacidad_toneladas / DURACION_CARGUIO_S) * segs_virtuales,
            )
            if c.tiempo_en_estado_s >= DURACION_CARGUIO_S:
                # Listo, sale cargado por la misma ruta hacia atrás
                c.estado = "en_ruta_cargado"
                c.direccion = "atras"
                c.tiempo_en_estado_s = 0.0

        elif c.estado == "descargando":
            c.velocidad_kmh = 0.0
            c.carga_actual = max(
                0.0,
                c.carga_actual - (c.capacidad_toneladas / DURACION_DESCARGA_S) * segs_virtuales,
            )
            if c.tiempo_en_estado_s >= DURACION_DESCARGA_S:
                # Nuevo ciclo
                self._asignar_ruta_random(c)
                c.tiempo_en_estado_s = 0.0

        elif c.estado == "detenido":
            c.velocidad_kmh = 0.0
            if c.tiempo_en_estado_s >= DURACION_DETENIDO_S:
                # Vuelve al estado anterior (asumimos en_ruta_vacio)
                c.estado = "en_ruta_vacio"
                c.tiempo_en_estado_s = 0.0

        elif c.estado == "mantenimiento":
            c.velocidad_kmh = 0.0
            if c.tiempo_en_estado_s >= DURACION_MANTENIMIENTO_S:
                c.estado = "en_ruta_vacio"
                c.combustible_pct = 100.0
                c.tiempo_en_estado_s = 0.0

        # Probabilidad de eventos aleatorios (solo si estamos moviendo)
        if c.estado in ("en_ruta_vacio", "en_ruta_cargado"):
            r = random.random()
            if r < 0.001:
                c.estado = "mantenimiento"
                c.tiempo_en_estado_s = 0.0
                logger.warning("Camión {} → MANTENIMIENTO", c.codigo)
            elif r < 0.006:
                c.estado = "detenido"
                c.tiempo_en_estado_s = 0.0
                logger.info("Camión {} → detenido (avería leve)", c.codigo)

    async def loop_principal(self) -> None:
        tick_s = settings.simulator_tick_seconds
        logger.info(
            "Loop iniciado. tick={}s, multiplicador inicial={}x",
            tick_s,
            self.speed_multiplier,
        )
        while True:
            inicio = asyncio.get_event_loop().time()
            try:
                await self.tick()
            except Exception as e:
                logger.exception("Error en tick: {}", e)
            transcurrido = asyncio.get_event_loop().time() - inicio
            pausa = max(0.0, tick_s - transcurrido)
            await asyncio.sleep(pausa)
