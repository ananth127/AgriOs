"""
Shared ownership verification utilities for Agri-OS.
Used across all modules to enforce multi-user data isolation.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.modules.farms.models import FarmTable


def verify_farm_ownership(db: Session, farm_id: int, user_id: int, raise_error: bool = True):
    """
    Verify that the given user owns the given farm.
    Returns the farm object if valid, None otherwise.
    If raise_error=True (default), raises 404/403 on failure.
    If raise_error=False, silently returns None (for read-only fallback).
    """
    farm = db.query(FarmTable).filter(FarmTable.id == farm_id).first()
    if not farm:
        if raise_error:
            raise HTTPException(status_code=404, detail="Farm not found")
        return None
    if farm.owner_id != user_id:
        if raise_error:
            raise HTTPException(status_code=403, detail="Not authorized to access this farm")
        return None
    return farm


def require_admin(current_user, raise_error: bool = True):
    """Check if the current user has admin role."""
    if getattr(current_user, 'role', None) != "admin":
        if raise_error:
            raise HTTPException(status_code=403, detail="Admin access required")
        return False
    return True
