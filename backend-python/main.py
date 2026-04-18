from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from typing import Optional, List

from config import PORT, get_client
from routes import auth, session, certificate, enroll, chatbot, courses, meet

app = FastAPI(title="INTERNIXA API", version="1.0.0")

# CORS — allow Vite dev server and Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated certificates as static files
CERT_DIR = os.path.join(os.path.dirname(__file__), "certificates")
os.makedirs(CERT_DIR, exist_ok=True)

# Serve course videos as static files
VIDEO_DIR = os.path.join(os.path.dirname(__file__), "videos")
os.makedirs(VIDEO_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")

# Register routers
app.include_router(auth.router,        prefix="/api/auth",         tags=["Auth"])
app.include_router(session.router,     prefix="/api/session",      tags=["Session"])
app.include_router(certificate.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(enroll.router,      prefix="/api/enroll",       tags=["Enroll"])
app.include_router(chatbot.router,     prefix="/api/chatbot",      tags=["Chatbot"])
app.include_router(courses.router,     prefix="/api/courses",      tags=["Courses"])
app.include_router(meet.router,        prefix="/api/meet",         tags=["Meet"])

# --- Serve Frontend Static Files ---
# This directory will exist after the Docker build process copies the 'dist' folder
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    # Fallback for local development if 'static' folder isn't built yet
    @app.get("/")
    async def root():
        return {"message": "INTERNIXA API is running ✅ (Frontend 'static' folder not found)"}

# --- SPA Catch-all Route ---
# This must be at the very end. It serves index.html for any request that doesn't match
# an API route or a static file, allowing React Router to handle the URL.
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Only serve index.html if the 'static' folder exists
    if os.path.exists(FRONTEND_DIR):
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    # Otherwise, return a 404 for the API or a message
    if full_path.startswith("api/"):
        return {"error": "API route not found"}
    return {"message": "Frontend static files not found"}


@app.on_event("startup")
async def startup():
    try:
        client = get_client()
        await client.admin.command("ping")
        print("--------------------------------------------------")
        print("SUCCESS: MongoDB Connection Success")
        print("--------------------------------------------------")
        print("=" * 50)
        print(f"INFO: Server initialized and listening on port {PORT}")
        print("=" * 50)
    except Exception as e:
        print(f"ERROR: MongoDB Connection Error: {e}")
        raise


# Root endpoint removed to avoid conflict with StaticFiles mounting at "/"

# --- WebSocket Signaling for INTERNIXA MEET (Local Only) ---
if not os.environ.get("VERCEL"):
    from fastapi import WebSocket, WebSocketDisconnect

    class ConnectionManager:
        def __init__(self):
            self.active_connections: dict = {} # meeting_id -> { userId: websocket }

        async def connect(self, websocket: WebSocket, meeting_id: str, user_id: str):
            await websocket.accept()
            if meeting_id not in self.active_connections:
                self.active_connections[meeting_id] = {}
            self.active_connections[meeting_id][user_id] = websocket

        def disconnect(self, meeting_id: str, user_id: str):
            if meeting_id in self.active_connections:
                if user_id in self.active_connections[meeting_id]:
                    del self.active_connections[meeting_id][user_id]
                if not self.active_connections[meeting_id]:
                    del self.active_connections[meeting_id]

        async def broadcast(self, message: dict, meeting_id: str, sender_id: Optional[str] = None):
            if meeting_id in self.active_connections:
                for user_id, connection in self.active_connections[meeting_id].items():
                    if sender_id is None or user_id != sender_id:
                        await connection.send_json(message)

    manager = ConnectionManager()

    @app.websocket("/ws/meet/{meeting_id}/{user_id}")
    async def websocket_meet(websocket: WebSocket, meeting_id: str, user_id: str):
        await manager.connect(websocket, meeting_id, user_id)
        # Notify others that someone joined
        await manager.broadcast({
            "from": user_id,
            "type": "user-joined",
            "payload": {"userId": user_id}
        }, meeting_id, user_id)

        try:
            while True:
                data = await websocket.receive_json()
                target_id = data.get("to")
                if target_id and target_id in manager.active_connections.get(meeting_id, {}):
                    await manager.active_connections[meeting_id][target_id].send_json({
                        "from": user_id,
                        "type": data.get("type"),
                        "payload": data.get("payload")
                    })
                else:
                    # If no target, broadcast
                    await manager.broadcast({
                        "from": user_id,
                        "type": data.get("type"),
                        "payload": data.get("payload")
                    }, meeting_id, user_id)
        except WebSocketDisconnect:
            manager.disconnect(meeting_id, user_id)
            await manager.broadcast({
                "from": user_id,
                "type": "user-left",
                "payload": {"userId": user_id}
            }, meeting_id)
else:
    # On Vercel, we can't support WebSockets, so we provide an explanation endpoint
    @app.get("/ws/meet/{meeting_id}/{user_id}")
    async def websocket_unsupported():
        return {"error": "WebSockets are not supported in this serverless environment. Use local backend for Meet feature."}
