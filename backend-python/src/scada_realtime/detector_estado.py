"""Deteccion de estado de camiones basada en geocercas (polygon containment).

Este modulo recibe (camion_id, lat, lng, velocidad_kmh, segundos_desde_ultimo_tick)
y devuelve el estado inferido segun:
- ¿Esta dentro de una zona operativa?
- ¿Cuanto tiempo lleva en esa zona con velocidad baja?
- ¿Salio recientemente de una zona?
- ¿Esta parado afuera de zonas operativas por mucho tiempo?

La idea es que cuando lleguen sensores GPS reales, esta logica funcione
igual: solo recibe coordenadas + velocidad, no necesita que el sensor
"sepa" el estado.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from loguru import logger
from shapely.geometry import Point

from scada_realtime.configuracion_dinamica import ConfiguracionDinamica
from scada_realtime.geojson_loader import Zona
from scada_realtime.modelos import Estado

# Mapeo de zona → tipo de accion
ZONA_A_ACCION: dict[str, Literal["carguio", "descarga", "parqueo"]] = {
    "Zaranda": "carguio",
    "Botadero": "descarga",
    "Coronación": "descarga",
    "Chute": "descarga",
    "Corte": "descarga",
    "Cierre Progresivo": "descarga",
    "Estacionamiento": "parqueo",
}

# Estado asignado al SALIR de cada tipo de zona
ESTADO_SALIDA: dict[str, Estado] = {
    "carguio": "en_ruta_cargado",
    "descarga": "en_ruta_vacio",
    "parqueo": "en_ruta_vacio",
}

# Estado asignado al cumplirse las condiciones DENTRO de cada tipo
ESTADO_DENTRO: dict[str, Estado] = {
    "carguio": "en_carguio",
    "descarga": "descargando",
    "parqueo": "mantenimiento",
}


@dataclass
class EstadoSeguimiento:
    """Estado interno por camion para detectar transiciones."""

    estado_actual: Estado = "en_ruta_vacio"
    zona_actual: str | None = None
    zona_actual_accion: str | None = None
    segundos_en_zona_quieto: float = 0.0
    segundos_quieto_afuera: float = 0.0
    ultima_zona_visitada_accion: str | None = None


class DetectorEstado:
    def __init__(self, zonas: list[Zona], config: ConfiguracionDinamica) -> None:
        self.zonas_operativas: list[tuple[str, str, Zona]] = []
        for z in zonas:
            accion = ZONA_A_ACCION.get(z.nombre)
            if accion:
                self.zonas_operativas.append((z.nombre, accion, z))
                logger.info("Geocerca registrada: {} → {}", z.nombre, accion)
        self.config = config
        self._estados: dict[int, EstadoSeguimiento] = {}

    def _zona_que_contiene(self, lat: float, lng: float) -> tuple[str, str] | None:
        punto = Point(lng, lat)
        for nombre, accion, zona in self.zonas_operativas:
            if zona.polygon.contains(punto):
                return nombre, accion
        return None

    def zona_actual(self, lat: float, lng: float) -> str | None:
        """Devuelve el nombre de la zona operativa que contiene el punto, o None."""
        z = self._zona_que_contiene(lat, lng)
        return z[0] if z else None

    def detectar(
        self,
        camion_id: int,
        lat: float,
        lng: float,
        velocidad_kmh: float,
        segundos_desde_ultimo_tick: float,
    ) -> Estado:
        """Recibe la posicion + velocidad de un camion y devuelve el estado inferido."""
        if camion_id not in self._estados:
            self._estados[camion_id] = EstadoSeguimiento()
        seg = self._estados[camion_id]

        zona_dentro = self._zona_que_contiene(lat, lng)
        esta_quieto = velocidad_kmh < self.config.velocidad_parado_kmh

        if zona_dentro is not None:
            nombre_zona, accion = zona_dentro

            # Si cambia de zona, resetear contador
            if seg.zona_actual != nombre_zona:
                seg.zona_actual = nombre_zona
                seg.zona_actual_accion = accion
                seg.segundos_en_zona_quieto = 0.0

            # Acumular tiempo quieto SOLO si esta quieto
            if esta_quieto:
                seg.segundos_en_zona_quieto += segundos_desde_ultimo_tick
            else:
                seg.segundos_en_zona_quieto = 0.0

            # Si supera el umbral, asignar estado DENTRO
            if seg.segundos_en_zona_quieto >= self.config.tiempo_minimo_zona_segundos:
                seg.estado_actual = ESTADO_DENTRO[accion]
                seg.ultima_zona_visitada_accion = accion

            seg.segundos_quieto_afuera = 0.0
        else:
            # Salio de cualquier zona operativa
            if seg.zona_actual is not None:
                accion_anterior = seg.zona_actual_accion
                if accion_anterior in ESTADO_SALIDA:
                    seg.estado_actual = ESTADO_SALIDA[accion_anterior]
                    seg.ultima_zona_visitada_accion = accion_anterior
                seg.zona_actual = None
                seg.zona_actual_accion = None
                seg.segundos_en_zona_quieto = 0.0

            # Detectar tiempo muerto: quieto afuera por mucho rato
            if esta_quieto:
                seg.segundos_quieto_afuera += segundos_desde_ultimo_tick
            else:
                seg.segundos_quieto_afuera = 0.0

            umbral_tiempo_muerto_s = self.config.tiempo_muerto_minutos * 60
            if seg.segundos_quieto_afuera >= umbral_tiempo_muerto_s:
                seg.estado_actual = "tiempo_muerto"
            elif seg.estado_actual == "tiempo_muerto" and not esta_quieto:
                # Salio del tiempo muerto: vuelve a ruta segun ultima zona visitada
                if seg.ultima_zona_visitada_accion == "carguio":
                    seg.estado_actual = "en_ruta_cargado"
                else:
                    seg.estado_actual = "en_ruta_vacio"

        return seg.estado_actual

    def estado_actual(self, camion_id: int) -> Estado:
        return self._estados.get(camion_id, EstadoSeguimiento()).estado_actual
