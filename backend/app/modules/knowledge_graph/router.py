from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.core.ownership import require_admin
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

@router.post("/regulatory/sync")
def sync_regulatory_data(db: Session = Depends(database.get_db), current_user: User = Depends(get_current_user)):
    """
    Force sync with CIBRC regulatory data (Mocked). Admin only.
    """
    require_admin(current_user)
    from .regulatory import RegulatoryIngestionService
    svc = RegulatoryIngestionService(db)
    return svc.sync_banned_chemicals()

@router.get("/regulatory/check-compliance")
def check_compliance(chemical_name: str, db: Session = Depends(database.get_db)):
    """
    Check if a chemical is banned or approved.
    """
    from .regulatory import RegulatoryIngestionService
    svc = RegulatoryIngestionService(db)
    return svc.check_compliance(chemical_name)
