"""
API v1 router
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, blog, events, documents, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(blog.router, prefix="/blog", tags=["blog"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

