"""Carga rutas y zonas del GeoJSON."""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel
from shapely.geometry import LineString, Polygon


class Ruta(BaseModel):
    nombre: str
    origen: str
    destino: str
    color: str
    coordenadas: list[tuple[float, float]]  # [(lng, lat), ...]

    @property
    def linestring(self) -> LineString:
        return LineString(self.coordenadas)


class Zona(BaseModel):
    nombre: str
    color: str
    coordenadas: list[list[tuple[float, float]]]  # ring of (lng, lat)

    @property
    def polygon(self) -> Polygon:
        return Polygon(self.coordenadas[0])


def cargar_geojson(ruta_archivo: Path) -> tuple[list[Ruta], list[Zona]]:
    """Lee el archivo GeoJSON y devuelve rutas + zonas estructuradas."""
    if not ruta_archivo.is_absolute():
        ruta_archivo = Path(__file__).parent.parent.parent / ruta_archivo

    with ruta_archivo.open(encoding="utf-8") as f:
        data = json.load(f)

    rutas: list[Ruta] = []
    zonas: list[Zona] = []

    for feature in data["features"]:
        props = feature["properties"]
        cat = props.get("categoria")
        geom = feature["geometry"]
        if cat == "ruta" and geom["type"] == "LineString":
            rutas.append(
                Ruta(
                    nombre=props["nombre"],
                    origen=props.get("origen", ""),
                    destino=props.get("destino", ""),
                    color=props.get("color", "#000000"),
                    coordenadas=[(c[0], c[1]) for c in geom["coordinates"]],
                )
            )
        elif cat == "zona" and geom["type"] == "Polygon":
            zonas.append(
                Zona(
                    nombre=props["nombre"],
                    color=props.get("color", "#000000"),
                    coordenadas=geom["coordinates"],
                )
            )

    return rutas, zonas
