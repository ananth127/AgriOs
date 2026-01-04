from fastapi import APIRouter, Depends, HTTPException, status
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

@router.post("/", response_model=schemas.Farm)
def create_farm(farm: schemas.FarmCreate, db: Session = Depends(get_db)):
    return service.create_farm(db=db, farm=farm)

@router.get("/", response_model=List[schemas.Farm])
def read_farms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    farms = service.get_farms(db, skip=skip, limit=limit)
    # If GeoAlchemy Element, convert to WKT for Pydantic
    # If String (SQLite), it's already WKT
    for farm in farms:
        if hasattr(farm.geometry, "desc"): # Check if it's a WKBElement
             # This requires to_shape and then .wkt
             from geoalchemy2.shape import to_shape
             try:
                 sh = to_shape(farm.geometry)
                 farm.geometry = sh.wkt
             except:
                 pass
    return farms

@router.get("/{farm_id}", response_model=schemas.Farm)
def read_farm(farm_id: int, db: Session = Depends(get_db)):
    db_farm = service.get_farm(db, farm_id=farm_id)
    if db_farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    return db_farm
