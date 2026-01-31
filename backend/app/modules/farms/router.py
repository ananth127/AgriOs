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
    db_farm = service.create_farm(db=db, farm=farm)
    # Convert Geometry to WKT for Pydantic response if needed (PostGIS returns WKBElement)
    if hasattr(db_farm, "geometry") and hasattr(db_farm.geometry, "desc"):
         from geoalchemy2.shape import to_shape
         try:
             sh = to_shape(db_farm.geometry)
             db_farm.geometry = sh.wkt
         except:
             pass
    return db_farm

from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

@router.get("/", response_model=List[schemas.Farm])
def read_farms(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farms = service.get_farms(db, skip=skip, limit=limit, owner_id=current_user.id)
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

@router.put("/{farm_id}", response_model=schemas.Farm)
def update_farm(farm_id: int, farm_update: schemas.FarmUpdate, db: Session = Depends(get_db)):
    db_farm = service.update_farm(db, farm_id=farm_id, farm_update=farm_update)
    if db_farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    # Geometry handling for response
    if hasattr(db_farm.geometry, "desc"):
         from geoalchemy2.shape import to_shape
         try:
             sh = to_shape(db_farm.geometry)
             db_farm.geometry = sh.wkt
         except:
             pass
    return db_farm

@router.delete("/{farm_id}", response_model=schemas.Farm)
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    db_farm = service.delete_farm(db, farm_id=farm_id)
    if db_farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    return db_farm

@router.put("/zones/{zone_id}", response_model=schemas.Zone)
def update_zone(zone_id: int, zone_update: schemas.ZoneUpdate, db: Session = Depends(get_db)):
    db_zone = service.update_zone(db, zone_id=zone_id, zone_update=zone_update)
    if db_zone is None:
        raise HTTPException(status_code=404, detail="Zone not found")
    return db_zone
