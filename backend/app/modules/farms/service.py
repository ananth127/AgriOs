from sqlalchemy.orm import Session
from . import models, schemas
from geoalchemy2.shape import to_shape

def get_farm(db: Session, farm_id: int):
    return db.query(models.FarmTable).filter(models.FarmTable.id == farm_id).first()

def get_farms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FarmTable).offset(skip).limit(limit).all()

def create_farm(db: Session, farm: schemas.FarmCreate):
    # If using SQLite, we store the raw WKT string.
    # If using PostGIS, GeoAlchemy handles WKT->Geometry automatically usually,
    # but strictly checking types helps.
    
    db_farm = models.FarmTable(
        name=farm.name,
        owner_id=farm.owner_id,
        geometry=farm.geometry, # Pass WKT directly
        soil_profile=farm.soil_profile
    )
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm
