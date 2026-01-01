from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging

from app.core.config import settings
from app.models import HealthCheck
from app.routers import (
    datasources_router,
    insights_router,
    chat_router,
    integrations_router,
)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    yield
    logger.info(f"Shutting down {settings.app_name}")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    Tuple API - Data Intelligence Platform
    
    Connect to your data sources, analyze with AI, and get actionable insights
    delivered to Slack and Microsoft Teams.
    
    ## Features
    
    - **Data Source Connectivity**: PostgreSQL, MySQL, MongoDB, CSV, REST APIs, and more
    - **AI-Powered Analysis**: Natural language queries and intelligent insights
    - **Team Integrations**: Slack and Microsoft Teams notifications
    - **Schema Intelligence**: Automatic schema detection and documentation
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(datasources_router, prefix="/api/v1")
app.include_router(insights_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(integrations_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthCheck(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.utcnow(),
    )


@app.get("/api/v1", tags=["API"])
async def api_info():
    """API version information."""
    return {
        "version": "v1",
        "endpoints": {
            "datasources": "/api/v1/datasources",
            "insights": "/api/v1/insights",
            "chat": "/api/v1/chat",
            "integrations": "/api/v1/integrations",
        },
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
