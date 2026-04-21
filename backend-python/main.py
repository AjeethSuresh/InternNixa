from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from typing import Optional, List
from datetime import datetime

from config import PORT, get_client, get_db
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

# --- Smart SPA Serving ---
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "static")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # 1. Skip API routes (let them 404 naturally if not found)
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API Route not found")

    # 2. Check if the path exists as a physical file in 'static'
    # (handles /assets/..., /favicon.ico, etc.)
    file_path = os.path.join(FRONTEND_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # 3. Otherwise, serve index.html for SPA routing (/, /dashboard, /session, etc.)
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    # 4. Fallback if frontend is missing
    return {"message": "INTERNIXA API is running ✅ (Frontend 'static' folder not found)"}



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
        print(f"🛰️ SIGNAL: Participant {user_id} joined meeting {meeting_id}")
        
        # We'll store the name once we get the 'hello' message
        user_name = "User"
        
        try:
            while True:
                data = await websocket.receive_json()
                
                if data.get("type") == "hello":
                    user_name = data.get("payload", {}).get("name", "User")
                    user_email = data.get("payload", {}).get("email", "")
                    user_role = data.get("payload", {}).get("role", "Participant")
                    db = get_db()
                    # Upsert session record by email (unique per person) — handles reconnects
                    if user_email:
                        await db["meeting_sessions"].update_one(
                            {"meetingId": meeting_id, "email": user_email},
                            {
                                "$set": {
                                    "userId": user_id,  # update to new userId on reconnect
                                    "name": user_name,
                                    "role": user_role,
                                    "email": user_email,
                                    "updatedAt": datetime.utcnow()
                                },
                                "$setOnInsert": {"joinTime": datetime.utcnow(), "leaveCount": 0, "meetingId": meeting_id}
                            },
                            upsert=True
                        )
                    # Notify others that someone joined with their NAME
                    await manager.broadcast({
                        "from": user_id,
                        "type": "user-joined",
                        "payload": {"userId": user_id, "name": user_name}
                    }, meeting_id, user_id)
                    continue

                if data.get("type") == "status-update":
                    payload = data.get("payload", {})
                    db = get_db()
                    
                    # Always match by email (unique per person) — prevents duplicate records on rejoin
                    email = payload.get("email", "")
                    query = {"meetingId": meeting_id, "email": email} if email else {"meetingId": meeting_id, "userId": user_id}

                    await db["meeting_sessions"].update_one(
                        query,
                        {
                            "$set": {
                                "userId": user_id,
                                "name": payload.get("name"),
                                "email": email,
                                "status": payload.get("status"),
                                "attentionScore": payload.get("attentionScore"),
                                "activeTime": payload.get("activeTime"),
                                "totalTime": payload.get("totalTime"),
                                "updatedAt": datetime.utcnow()
                            },
                            "$setOnInsert": {"joinTime": datetime.utcnow(), "leaveCount": 0, "meetingId": meeting_id}
                        },
                        upsert=True
                    )
                    # IMPORTANT: Continue to broadcast after saving so host sees it!
                
                target_id = data.get("to")
                if target_id and target_id in manager.active_connections.get(meeting_id, {}):
                    await manager.active_connections[meeting_id][target_id].send_json({
                        "from": user_id,
                        "type": data.get("type"),
                        "payload": data.get("payload")
                    })
                else:
                    await manager.broadcast({
                        "from": user_id,
                        "type": data.get("type"),
                        "payload": data.get("payload")
                    }, meeting_id, user_id)
        except WebSocketDisconnect:
            manager.disconnect(meeting_id, user_id)
            print(f"⚠️ SIGNAL: Participant {user_id} DISCONNECTED from meeting {meeting_id}")
            
            # Increment leave count — match by userId first, then fall back to name
            db = get_db()
            result = await db["meeting_sessions"].update_one(
                {"meetingId": meeting_id, "userId": user_id},
                {"$inc": {"leaveCount": 1}},
                upsert=False
            )
            # Fallback: if userId wasn't found (e.g. session was created by email before first status-update)
            if result.matched_count == 0 and user_name != "User":
                await db["meeting_sessions"].update_one(
                    {"meetingId": meeting_id, "name": user_name},
                    {"$inc": {"leaveCount": 1}},
                    upsert=False
                )
            
            await manager.broadcast({
                "from": user_id,
                "type": "user-left",
                "payload": {"userId": user_id, "name": user_name}
            }, meeting_id)
else:
    # On Vercel, we can't support WebSockets, so we provide an explanation endpoint
    @app.get("/ws/meet/{meeting_id}/{user_id}")
    async def websocket_unsupported():
        return {"error": "WebSockets are not supported in this serverless environment. Use local backend for Meet feature."}
