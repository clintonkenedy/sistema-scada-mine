# scada-mine-realtime

Servicio de tiempo real para Sistema SCADA Mine. Por ahora **simula 10 camiones** moviéndose sobre rutas del GeoJSON `data/rutas-mina.geojson`. En el futuro será reemplazado por la integración con sensores físicos reales.

## Setup

```bash
uv sync
cp .env.example .env  # editá si necesitás cambiar puerto/credenciales
```

## Run

```bash
uv run python -m scada_realtime.main
```

## Endpoints

- **WebSocket:** `ws://localhost:8765/eventos` — emite eventos de camiones cada N segundos (N = `SIMULATOR_TICK_SECONDS`)
- Escribe en Postgres `scada_minev1` (tablas `posiciones_camion` y `eventos_camion`)

## Aceleración

El simulador respeta el env var `SIMULATOR_SPEED_MULTIPLIER`. Por defecto 1.0 (tiempo real). El frontend puede mandar un mensaje WebSocket `{"tipo": "set_speed", "multiplier": 10.0}` para acelerar en runtime.

## Stack

- `websockets` — servidor WS asyncio
- `psycopg[binary,pool]` — Postgres async con pool
- `pydantic-settings` — config desde env
- `shapely` — interpolación geométrica sobre LineString
- `loguru` — logs estructurados
- `uvloop` — event loop performante (Unix)
