"""
Model Registry API Router
Endpoints for edge model management and OTA updates.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from .model_registry import (
    ModelRegistryService, 
    ModelInfo, 
    ModelUpdateCheck, 
    ModelUpdateResponse
)
from typing import List


router = APIRouter(prefix="/models", tags=["Edge Models"])


@router.get("/latest", response_model=ModelInfo)
async def get_latest_model(
    model_name: str = "disease_detector",
    model_type: str = "tfjs",
    db: Session = Depends(get_db)
):
    """Get the latest active model for edge deployment"""
    service = ModelRegistryService(db)
    model = service.get_latest_model(model_name, model_type)
    
    if not model:
        # Seed default model if none exists
        model = service.seed_default_model()
    
    return model


@router.post("/check-update", response_model=ModelUpdateResponse)
async def check_for_model_update(
    request: ModelUpdateCheck,
    db: Session = Depends(get_db)
):
    """Check if a newer model version is available for download"""
    service = ModelRegistryService(db)
    return service.check_for_update(request)


@router.get("/all", response_model=List[ModelInfo])
async def get_all_models(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all registered edge models"""
    service = ModelRegistryService(db)
    return service.get_all_models(active_only)


@router.get("/treatment/{disease_name}")
async def get_treatment_recommendation(
    disease_name: str,
    db: Session = Depends(get_db)
):
    """Get treatment recommendations for a detected disease"""
    service = ModelRegistryService(db)
    treatment = service.get_treatment_for_disease(disease_name)
    
    return {
        "disease": disease_name,
        "treatment": treatment
    }


@router.post("/download-log")
async def log_model_download(
    model_id: int,
    device_type: str = "web",
    app_version: str = None,
    db: Session = Depends(get_db)
):
    """Log a model download for analytics"""
    service = ModelRegistryService(db)
    service.log_download(model_id, device_type=device_type, app_version=app_version)
    return {"status": "logged"}
