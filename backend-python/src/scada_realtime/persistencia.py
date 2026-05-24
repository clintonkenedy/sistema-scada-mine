"""Acceso async a Postgres via psycopg + pool."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from loguru import logger
from psycopg_pool import AsyncConnectionPool

from scada_realtime.config import settings


class Persistencia:
    """Wrapper del pool de conexiones + helpers de INSERT/UPDATE."""

    def __init__(self) -> None:
        self._pool: AsyncConnectionPool | None = None

    async def conectar(self) -> None:
        self._pool = AsyncConnectionPool(
            conninfo=settings.database_url,
            min_size=2,
            max_size=8,
            open=False,
        )
        await self._pool.open()
        logger.info("Pool Postgres abierto (2-8 conexiones)")

    async def cerrar(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            logger.info("Pool Postgres cerrado")

    async def cargar_camiones(self) -> list[dict[str, Any]]:
        assert self._pool is not None
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                "SELECT id, codigo, capacidad_toneladas FROM camiones "
                "WHERE activo = true AND deleted_at IS NULL ORDER BY codigo"
            )
            rows = await cur.fetchall()
            return [{"id": r[0], "codigo": r[1], "capacidad_toneladas": float(r[2])} for r in rows]

    async def insertar_posicion(self, datos: dict[str, Any]) -> None:
        assert self._pool is not None
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO posiciones_camion
                    (camion_id, lat, lng, velocidad_kmh, rumbo_grados,
                     carga_actual_toneladas, combustible_porcentaje, estado,
                     ruta_actual, timestamp, created_at)
                VALUES (%(camion_id)s, %(lat)s, %(lng)s, %(velocidad_kmh)s,
                        %(rumbo_grados)s, %(carga)s, %(combustible)s, %(estado)s,
                        %(ruta_actual)s, %(ts)s, %(ts)s)
                """,
                datos,
            )

    async def insertar_evento(self, datos: dict[str, Any]) -> None:
        assert self._pool is not None
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO eventos_camion
                    (camion_id, estado_anterior, estado_nuevo,
                     lat, lng, ruta_actual, timestamp, created_at)
                VALUES (%(camion_id)s, %(estado_anterior)s, %(estado_nuevo)s,
                        %(lat)s, %(lng)s, %(ruta_actual)s, %(ts)s, %(ts)s)
                """,
                datos,
            )

    async def actualizar_ultima_posicion_camion(
        self,
        camion_id: int,
        lat: float,
        lng: float,
        estado: str,
        ts: datetime,
    ) -> None:
        assert self._pool is not None
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                """
                UPDATE camiones
                SET ultima_lat = %s,
                    ultima_lng = %s,
                    estado_actual = %s,
                    ultima_actualizacion = %s,
                    updated_at = %s
                WHERE id = %s
                """,
                (lat, lng, estado, ts, ts, camion_id),
            )
