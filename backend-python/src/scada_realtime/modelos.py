"""Modelos pydantic para estado en memoria y mensajes WebSocket."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field

Estado = Literal[
    "en_ruta_vacio",
    "en_carguio",
    "en_ruta_cargado",
    "descargando",
    "detenido",
    "mantenimiento",
]


class EstadoCamionMemoria(BaseModel):
    """Estado en memoria de un camión durante la simulación."""

    id: int
    codigo: str
    capacidad_toneladas: float
    estado: Estado = "en_ruta_vacio"
    lat: float = 0.0
    lng: float = 0.0
    velocidad_kmh: float = 0.0
    rumbo_grados: float = 0.0
    carga_actual: float = 0.0
    combustible_pct: float = 100.0
    ruta_actual_nombre: str | None = None
    ruta_actual_idx: int | None = None  # idx en la lista global de rutas
    progreso_ruta: float = 0.0  # 0.0 → 1.0 a lo largo de la LineString
    direccion: Literal["adelante", "atras"] = "adelante"
    tiempo_en_estado_s: float = 0.0  # cuántos segundos virtuales lleva en estado actual


class MensajeActualizacion(BaseModel):
    tipo: Literal["actualizacion"] = "actualizacion"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    camion: dict


class MensajeCambioEstado(BaseModel):
    tipo: Literal["cambio_estado"] = "cambio_estado"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    camion_id: int
    codigo: str
    estado_anterior: Estado
    estado_nuevo: Estado
