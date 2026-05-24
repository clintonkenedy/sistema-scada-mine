"""Entry point: levanta WebSocket + simulador + persistencia + config dinamica."""

from __future__ import annotations

import asyncio
import sys
from datetime import UTC, datetime
from typing import Any

from loguru import logger
from websockets.asyncio.server import serve

from scada_realtime.config import settings
from scada_realtime.configuracion_dinamica import ConfiguracionDinamica
from scada_realtime.detector_estado import DetectorEstado
from scada_realtime.geojson_loader import cargar_geojson
from scada_realtime.persistencia import Persistencia
from scada_realtime.proxy_real import ProxyReal
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


async def _obtener_id_camion_real(persistencia: Persistencia) -> int | None:
    assert persistencia._pool is not None
    async with persistencia._pool.connection() as conn, conn.cursor() as cur:
        await cur.execute(
            "SELECT id FROM camiones WHERE codigo = 'REAL-01' AND deleted_at IS NULL LIMIT 1"
        )
        row = await cur.fetchone()
        return int(row[0]) if row else None


async def orquestador_modo(
    config: ConfiguracionDinamica,
    simulador: Simulador,
    proxy_real_holder: dict[str, Any],
    persistencia: Persistencia,
    servidor: ServidorWebSocket,
    detector: DetectorEstado,
) -> None:
    """Loop que monitorea modo_operacion y switchea entre simulador y proxy."""
    modo_actual = "simulacion"

    camion_real_id = await _obtener_id_camion_real(persistencia)
    if camion_real_id is None:
        logger.warning("Camión REAL-01 no existe en DB. Modo real no disponible.")

    while True:
        await asyncio.sleep(2)
        try:
            await config.forzar_refresh()
            modo_deseado = config.modo_operacion
            url_real = config.url_websocket_real

            if modo_deseado == modo_actual:
                # mismo modo, pero si en real cambió la URL, reconectar
                if modo_actual == "real":
                    proxy = proxy_real_holder.get("proxy")
                    if proxy and proxy.url != url_real:
                        logger.info("URL real cambió, reconectando")
                        await proxy.detener()
                        if camion_real_id is not None:
                            nuevo_proxy = ProxyReal(
                                url=url_real,
                                persistencia=persistencia,
                                servidor=servidor,
                                detector=detector,
                                camion_real_id=camion_real_id,
                            )
                            await nuevo_proxy.iniciar()
                            proxy_real_holder["proxy"] = nuevo_proxy
                continue

            logger.info("Cambio de modo: {} → {}", modo_actual, modo_deseado)
            if modo_deseado == "real":
                if camion_real_id is None:
                    logger.error("Camión REAL-01 no existe en DB, no se puede activar modo real")
                    continue
                simulador.pausar()
                await servidor.broadcast(
                    {
                        "tipo": "modo_cambiado",
                        "modo": "real",
                        "timestamp": datetime.now(UTC).isoformat(),
                    }
                )
                proxy = ProxyReal(
                    url=url_real,
                    persistencia=persistencia,
                    servidor=servidor,
                    detector=detector,
                    camion_real_id=camion_real_id,
                )
                await proxy.iniciar()
                proxy_real_holder["proxy"] = proxy
            else:
                proxy = proxy_real_holder.get("proxy")
                if proxy:
                    await proxy.detener()
                    proxy_real_holder["proxy"] = None
                simulador.reanudar()
                await servidor.broadcast(
                    {
                        "tipo": "modo_cambiado",
                        "modo": "simulacion",
                        "timestamp": datetime.now(UTC).isoformat(),
                    }
                )

            modo_actual = modo_deseado
        except Exception as e:
            logger.exception("Error en orquestador_modo: {}", e)


async def main() -> None:
    configurar_logger()
    logger.info("scada-mine-realtime arrancando")
    logger.info(
        "Config: tick={}s, mult inicial={}x, ws={}:{}",
        settings.simulator_tick_seconds,
        settings.simulator_speed_multiplier,
        settings.ws_host,
        settings.ws_port,
    )

    # 1) Conectar Postgres
    persistencia = Persistencia()
    await persistencia.conectar()

    # 2) Cargar configuracion dinamica (con refresh background)
    config = ConfiguracionDinamica(persistencia)
    await config.cargar_inicial()

    # 3) Cargar rutas + zonas
    rutas, zonas = cargar_geojson(settings.geojson_path)
    logger.info("Cargadas {} rutas y {} zonas", len(rutas), len(zonas))

    # 4) Detector de estado por geocercas
    detector = DetectorEstado(zonas, config)

    # 5) Servidor WS
    servidor = ServidorWebSocket()

    # 6) Simulador
    simulador = Simulador(rutas, persistencia, servidor, detector, config)
    await simulador.inicializar()

    # 7) Orquestador de modo (simulacion ↔ real)
    proxy_holder: dict[str, Any] = {"proxy": None}
    tarea_orquestador = asyncio.create_task(
        orquestador_modo(config, simulador, proxy_holder, persistencia, servidor, detector)
    )

    # 8) WS server + loop
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
        tarea_orquestador.cancel()
        try:
            await tarea_orquestador
        except (asyncio.CancelledError, Exception):
            pass
        proxy = proxy_holder.get("proxy")
        if proxy:
            await proxy.detener()
        await config.detener()
        await persistencia.cerrar()
        logger.info("Bye.")


if __name__ == "__main__":
    asyncio.run(main())
