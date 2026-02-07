from sqlalchemy.orm import Session
from . import models, schemas
from app.core.config import settings
import random

def create_zone(db: Session, farm_id: int, zone: schemas.ZoneCreate):
    # Geometry handling
    geometry_value = zone.geometry
    
    # Simple check for SQLite vs PostGIS based on connection string
    # This logic matches create_farm in service.py
    if "sqlite" not in settings.DATABASE_URL:
        try:
            from geoalchemy2.elements import WKTElement
            if isinstance(geometry_value, str):
                geometry_value = WKTElement(geometry_value, srid=4326)
        except ImportError:
             pass # GeoAlchemy not installed or other issue

    # Generate random Land ID if not provided
    if not zone.land_id:
        zone.land_id = f"L-{random.randint(10000, 99999)}"

    db_zone = models.ZoneTable(
        farm_id=farm_id,
        name=zone.name,
        land_id=zone.land_id,
        geometry=geometry_value,
        details=zone.details
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

def delete_zone(db: Session, zone_id: int):
    zone = db.query(models.ZoneTable).filter(models.ZoneTable.id == zone_id).first()
    if zone:
        db.delete(zone)
        db.commit()
    return zone
