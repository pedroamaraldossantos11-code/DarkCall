"""
DarkCall — Backend Server
Real-time rooms with WebSocket signaling.
"""

import asyncio
import json
import os
import sys
import signal
import webbrowser
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="DarkCall")

# ── Room management ──────────────────────────────────────────

rooms: dict[str, dict[str, WebSocket]] = {}
room_users: dict[str, dict[str, dict]] = {}
chat_history: dict[str, list[dict]] = {}


def get_static_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "static"
    return Path(__file__).parent / "static"


async def broadcast(room_code: str, message: dict, exclude: str | None = None):
    payload = json.dumps(message)
    stale = []
    for uid, ws in rooms.get(room_code, {}).items():
        if uid == exclude:
            continue
        try:
            await ws.send_text(payload)
        except Exception:
            stale.append(uid)
    for uid in stale:
        rooms.get(room_code, {}).pop(uid, None)


# ── WebSocket endpoint ─────────────────────────────────────
# Each connection tracks which room it belongs to.
# Client sends {"type":"join_room","room":"1234"} to enter.

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    uid = str(id(websocket))
    room_code = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type")

            # ── Join / switch room ──
            if msg_type == "join_room":
                new_room = str(data.get("room", "")).strip()

                if room_code and room_code != new_room:
                    rooms.get(room_code, {}).pop(uid, None)
                    room_users.get(room_code, {}).pop(uid, None)
                    remaining = list(rooms.get(room_code, {}).keys())
                    if remaining:
                        await broadcast(room_code, {
                            "type": "participant_left",
                            "uid": uid,
                            "count": len(remaining),
                        })

                room_code = new_room

                if room_code not in rooms:
                    rooms[room_code] = {}
                    room_users[room_code] = {}

                rooms[room_code][uid] = websocket
                room_users[room_code][uid] = {
                    "name": data.get("name", "Participante"),
                    "avatar": data.get("avatar", ""),
                }

                participants = list(rooms[room_code].keys())

                await broadcast(room_code, {
                    "type": "participant_joined",
                    "uid": uid,
                    "name": room_users[room_code][uid]["name"],
                    "avatar": room_users[room_code][uid]["avatar"],
                    "count": len(participants),
                }, exclude=uid)

                # tell the client its own uid (for deterministic negotiation)
                await websocket.send_text(json.dumps({
                    "type": "joined",
                    "uid": uid,
                }))

                # send existing users list so the new client knows who's here
                existing = [
                    {"uid": u, "name": info["name"], "avatar": info["avatar"]}
                    for u, info in room_users[room_code].items()
                    if u != uid
                ]
                if existing:
                    await websocket.send_text(json.dumps({
                        "type": "room_users",
                        "users": existing,
                        "count": len(participants),
                    }))

                # send existing chat history
                history = chat_history.get(room_code, [])
                if history:
                    await websocket.send_text(json.dumps({
                        "type": "chat_history",
                        "messages": history[-50:],
                    }))

            elif room_code is None:
                continue

            elif msg_type == "chat_message":
                entry = {
                    "name": data.get("name", "Anon"),
                    "text": data.get("text", ""),
                }
                chat_history.setdefault(room_code, []).append(entry)
                chat_history[room_code] = chat_history[room_code][-200:]
                await broadcast(room_code, {
                    "type": "chat_message",
                    **entry,
                })

            elif msg_type == "user_update":
                if room_code in room_users and uid in room_users[room_code]:
                    room_users[room_code][uid]["name"] = data.get("name", room_users[room_code][uid]["name"])
                    room_users[room_code][uid]["avatar"] = data.get("avatar", room_users[room_code][uid]["avatar"])
                    await broadcast(room_code, {
                        "type": "user_update",
                        "uid": uid,
                        "name": room_users[room_code][uid]["name"],
                        "avatar": room_users[room_code][uid]["avatar"],
                    }, exclude=uid)

            elif msg_type in ("offer", "answer", "ice-candidate"):
                target = data.get("target")
                if target and target in rooms.get(room_code, {}):
                    data["sender"] = uid
                    try:
                        await rooms[room_code][target].send_text(
                            json.dumps(data)
                        )
                    except Exception:
                        pass

            elif msg_type == "signal":
                await broadcast(room_code, data, exclude=uid)

            elif msg_type == "screen_share":
                await broadcast(room_code, {
                    "type": "screen_share",
                    "uid": uid,
                    "name": room_users.get(room_code, {}).get(uid, {}).get("name", "Participante"),
                    "sharing": data.get("sharing", False),
                }, exclude=uid)

            elif msg_type == "leave_room":
                await broadcast(room_code, {
                    "type": "participant_left",
                    "uid": uid,
                    "count": max(0, len(rooms.get(room_code, {})) - 1),
                })
                rooms.get(room_code, {}).pop(uid, None)
                room_users.get(room_code, {}).pop(uid, None)
                room_code = None

    except WebSocketDisconnect:
        pass
    finally:
        if room_code:
            rooms.get(room_code, {}).pop(uid, None)
            room_users.get(room_code, {}).pop(uid, None)
            remaining = list(rooms.get(room_code, {}).keys())

            await broadcast(room_code, {
                "type": "participant_left",
                "uid": uid,
                "count": len(remaining),
            })

            if not remaining:
                rooms.pop(room_code, None)
                room_users.pop(room_code, None)
                chat_history.pop(room_code, None)


# ── Serve static files ───────────────────────────────────────

static_dir = get_static_dir()


@app.get("/")
async def index():
    return FileResponse(static_dir / "index.html")


@app.get("/join/{room_code}")
async def join_page(room_code: str):
    return FileResponse(static_dir / "index.html")


app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ── Entry point ──────────────────────────────────────────────

PORT = 8765


def start():
    import uvicorn

    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level="info",
        access_log=False,
    )
    server = uvicorn.Server(config)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def _open_browser():
        webbrowser.open(f"http://localhost:{PORT}")

    loop.call_later(1.5, _open_browser)

    def _shutdown(sig, frame):
        raise SystemExit

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    print(f"\n  DarkCall running at http://localhost:{PORT}\n")
    try:
        server.run()
    except SystemExit:
        pass


if __name__ == "__main__":
    start()
