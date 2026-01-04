from sqlalchemy.orm import Session
from . import models, schemas
from geoalchemy2.shape import to_shape

def get_farm(db: Session, farm_id: int):
    return db.query(models.FarmTable).filter(models.FarmTable.id == farm_id).first()

def get_farms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FarmTable).offset(skip).limit(limit).all()

def create_farm(db: Session, farm: schemas.FarmCreate):
    # Adapt Geometry for PostGIS if needed
    geometry_value = farm.geometry
    
    # Check if we need WKTElement (PostGIS)
    # We can check the geometry column type or just database URL
    from app.core.config import settings
    if "sqlite" not in settings.DATABASE_URL:
        from geoalchemy2.elements import WKTElement
        geometry_value = WKTElement(farm.geometry, srid=4326)
    
    db_farm = models.FarmTable(
        name=farm.name,
        owner_id=farm.owner_id,
        geometry=geometry_value,
        soil_profile=farm.soil_profile
    )
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm
