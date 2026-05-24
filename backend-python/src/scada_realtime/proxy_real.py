"""Cliente WebSocket que se conecta a un dispositivo GPS externo (ESP32).

Parsea mensajes en formato JSON compacto:
    {"type": "line", "data": {"c":2,"a":-14.6,"o":-69.6,"f":4,"s":13,
                              "v":31.3,"r":2,"p":3,"u":1,"h":38,"t":86}}

donde `data` puede ser un dict directo o un string JSON escapado.

Claves: a=lat, o=lng, f=calidad_gps, s=satelites, v=velocidad_kmh,
r=roll, p=pitch, u=tolva (1=cerrada), h=salud_via, t=temperatura_motor.

Calcula rumbo entre puntos consecutivos, aplica el detector de geocercas,
persiste en DB y emite por el WebSocket server del SCADA.
"""

from __future__ import annotations

import asyncio
import json
import math
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from loguru import logger
from websockets.asyncio.client import connect as ws_connect
from websockets.exceptions import ConnectionClosed, InvalidURI

from scada_realtime.detector_estado import DetectorEstado
from scada_realtime.persistencia import Persistencia
from scada_realtime.servidor_ws import ServidorWebSocket


@dataclass
class TelemetriaCompacta:
    """Datos extraidos del mensaje del ESP32. Coordenadas obligatorias, resto opcional."""

    lat: float
    lng: float
    velocidad_kmh: float | None = None
    calidad_gps: int | None = None
    satelites: int | None = None
    roll_grados: float | None = None
    pitch_grados: float | None = None
    tolva_cerrada: bool | None = None
    salud_via: int | None = None
    temperatura_motor: int | None = None


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


class ProxyReal:
    """Cliente WS que escucha un dispositivo externo y actualiza camión REAL-01."""

    def __init__(
        self,
        url: str,
        persistencia: Persistencia,
        servidor: ServidorWebSocket,
        detector: DetectorEstado,
        camion_real_id: int,
        codigo_camion: str = "REAL-01",
    ) -> None:
        self.url = url
        self.persistencia = persistencia
        self.servidor = servidor
        self.detector = detector
        self.camion_real_id = camion_real_id
        self.codigo_camion = codigo_camion

        self._task: asyncio.Task[None] | None = None
        self._conectado = False
        self._stop_event: asyncio.Event = asyncio.Event()

        # estado para calcular velocidad/rumbo entre puntos
        self._ultimo_lat: float | None = None
        self._ultimo_lng: float | None = None
        self._ultimo_ts: datetime | None = None

    async def iniciar(self) -> None:
        """Arranca el proxy en background. Idempotente."""
        if self._task is not None and not self._task.done():
            logger.warning("ProxyReal ya estaba corriendo, ignorando iniciar()")
            return
        self._stop_event.clear()
        self._task = asyncio.create_task(self._loop_conexion())
        logger.info("ProxyReal iniciado, conectando a {}", self.url)

    async def detener(self) -> None:
        """Frena el proxy. Cierra conexión si está abierta."""
        if self._conectado or self._task:
            try:
                await self.servidor.broadcast(
                    {
                        "tipo": "estado_proxy_real",
                        "estado": "desconectado",
                        "url": self.url,
                        "timestamp": datetime.now(UTC).isoformat(),
                    }
                )
            except Exception as e:
                logger.warning("No se pudo emitir estado desconectado: {}", e)
        self._stop_event.set()
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except (asyncio.CancelledError, Exception):
                pass
        self._task = None
        self._conectado = False
        logger.info("ProxyReal detenido")

    @property
    def conectado(self) -> bool:
        return self._conectado

    async def _broadcast_estado(
        self,
        estado: str,
        mensaje: str | None = None,
        tipo_error: str | None = None,
    ) -> None:
        """Emite estado del proxy. estado in {conectando, conectado, error, desconectado}."""
        payload: dict[str, Any] = {
            "tipo": "estado_proxy_real",
            "estado": estado,
            "url": self.url,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        if mensaje:
            payload["mensaje"] = mensaje
        if tipo_error:
            payload["tipo_error"] = tipo_error
        await self.servidor.broadcast(payload)

    def _clasificar_error(self, exc: Exception) -> tuple[str, str]:
        """Devuelve (tipo_error, mensaje_user_friendly)."""
        raw = str(exc).lower()
        if (
            "cannot connect to host" in raw
            or "name or service not known" in raw
            or "no address" in raw
            or "nodename nor servname" in raw
        ):
            return (
                "host_inalcanzable",
                f"No se pudo conectar a {self.url} "
                "(host inalcanzable - ESP32 apagado o IP incorrecta)",
            )
        if "connection refused" in raw:
            return (
                "puerto_cerrado",
                f"Puerto cerrado en {self.url} (no hay servidor escuchando)",
            )
        if "timeout" in raw:
            return (
                "timeout",
                f"Timeout conectando a {self.url} (el servidor no respondio en 10s)",
            )
        return "desconocido", f"Error desconocido: {exc}"

    async def _loop_conexion(self) -> None:
        """Loop con reconexión exponencial."""
        # Validacion fail-fast de URL
        if not (self.url.startswith("ws://") or self.url.startswith("wss://")):
            logger.error("URL invalida: {}", self.url)
            await self._broadcast_estado(
                "error",
                mensaje=f"URL invalida: debe empezar con ws:// o wss:// (recibido: {self.url})",
                tipo_error="url_invalida",
            )
            return

        backoff = 1.0
        while not self._stop_event.is_set():
            try:
                logger.info("Intentando conectar a {}", self.url)
                await self._broadcast_estado("conectando")
                async with ws_connect(self.url, open_timeout=10) as ws:
                    self._conectado = True
                    backoff = 1.0
                    logger.success("Conectado a {}", self.url)
                    await self._broadcast_estado("conectado")

                    async for raw in ws:
                        await self._procesar_mensaje(raw)
            except InvalidURI:
                logger.error("URL invalida: {}", self.url)
                await self._broadcast_estado(
                    "error",
                    mensaje=f"URL invalida: {self.url}",
                    tipo_error="url_invalida",
                )
                return
            except ConnectionClosed as e:
                logger.warning("Conexion cerrada: {}", e)
                self._conectado = False
                await self._broadcast_estado(
                    "error",
                    mensaje="Conexion cerrada por el servidor",
                    tipo_error="cerrado",
                )
            except TimeoutError as e:
                logger.error("Timeout en conexion: {}", e)
                self._conectado = False
                await self._broadcast_estado(
                    "error",
                    mensaje=f"Timeout conectando a {self.url} (el servidor no respondio en 10s)",
                    tipo_error="timeout",
                )
            except Exception as e:
                tipo_err, msg = self._clasificar_error(e)
                logger.error("Error en conexion: {} ({})", msg, tipo_err)
                self._conectado = False
                await self._broadcast_estado("error", mensaje=msg, tipo_error=tipo_err)

            if self._stop_event.is_set():
                break

            logger.info("Reintentando en {}s", backoff)
            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=backoff)
            except TimeoutError:
                pass
            backoff = min(30.0, backoff * 2)

    async def _procesar_mensaje(self, raw: str | bytes) -> None:
        """Parsea un mensaje y actualiza estado del camión REAL-01."""
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8", errors="ignore")

        # Loguear raw para debug (puede silenciarse despues bajando el nivel)
        logger.debug("RAW ESP32: {}", raw[:200])

        tele = self._extraer_telemetria(raw)
        if tele is None:
            return

        # Validar calidad GPS — warning si < 4 (RTK fijo)
        if tele.calidad_gps is not None and tele.calidad_gps < 4:
            logger.warning(
                "Calidad GPS degradada: f={} (esperado >=4 para RTK)",
                tele.calidad_gps,
            )
            # NO descartamos — pasamos al frontend con la calidad para que muestre warning

        ahora = datetime.now(UTC)

        # Velocidad del ESP32 si vino, sino calcular por haversine
        velocidad_kmh = tele.velocidad_kmh
        rumbo = 0.0
        if (
            self._ultimo_lat is not None
            and self._ultimo_lng is not None
            and self._ultimo_ts is not None
        ):
            # Rumbo siempre se calcula entre puntos (el ESP32 no manda heading real)
            rumbo = _bearing_deg(self._ultimo_lat, self._ultimo_lng, tele.lat, tele.lng)
            # Si NO vino velocidad, calcularla
            if velocidad_kmh is None:
                dist_km = _haversine_km(self._ultimo_lat, self._ultimo_lng, tele.lat, tele.lng)
                dt_s = (ahora - self._ultimo_ts).total_seconds()
                if dt_s > 0:
                    velocidad_kmh = (dist_km * 3600.0) / dt_s

        if velocidad_kmh is None:
            velocidad_kmh = 0.0

        self._ultimo_lat = tele.lat
        self._ultimo_lng = tele.lng
        self._ultimo_ts = ahora

        # GPS llega aprox 1Hz; el detector trackea tiempo acumulado interno
        estado = self.detector.detectar(self.camion_real_id, tele.lat, tele.lng, velocidad_kmh, 1.0)

        try:
            await self.persistencia.insertar_posicion(
                {
                    "camion_id": self.camion_real_id,
                    "lat": tele.lat,
                    "lng": tele.lng,
                    "velocidad_kmh": velocidad_kmh,
                    "rumbo_grados": rumbo,
                    "carga": 0.0,  # ESP32 no lo manda
                    "combustible": 100.0,  # ESP32 no lo manda
                    "estado": estado,
                    "ruta_actual": None,
                    "ts": ahora,
                    # NUEVOS — telemetria avanzada
                    "calidad_gps": tele.calidad_gps,
                    "satelites": tele.satelites,
                    "roll_grados": tele.roll_grados,
                    "pitch_grados": tele.pitch_grados,
                    "tolva_cerrada": tele.tolva_cerrada,
                    "salud_via": tele.salud_via,
                    "temperatura_motor": tele.temperatura_motor,
                }
            )
            await self.persistencia.actualizar_ultima_posicion_camion(
                self.camion_real_id, tele.lat, tele.lng, estado, ahora
            )
        except Exception as e:
            logger.error("Error persistiendo posicion REAL: {}", e)

        await self.servidor.broadcast(
            {
                "tipo": "actualizacion",
                "timestamp": ahora.isoformat(),
                "camion": {
                    "id": self.camion_real_id,
                    "codigo": self.codigo_camion,
                    "lat": tele.lat,
                    "lng": tele.lng,
                    "velocidad_kmh": velocidad_kmh,
                    "rumbo_grados": rumbo,
                    "carga_actual_toneladas": None,  # null para REAL
                    "combustible_porcentaje": None,  # null para REAL
                    "estado": estado,
                    "ruta_actual": None,
                    "es_real": True,
                    # NUEVOS — telemetria avanzada
                    "calidad_gps": tele.calidad_gps,
                    "satelites": tele.satelites,
                    "roll_grados": tele.roll_grados,
                    "pitch_grados": tele.pitch_grados,
                    "tolva_cerrada": tele.tolva_cerrada,
                    "salud_via": tele.salud_via,
                    "temperatura_motor": tele.temperatura_motor,
                },
            }
        )

    def _extraer_telemetria(self, raw: str) -> TelemetriaCompacta | None:
        """Parsea mensaje del ESP32 — formato JSON compacto.

        Acepta:
        - {"type":"line","data":{...}}     (data como dict)
        - {"type":"line","data":"{...}"}   (data como string JSON escapado)
        - {...}                            (dict directo sin envoltorio)
        """
        try:
            msg = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            logger.debug("Mensaje no es JSON valido: {}", raw[:120])
            return None

        if not isinstance(msg, dict):
            return None

        # data puede venir anidado o el propio msg ser ya el payload
        data: Any = msg.get("data")
        if data is None:
            data = msg

        # data puede ser un string que contiene JSON escapado
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except (json.JSONDecodeError, ValueError):
                logger.debug("Data string no parseable como JSON: {}", data[:120])
                return None

        if not isinstance(data, dict):
            return None

        # Campos requeridos: lat (a) y lng (o)
        try:
            lat = float(data["a"])
            lng = float(data["o"])
        except (KeyError, ValueError, TypeError):
            logger.debug("Mensaje sin lat/lng (claves a/o): {}", data)
            return None

        return TelemetriaCompacta(
            lat=lat,
            lng=lng,
            velocidad_kmh=float(data["v"]) if "v" in data else None,
            calidad_gps=int(data["f"]) if "f" in data else None,
            satelites=int(data["s"]) if "s" in data else None,
            roll_grados=float(data["r"]) if "r" in data else None,
            pitch_grados=float(data["p"]) if "p" in data else None,
            tolva_cerrada=bool(int(data["u"])) if "u" in data else None,
            salud_via=int(data["h"]) if "h" in data else None,
            temperatura_motor=int(data["t"]) if "t" in data else None,
        )
