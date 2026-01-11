from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from . import models
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

# --- Schemas ---
class ChemicalDTO(BaseModel):
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

class PestDTO(BaseModel):
    id: int
    name: str
    symptoms: Optional[str]
    chemicals: List[ChemicalDTO] = []

    class Config:
        from_attributes = True

class CropDTO(BaseModel):
    id: int
    name: str
    pests: List[PestDTO] = []

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/pests", response_model=List[PestDTO])
def get_all_pests(
    search: Optional[str] = None, 
    db: Session = Depends(database.get_db)
):
    """
    Get a searchable list of all pests/diseases in the Knowledge Bank.
    """
    # Auto-seed if empty
    from .service import KnowledgeGraphService
    svc = KnowledgeGraphService(db)
    svc.seed_initial_data()
    
    query = db.query(models.KGPest)
    if search:
        query = query.filter(models.KGPest.name.ilike(f"%{search}%"))
    return query.all()

@router.get("/crops", response_model=List[CropDTO])
def get_all_crops(
    db: Session = Depends(database.get_db)
):
    """
    Get all crops and their associated pests.
    """
    # Auto-seed if empty
    from .service import KnowledgeGraphService
    svc = KnowledgeGraphService(db)
    svc.seed_initial_data()
    
    return db.query(models.KGCrop).all()

@router.get("/pests/{pest_id}", response_model=PestDTO)
def get_pest_details(
    pest_id: int, 
    db: Session = Depends(database.get_db)
):
    """
    Get detailed info about a specific pest, including treatments.
    """
    pest = db.query(models.KGPest).filter(models.KGPest.id == pest_id).first()
    if not pest:
        raise HTTPException(status_code=404, detail="Pest not found")
    return pest
