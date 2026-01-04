from fastapi import APIRouter, Depends
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
