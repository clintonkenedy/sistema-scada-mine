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
                "WHERE activo = true AND es_real = false AND deleted_at IS NULL ORDER BY codigo"
            )
            rows = await cur.fetchall()
            return [{"id": r[0], "codigo": r[1], "capacidad_toneladas": float(r[2])} for r in rows]

    async def insertar_posicion(self, datos: dict[str, Any]) -> None:
        """Inserta una posicion. Acepta campos de telemetria avanzada opcionales
        (calidad_gps, satelites, roll_grados, pitch_grados, tolva_cerrada,
        salud_via, temperatura_motor) — si no vienen quedan NULL."""
        assert self._pool is not None
        # Normalizar dict: asegurar que todas las claves existen (default None)
        # para que callers que solo pasen los campos viejos (ej. simulador) no
        # exploten con KeyError.
        completos = {
            "camion_id": datos["camion_id"],
            "lat": datos["lat"],
            "lng": datos["lng"],
            "velocidad_kmh": datos.get("velocidad_kmh"),
            "rumbo_grados": datos.get("rumbo_grados"),
            "carga": datos.get("carga"),
            "combustible": datos.get("combustible"),
            "estado": datos["estado"],
            "ruta_actual": datos.get("ruta_actual"),
            "ts": datos["ts"],
            "calidad_gps": datos.get("calidad_gps"),
            "satelites": datos.get("satelites"),
            "roll_grados": datos.get("roll_grados"),
            "pitch_grados": datos.get("pitch_grados"),
            "tolva_cerrada": datos.get("tolva_cerrada"),
            "salud_via": datos.get("salud_via"),
            "temperatura_motor": datos.get("temperatura_motor"),
        }
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO posiciones_camion
                    (camion_id, lat, lng, velocidad_kmh, rumbo_grados,
                     carga_actual_toneladas, combustible_porcentaje, estado,
                     ruta_actual, timestamp, created_at,
                     calidad_gps, satelites, roll_grados, pitch_grados,
                     tolva_cerrada, salud_via, temperatura_motor)
                VALUES (%(camion_id)s, %(lat)s, %(lng)s, %(velocidad_kmh)s,
                        %(rumbo_grados)s, %(carga)s, %(combustible)s, %(estado)s,
                        %(ruta_actual)s, %(ts)s, %(ts)s,
                        %(calidad_gps)s, %(satelites)s, %(roll_grados)s,
                        %(pitch_grados)s, %(tolva_cerrada)s, %(salud_via)s,
                        %(temperatura_motor)s)
                """,
                completos,
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

    async def cargar_configuracion(self) -> list[tuple[str, str, str]]:
        assert self._pool is not None
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute("SELECT clave, valor, tipo FROM configuracion_scada")
            rows = await cur.fetchall()
            return [(r[0], r[1], r[2]) for r in rows]

    async def actualizar_speed_multiplier(self, multiplier: float) -> None:
        assert self._pool is not None
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                "UPDATE configuracion_scada SET valor = %s, updated_at = NOW() "
                "WHERE clave = 'simulador_speed_multiplier'",
                (str(multiplier),),
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

    async def insertar_alerta(self, datos: dict[str, Any]) -> None:
        """Inserta una alerta en la tabla `alertas`. `contexto` debe venir como
        string JSON (o None) — se castea a jsonb dentro del SQL."""
        assert self._pool is not None
        async with self._pool.connection() as conn, conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO alertas
                    (camion_id, tipo, severidad, titulo, mensaje, lat, lng,
                     zona_nombre, estado_anterior, estado_nuevo, contexto,
                     timestamp, created_at)
                VALUES (%(camion_id)s, %(tipo)s, %(severidad)s, %(titulo)s,
                        %(mensaje)s, %(lat)s, %(lng)s, %(zona_nombre)s,
                        %(estado_anterior)s, %(estado_nuevo)s, %(contexto)s::jsonb,
                        %(timestamp)s, %(timestamp)s)
                """,
                datos,
            )
