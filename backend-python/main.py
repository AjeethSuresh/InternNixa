from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from config import PORT, get_client
from routes import auth, session, certificate, enroll

app = FastAPI(title="INTERNIXA API", version="1.0.0")

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated certificates as static files
CERT_DIR = os.path.join(os.path.dirname(__file__), "certificates")
os.makedirs(CERT_DIR, exist_ok=True)

# Register routers
app.include_router(auth.router,        prefix="/api/auth",         tags=["Auth"])
app.include_router(session.router,     prefix="/api/session",      tags=["Session"])
app.include_router(certificate.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(enroll.router,      prefix="/api/enroll",       tags=["Enroll"])


@app.on_event("startup")
async def startup():
    try:
        client = get_client()
        await client.admin.command("ping")
        print("--------------------------------------------------")
        print("🚀 MongoDB Connection Success")
        print("--------------------------------------------------")
        print("=" * 50)
        print(f"🟢 Server initialized and listening on port {PORT}")
        print("=" * 50)
    except Exception as e:
        print(f"❌ MongoDB Connection Error: {e}")
        raise


@app.get("/")
async def root():
    return {"message": "INTERNIXA API is running ✅"}
