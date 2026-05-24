import asyncio
import json
import serial
import serial.tools.list_ports
import webbrowser
import websockets
from pathlib import Path

BAUDRATE        = 115200
WS_PORT         = 8765
INTERVALO_PULSO = 0.5

ESP32_VIDS = {
    0x10C4: "CP210x",
    0x1A86: "CH340",
    0x0403: "FTDI",
    0x303A: "ESP32-S3/S2",
}

clients:     set                  = set()
serial_port: serial.Serial | None = None
pulse_task:  asyncio.Task  | None = None


def detectar_puerto():
    for p in serial.tools.list_ports.comports():
        if p.vid in ESP32_VIDS:
            return p.device, f"{p.description} [{ESP32_VIDS[p.vid]}]"
    return None, None


async def broadcast(msg: dict):
    if not clients:
        return
    data = json.dumps(msg, ensure_ascii=False)
    await asyncio.gather(*[c.send(data) for c in list(clients)], return_exceptions=True)


async def tarea_leer_serial():
    global serial_port
    loop = asyncio.get_event_loop()
    while True:
        if serial_port is None or not serial_port.is_open:
            await asyncio.sleep(0.3)
            continue
        try:
            raw  = await loop.run_in_executor(None, serial_port.readline)
            line = raw.decode("utf-8", errors="replace").strip()
            if line:
                await broadcast({"type": "line", "data": line})
        except serial.SerialException:
            puerto = serial_port.port if serial_port else "?"
            serial_port = None
            await broadcast({"type": "status", "connected": False, "msg": f"Conexión perdida con {puerto}"})
        except Exception:
            await asyncio.sleep(0.1)


async def tarea_pulso():
    while True:
        if serial_port and serial_port.is_open:
            try:
                serial_port.write(b"1")
            except serial.SerialException:
                pass
        await asyncio.sleep(INTERVALO_PULSO)


async def handler(websocket):
    global serial_port, pulse_task
    clients.add(websocket)

    if serial_port and serial_port.is_open:
        await websocket.send(json.dumps({"type": "status", "connected": True, "msg": f"ESP32 en {serial_port.port}"}))
    else:
        await websocket.send(json.dumps({"type": "status", "connected": False, "msg": "ESP32 no encontrado"}))

    try:
        async for raw in websocket:
            cmd = json.loads(raw).get("cmd", "")

            if cmd == "start_pulse":
                if pulse_task is None or pulse_task.done():
                    pulse_task = asyncio.create_task(tarea_pulso())
                await broadcast({"type": "pulse", "active": True})

            elif cmd == "stop_pulse":
                if pulse_task and not pulse_task.done():
                    pulse_task.cancel()
                    pulse_task = None
                await broadcast({"type": "pulse", "active": False})

            elif cmd == "reconnect":
                if pulse_task and not pulse_task.done():
                    pulse_task.cancel()
                    pulse_task = None
                if serial_port and serial_port.is_open:
                    serial_port.close()
                serial_port = None
                puerto, desc = detectar_puerto()
                if puerto:
                    try:
                        serial_port = serial.Serial(puerto, BAUDRATE, timeout=0.1)
                        await broadcast({"type": "status", "connected": True, "msg": f"ESP32 en {puerto} — {desc}"})
                    except serial.SerialException as e:
                        await broadcast({"type": "status", "connected": False, "msg": str(e)})
                else:
                    await broadcast({"type": "status", "connected": False, "msg": "ESP32 no encontrado"})
    finally:
        clients.discard(websocket)


async def main():
    global serial_port
    puerto, desc = detectar_puerto()
    if puerto:
        try:
            serial_port = serial.Serial(puerto, BAUDRATE, timeout=0.1)
            print(f"[Serial] {puerto} — {desc}")
        except serial.SerialException as e:
            print(f"[Serial] Error: {e}")
    else:
        print("[Serial] ESP32 no encontrado")

    webbrowser.open((Path(__file__).parent / "index.html").resolve().as_uri())
    print(f"[WS] ws://localhost:{WS_PORT}  |  Ctrl+C para detener")

    async with websockets.serve(handler, "localhost", WS_PORT):
        await asyncio.gather(tarea_leer_serial(), asyncio.Future())


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDetenido.")
