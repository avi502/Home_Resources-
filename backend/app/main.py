import os
import sys

# Ensure project root is in sys.path for Vercel / serverless execution
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.init_db import init_database

# Routers
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.households import router as households_router
from backend.app.api.routes.resources import router as resources_router
from backend.app.api.routes.intelligence import router as intelligence_router
from backend.app.api.routes.simulation import router as simulation_router
from backend.app.api.routes.export import router as export_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: Initialize database tables and seed demo data."""
    logger.info(f"Starting {settings.APP_NAME} in [{settings.ENVIRONMENT}] mode...")
    init_database()
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Full-stack household resource intelligence and simulation platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS Configuration (Blueprint Section 7: Avoid hardcoded wildcards for authenticated production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler (Structured error format)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "data": None,
            "meta": {"model_version": "1.0"},
            "error": "An internal server error occurred. Telemetry details logged securely."
        }
    )


# Health Check (Blueprint Phase 1)
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "data": {
            "status": "healthy",
            "app_name": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0"
        },
        "meta": {"model_version": "1.0"},
        "error": None
    }


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(households_router, prefix=settings.API_V1_STR)
app.include_router(resources_router, prefix=settings.API_V1_STR)
app.include_router(intelligence_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(export_router, prefix=settings.API_V1_STR)

# Mount Frontend Static Directory & Page Routes
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

if os.path.isdir(frontend_dir):
    from fastapi.responses import FileResponse

    @app.get("/dashboard", include_in_schema=False)
    async def dashboard_page():
        return FileResponse(os.path.join(frontend_dir, "dashboard.html"))

    @app.get("/simulator", include_in_schema=False)
    async def simulator_page():
        return FileResponse(os.path.join(frontend_dir, "simulator.html"))

    @app.get("/settings", include_in_schema=False)
    async def settings_page():
        return FileResponse(os.path.join(frontend_dir, "settings.html"))

    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
