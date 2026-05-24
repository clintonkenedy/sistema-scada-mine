"""Entry point: levanta WebSocket + simulador + persistencia."""

from __future__ import annotations

import asyncio
import sys

from loguru import logger
from websockets.asyncio.server import serve

from scada_realtime.config import settings
from scada_realtime.geojson_loader import cargar_geojson
from scada_realtime.persistencia import Persistencia
from scada_realtime.servidor_ws import ServidorWebSocket
from scada_realtime.simulador import Simulador


def configurar_logger() -> None:
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level,
        format=(
            "<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>"
        ),
    )


async def main() -> None:
    configurar_logger()
    logger.info("scada-mine-realtime arrancando")
    logger.info(
        "Config: tick={}s, mult={}x, ws={}:{}",
        settings.simulator_tick_seconds,
        settings.simulator_speed_multiplier,
        settings.ws_host,
        settings.ws_port,
    )

    # Cargar rutas
    rutas, zonas = cargar_geojson(settings.geojson_path)
    logger.info("Cargadas {} rutas y {} zonas", len(rutas), len(zonas))

    # Conectar Postgres
    persistencia = Persistencia()
    await persistencia.conectar()

    # Iniciar servidor WS
    servidor = ServidorWebSocket()

    # Crear simulador
    simulador = Simulador(rutas, persistencia, servidor)
    await simulador.inicializar()

    # Levantar servidor WS + loop en paralelo
    try:
        async with serve(servidor.manejar_cliente, settings.ws_host, settings.ws_port):
            logger.success(
                "WebSocket escuchando en ws://{}:{}/",
                settings.ws_host,
                settings.ws_port,
            )
            await simulador.loop_principal()
    except KeyboardInterrupt:
        logger.info("Cerrando...")
    finally:
        await persistencia.cerrar()
        logger.info("Bye.")


if __name__ == "__main__":
    asyncio.run(main())
