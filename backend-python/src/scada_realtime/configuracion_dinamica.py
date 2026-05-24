"""Configuracion dinamica leida de la tabla configuracion_scada en Postgres.

Esta clase mantiene un cache en memoria que se refresca cada N segundos en
background. Las propiedades retornan valores ya tipeados.
"""

from __future__ import annotations

import asyncio
from typing import Any

from loguru import logger

from scada_realtime.persistencia import Persistencia


class ConfiguracionDinamica:
    """Cache en memoria de configuracion_scada, refrescado periodicamente."""

    def __init__(self, persistencia: Persistencia, refresh_segundos: int = 30) -> None:
        self._persistencia = persistencia
        self._refresh_s = refresh_segundos
        self._valores: dict[str, Any] = {}
        self._task: asyncio.Task[None] | None = None

    async def cargar_inicial(self) -> None:
        await self._refrescar()
        self._task = asyncio.create_task(self._loop_refresh())

    async def forzar_refresh(self) -> None:
        """Refresca config inmediatamente, sin esperar al tick periodico."""
        await self._refrescar()

    async def detener(self) -> None:
        if self._task:
            self._task.cancel()

    async def _loop_refresh(self) -> None:
        try:
            while True:
                await asyncio.sleep(self._refresh_s)
                await self._refrescar()
        except asyncio.CancelledError:
            pass

    async def _refrescar(self) -> None:
        try:
            rows = await self._persistencia.cargar_configuracion()
            nuevos: dict[str, Any] = {}
            for clave, valor, tipo in rows:
                if tipo == "entero":
                    nuevos[clave] = int(valor)
                elif tipo == "decimal":
                    nuevos[clave] = float(valor)
                elif tipo == "booleano":
                    nuevos[clave] = valor.lower() in ("true", "1", "yes")
                else:
                    nuevos[clave] = valor
            if nuevos != self._valores:
                logger.info("Configuracion actualizada: {}", nuevos)
            self._valores = nuevos
        except Exception as e:
            logger.warning("No se pudo refrescar configuracion: {}", e)

    @property
    def velocidad_parado_kmh(self) -> float:
        return float(self._valores.get("velocidad_parado_kmh", 2.0))

    @property
    def tiempo_minimo_zona_segundos(self) -> int:
        return int(self._valores.get("tiempo_minimo_zona_segundos", 15))

    @property
    def tiempo_muerto_minutos(self) -> int:
        return int(self._valores.get("tiempo_muerto_minutos", 5))

    @property
    def simulador_speed_multiplier(self) -> float:
        return float(self._valores.get("simulador_speed_multiplier", 1.0))

    @property
    def modo_operacion(self) -> str:
        return str(self._valores.get("modo_operacion", "simulacion"))

    @property
    def url_websocket_real(self) -> str:
        return str(self._valores.get("url_websocket_real", "ws://localhost:8766"))
