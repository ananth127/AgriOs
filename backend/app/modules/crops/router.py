from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.core.ownership import verify_farm_ownership
from . import service, schemas

router = APIRouter()

@router.post("/", response_model=schemas.CropCycle)
def plant_crop(cycle: schemas.CropCycleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    verify_farm_ownership(db, cycle.farm_id, current_user.id)
    return service.create_crop_cycle(db, cycle)

@router.get("/farm/{farm_id}", response_model=List[schemas.CropCycle])
def get_farm_crops(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return []
    return service.get_crop_cycles(db, farm_id)

@router.put("/{cycle_id}", response_model=schemas.CropCycle)
def update_crop_cycle(cycle_id: int, cycle_update: schemas.CropCycleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_cycle = service.get_crop_cycle(db, cycle_id)
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    verify_farm_ownership(db, db_cycle.farm_id, current_user.id)
    updated = service.update_crop_cycle(db, cycle_id, cycle_update)
    return updated

@router.delete("/{cycle_id}", response_model=schemas.CropCycle)
def delete_crop_cycle(cycle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_cycle = service.get_crop_cycle(db, cycle_id)
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    verify_farm_ownership(db, db_cycle.farm_id, current_user.id)
    return service.delete_crop_cycle(db, cycle_id)
