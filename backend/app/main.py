"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.api import api_router
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PaceUp API",
    description="API for PaceUp running community platform",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (uploads)
# Ensure directory exists
os.makedirs("public/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="public/uploads"), name="uploads")

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "PaceUp API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
