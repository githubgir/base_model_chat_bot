"""
FastAPI application entry point for the Chat Bot App.

This module sets up the FastAPI application with all necessary middleware,
routes, and configuration for the dynamic Pydantic UI generator.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from typing import Dict, Any

from core.config import settings
from api.endpoints import router as api_router


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    
    Args:
        app: FastAPI application instance
    """
    # Startup
    logger.info("Starting Chat Bot App backend...")
    yield
    # Shutdown
    logger.info("Shutting down Chat Bot App backend...")


# Create FastAPI application
app = FastAPI(
    title="Chat Bot App API",
    description="Dynamic Pydantic UI generator with OpenAI integration",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root() -> Dict[str, Any]:
    """
    Root endpoint for health check.
    
    Returns:
        Dict containing API status and version information.
    """
    return {
        "message": "Chat Bot App API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint.
    
    Returns:
        Dict containing health status.
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )