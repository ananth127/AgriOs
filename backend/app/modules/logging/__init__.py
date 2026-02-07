"""
Logging Module __init__.py

Registers logging routes with FastAPI
"""

from .routers import router

__all__ = ["router"]
