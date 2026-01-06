from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core import database
from . import service, schemas

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.CropCycle)
def plant_crop(cycle: schemas.CropCycleCreate, db: Session = Depends(get_db)):
    return service.create_crop_cycle(db, cycle)

@router.get("/farm/{farm_id}", response_model=List[schemas.CropCycle])
def get_farm_crops(farm_id: int, db: Session = Depends(get_db)):
    return service.get_crop_cycles(db, farm_id)

@router.put("/{cycle_id}", response_model=schemas.CropCycle)
def update_crop_cycle(cycle_id: int, cycle_update: schemas.CropCycleUpdate, db: Session = Depends(get_db)):
    db_cycle = service.update_crop_cycle(db, cycle_id, cycle_update)
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    return db_cycle

@router.delete("/{cycle_id}", response_model=schemas.CropCycle)
def delete_crop_cycle(cycle_id: int, db: Session = Depends(get_db)):
    db_cycle = service.delete_crop_cycle(db, cycle_id)
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Crop cycle not found")
    return db_cycle
