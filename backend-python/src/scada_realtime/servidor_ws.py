"""Servidor WebSocket. Broadcast a todos los clientes conectados."""

from __future__ import annotations

import asyncio
import json
from collections.abc import Callable
from typing import Any

from loguru import logger
from websockets.asyncio.server import ServerConnection


class ServidorWebSocket:
    def __init__(self) -> None:
        self._clientes: set[ServerConnection] = set()
        self._lock = asyncio.Lock()
        self.on_set_speed: Callable[[float], None] | None = None

    async def manejar_cliente(self, websocket: ServerConnection) -> None:
        async with self._lock:
            self._clientes.add(websocket)
        logger.info("Cliente conectado. Total: {}", len(self._clientes))
        try:
            async for raw in websocket:
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    logger.warning("Mensaje inválido del cliente: {}", raw)
                    continue
                if msg.get("tipo") == "set_speed" and self.on_set_speed:
                    mult = float(msg.get("multiplier", 1.0))
                    mult = max(0.1, min(100.0, mult))
                    self.on_set_speed(mult)
                    logger.info("Speed multiplier seteado a {}x por cliente", mult)
        except Exception as e:
            logger.warning("Cliente desconectado con error: {}", e)
        finally:
            async with self._lock:
                self._clientes.discard(websocket)
            logger.info("Cliente desconectado. Total: {}", len(self._clientes))

    async def broadcast(self, payload: dict[str, Any]) -> None:
        if not self._clientes:
            return
        mensaje = json.dumps(payload, default=str)
        # snapshot del set para no modificar durante iteración
        async with self._lock:
            destinatarios = list(self._clientes)
        tareas = [c.send(mensaje) for c in destinatarios]
        await asyncio.gather(*tareas, return_exceptions=True)
