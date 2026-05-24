"""Detector de eventos críticos del camión REAL → emite alertas.

Edge detection: solo emite cuando una condición cambia (NO en cada tick).
Persiste en Postgres (tabla `alertas`) y emite por WebSocket al frontend.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

from loguru import logger

from scada_realtime.persistencia import Persistencia
from scada_realtime.servidor_ws import ServidorWebSocket

Severidad = Literal["info", "warning", "danger"]
TipoAlerta = Literal[
    "entrada_zona",
    "salida_zona",
    "cambio_estado",
    "tiempo_muerto",
    "calidad_gps_baja",
    "temperatura_alta",
    "salud_via_baja",
    "tolva_fuera_zona",
]


@dataclass
class EstadoSeguimientoAlertas:
    """Estado previo del camion para edge detection."""

    zona_anterior: str | None = None
    estado_anterior: str | None = None
    calidad_gps_anterior_baja: bool = False
    temperatura_anterior_alta: bool = False
    salud_via_anterior_baja: bool = False
    tolva_fuera_zona_anterior: bool = False
    en_tiempo_muerto: bool = False


# Umbrales (mañana podrían venir de configuracion_scada)
UMBRAL_CALIDAD_GPS_MINIMA = 4
UMBRAL_TEMPERATURA_MAXIMA = 95
UMBRAL_SALUD_VIA_MINIMA = 50

# Zonas donde tolva PUEDE estar abierta sin alertar
ZONAS_DESCARGA = {"Botadero", "Coronación", "Chute", "Corte", "Cierre Progresivo"}


class EmisorAlertas:
    def __init__(self, persistencia: Persistencia, servidor: ServidorWebSocket) -> None:
        self.persistencia = persistencia
        self.servidor = servidor
        self._estados: dict[int, EstadoSeguimientoAlertas] = {}

    def _estado(self, camion_id: int) -> EstadoSeguimientoAlertas:
        if camion_id not in self._estados:
            self._estados[camion_id] = EstadoSeguimientoAlertas()
        return self._estados[camion_id]

    async def evaluar(
        self,
        camion_id: int,
        codigo_camion: str,
        lat: float,
        lng: float,
        estado_actual: str,
        zona_actual: str | None,
        calidad_gps: int | None,
        temperatura_motor: int | None,
        salud_via: int | None,
        tolva_cerrada: bool | None,
    ) -> None:
        """Evalúa todas las condiciones y emite alertas según edge detection."""
        seg = self._estado(camion_id)
        ahora = datetime.now(UTC)

        # 1) Entrada/salida de zona
        if zona_actual != seg.zona_anterior:
            if seg.zona_anterior is not None:
                await self._emitir(
                    camion_id=camion_id,
                    codigo=codigo_camion,
                    tipo="salida_zona",
                    severidad="info",
                    titulo=f"{codigo_camion} salió de {seg.zona_anterior}",
                    mensaje=None,
                    lat=lat,
                    lng=lng,
                    zona=seg.zona_anterior,
                    ts=ahora,
                )
            if zona_actual is not None:
                await self._emitir(
                    camion_id=camion_id,
                    codigo=codigo_camion,
                    tipo="entrada_zona",
                    severidad="info",
                    titulo=f"{codigo_camion} entró a {zona_actual}",
                    mensaje=None,
                    lat=lat,
                    lng=lng,
                    zona=zona_actual,
                    ts=ahora,
                )
            seg.zona_anterior = zona_actual

        # 2) Cambio de estado
        if estado_actual != seg.estado_anterior:
            if seg.estado_anterior is not None:
                await self._emitir(
                    camion_id=camion_id,
                    codigo=codigo_camion,
                    tipo="cambio_estado",
                    severidad="info",
                    titulo=f"{codigo_camion}: {seg.estado_anterior} → {estado_actual}",
                    mensaje=None,
                    lat=lat,
                    lng=lng,
                    zona=zona_actual,
                    estado_anterior=seg.estado_anterior,
                    estado_nuevo=estado_actual,
                    ts=ahora,
                )
            seg.estado_anterior = estado_actual

        # 3) Tiempo muerto (edge: entra al estado tiempo_muerto)
        if estado_actual == "tiempo_muerto" and not seg.en_tiempo_muerto:
            await self._emitir(
                camion_id=camion_id,
                codigo=codigo_camion,
                tipo="tiempo_muerto",
                severidad="warning",
                titulo=f"{codigo_camion}: tiempo muerto",
                mensaje="El camión lleva más de 5 minutos parado fuera de zonas operativas.",
                lat=lat,
                lng=lng,
                zona=None,
                ts=ahora,
            )
            seg.en_tiempo_muerto = True
        elif estado_actual != "tiempo_muerto":
            seg.en_tiempo_muerto = False

        # 4) Calidad GPS baja (edge: pasa de OK a baja)
        if calidad_gps is not None:
            es_baja = calidad_gps < UMBRAL_CALIDAD_GPS_MINIMA
            if es_baja and not seg.calidad_gps_anterior_baja:
                await self._emitir(
                    camion_id=camion_id,
                    codigo=codigo_camion,
                    tipo="calidad_gps_baja",
                    severidad="warning",
                    titulo=f"{codigo_camion}: señal GPS degradada",
                    mensaje=(
                        f"Calidad GPS = {calidad_gps} "
                        f"(mínimo esperado: {UMBRAL_CALIDAD_GPS_MINIMA})"
                    ),
                    lat=lat,
                    lng=lng,
                    zona=zona_actual,
                    contexto={"calidad_gps": calidad_gps},
                    ts=ahora,
                )
            seg.calidad_gps_anterior_baja = es_baja

        # 5) Temperatura motor alta
        if temperatura_motor is not None:
            es_alta = temperatura_motor > UMBRAL_TEMPERATURA_MAXIMA
            if es_alta and not seg.temperatura_anterior_alta:
                await self._emitir(
                    camion_id=camion_id,
                    codigo=codigo_camion,
                    tipo="temperatura_alta",
                    severidad="danger",
                    titulo=f"{codigo_camion}: temperatura motor {temperatura_motor}°C",
                    mensaje=f"Temperatura supera el umbral de {UMBRAL_TEMPERATURA_MAXIMA}°C.",
                    lat=lat,
                    lng=lng,
                    zona=zona_actual,
                    contexto={"temperatura": temperatura_motor},
                    ts=ahora,
                )
            seg.temperatura_anterior_alta = es_alta

        # 6) Salud vía baja
        if salud_via is not None:
            es_mala = salud_via < UMBRAL_SALUD_VIA_MINIMA
            if es_mala and not seg.salud_via_anterior_baja:
                await self._emitir(
                    camion_id=camion_id,
                    codigo=codigo_camion,
                    tipo="salud_via_baja",
                    severidad="warning",
                    titulo=f"{codigo_camion}: vía en mal estado ({salud_via}%)",
                    mensaje=f"Salud de vía por debajo del umbral ({UMBRAL_SALUD_VIA_MINIMA}%).",
                    lat=lat,
                    lng=lng,
                    zona=zona_actual,
                    contexto={"salud_via": salud_via},
                    ts=ahora,
                )
            seg.salud_via_anterior_baja = es_mala

        # 7) Tolva abierta fuera de zona de descarga
        if tolva_cerrada is not None:
            tolva_abierta = not tolva_cerrada
            zona_es_descarga = zona_actual in ZONAS_DESCARGA
            problema = tolva_abierta and not zona_es_descarga
            if problema and not seg.tolva_fuera_zona_anterior:
                await self._emitir(
                    camion_id=camion_id,
                    codigo=codigo_camion,
                    tipo="tolva_fuera_zona",
                    severidad="danger",
                    titulo=f"{codigo_camion}: tolva abierta fuera de zona de descarga",
                    mensaje=(
                        f"Tolva abierta en zona '{zona_actual or 'fuera de zona'}'. "
                        f"Solo permitido en: {', '.join(sorted(ZONAS_DESCARGA))}"
                    ),
                    lat=lat,
                    lng=lng,
                    zona=zona_actual,
                    contexto={"tolva_abierta": True, "zona_actual": zona_actual},
                    ts=ahora,
                )
            seg.tolva_fuera_zona_anterior = problema

    async def _emitir(
        self,
        camion_id: int,
        codigo: str,
        tipo: TipoAlerta,
        severidad: Severidad,
        titulo: str,
        mensaje: str | None,
        lat: float | None,
        lng: float | None,
        zona: str | None,
        ts: datetime,
        estado_anterior: str | None = None,
        estado_nuevo: str | None = None,
        contexto: dict | None = None,
    ) -> None:
        """Persiste la alerta en DB + broadcast vía WS."""
        logger.warning("🚨 ALERTA [{}/{}] {}", severidad.upper(), tipo, titulo)

        # Persistir
        try:
            await self.persistencia.insertar_alerta(
                {
                    "camion_id": camion_id,
                    "tipo": tipo,
                    "severidad": severidad,
                    "titulo": titulo,
                    "mensaje": mensaje,
                    "lat": lat,
                    "lng": lng,
                    "zona_nombre": zona,
                    "estado_anterior": estado_anterior,
                    "estado_nuevo": estado_nuevo,
                    "contexto": json.dumps(contexto) if contexto else None,
                    "timestamp": ts,
                }
            )
        except Exception as e:
            logger.error("Error persistiendo alerta: {}", e)

        # Broadcast WS
        await self.servidor.broadcast(
            {
                "tipo": "alerta",
                "alerta": {
                    "camion_id": camion_id,
                    "codigo": codigo,
                    "tipo": tipo,
                    "severidad": severidad,
                    "titulo": titulo,
                    "mensaje": mensaje,
                    "lat": lat,
                    "lng": lng,
                    "zona_nombre": zona,
                    "estado_anterior": estado_anterior,
                    "estado_nuevo": estado_nuevo,
                    "contexto": contexto,
                    "timestamp": ts.isoformat(),
                },
            }
        )
