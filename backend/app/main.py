"""
FastAPI application entry point.
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import patients, vapi


# ── Lifespan: create tables on startup ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Patient Registration API",
    description="Voice AI–powered patient registration system",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────
app.include_router(patients.router)
app.include_router(vapi.router)


# ── Global exception handler → envelope ──────────────────────────────
@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    """Return validation errors in the standard envelope format."""
    return JSONResponse(
        status_code=422,
        content={
            "data": None,
            "error": str(exc.detail) if hasattr(exc, "detail") else str(exc),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": f"Internal server error: {str(exc)}"},
    )


# ── Serve frontend static files ─────────────────────────────────────
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(str(FRONTEND_DIR / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Catch-all for SPA client-side routing."""
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
