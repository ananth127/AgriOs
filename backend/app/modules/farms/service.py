from sqlalchemy.orm import Session
from . import models, schemas
from geoalchemy2.shape import to_shape
from app.core.config import settings

def _ensure_default_zones(db: Session, farm: models.FarmTable):
    if farm.zones:
        return
    
    import random
    default_zones = [
        {"name": "Zone 1 (North-East)", "details": {"crop": "Wheat", "status": "Irrigation in 2 days", "color": "green"}},
        {"name": "Zone 2 (South-East)", "details": {"crop": "Corn", "status": "Ready for harvest", "color": "yellow"}},
        {"name": "Zone 3 (South-West)", "details": {"crop": "Rice", "status": "Pest risk low", "color": "green"}},
        {"name": "Zone 4 (North-West)", "details": {"crop": "Fallow", "status": "Resting phase", "color": "orange"}},
    ]
    
    for z in default_zones:
        land_id = f"L-{random.randint(1000, 9999)}"
        zone = models.ZoneTable(
            farm_id=farm.id,
            name=z["name"],
            land_id=land_id,
            details=z["details"],
        )
        db.add(zone)
    
    db.commit()
    db.refresh(farm)

def get_farm(db: Session, farm_id: int):
    farm = db.query(models.FarmTable).filter(models.FarmTable.id == farm_id).first()
    if farm:
        _ensure_default_zones(db, farm)
    return farm

def _ensure_farm_naming(db: Session, farms: list, start_index: int = 1):
    """
    Self-healing: Ensure farms are named 'Land-1 - Location', 'Land-2 - Location' etc.
    based on creation order.
    """
    if not farms:
        return

    # Sort by ID to ensure stable ordering (oldest first)
    farms.sort(key=lambda f: f.id)
    
    dirty = False
    import re
    
    for i, farm in enumerate(farms, start_index):
        prefix = f"Land-{i}"
        current_name = farm.name or "Unknown Location"
        
        # Check if currently strictly follows the pattern for THIS index
        # Pattern: "Land-{i} - ..."
        expected_start = f"{prefix} -"
        
        if not current_name.startswith(expected_start):
            # If it has a different Land number (e.g. Land-5 but should be Land-1), strip it
            # Or if it has no prefix
            
            # Remove any existing "Land-X -" prefix (case insensitive land)
            # Handle "Land-1", "Land 1", "Land1" etc.
            cleaned_name = re.sub(r"^(Land|land)\s*-?\s*\d+\s*[-:]?\s*", "", current_name, flags=re.IGNORECASE)
            
            if not cleaned_name:
                cleaned_name = "Farm"
                
            new_name = f"{prefix} - {cleaned_name}"
            
            # Update only if different
            if farm.name != new_name:
                farm.name = new_name
                db.add(farm)
                dirty = True
            
    if dirty:
        db.commit()
        for f in farms:
            db.refresh(f)

def get_farms(db: Session, skip: int = 0, limit: int = 100, owner_id: int = None):
    query = db.query(models.FarmTable)
    if owner_id:
        query = query.filter(models.FarmTable.owner_id == owner_id)
    farms = query.offset(skip).limit(limit).all()
    
    # Self-healing: ensure zones exist
    for farm in farms:
        _ensure_default_zones(db, farm)
        
    # Self-healing: ensure naming convention
    if owner_id and farms: # Only rename if fetching for a specific user to maintain sequence
        _ensure_farm_naming(db, farms, start_index=skip + 1)
        
    return farms

def create_farm(db: Session, farm: schemas.FarmCreate):
    try:
        # Adapt Geometry for PostGIS if needed
        geometry_value = farm.geometry
        
        # Check if we need WKTElement (PostGIS)
        # We can check the geometry column type or just database URL
        if "sqlite" not in settings.DATABASE_URL:
            try:
                from geoalchemy2.elements import WKTElement
                # Ensure it is a string before converting
                if isinstance(geometry_value, str):
                    geometry_value = WKTElement(geometry_value, srid=4326)
            except ImportError:
                print("Warning: geoalchemy2 not found, proceeding with raw geometry")
        
        db_farm = models.FarmTable(
            name=farm.name,
            owner_id=farm.owner_id,
            geometry=geometry_value,
            soil_profile=farm.soil_profile
        )
        db.add(db_farm)
        db.commit()
        db.refresh(db_farm)

        # Create Default Zones using helper
        try:
            _ensure_default_zones(db, db_farm)
        except Exception as e:
            print(f"Failed to create default zones: {e}")
            # Continue, returning the farm at least
        
        return db_farm
    except Exception as e:
        print(f"CRITICAL ERROR in create_farm: {e}")
        db.rollback()
        raise e

def update_farm(db: Session, farm_id: int, farm_update: schemas.FarmUpdate):
    db_farm = get_farm(db, farm_id)
    if not db_farm:
        return None
    
    update_data = farm_update.model_dump(exclude_unset=True)
    
    if "geometry" in update_data:
        geometry_val = update_data["geometry"]
        if "sqlite" not in settings.DATABASE_URL:
            from geoalchemy2.elements import WKTElement
            if isinstance(geometry_val, str):
                geometry_val = WKTElement(geometry_val, srid=4326)
        update_data["geometry"] = geometry_val

    for key, value in update_data.items():
        setattr(db_farm, key, value)

    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm

def delete_farm(db: Session, farm_id: int):
    db_farm = get_farm(db, farm_id)
    if not db_farm:
        return None
    
    db.delete(db_farm)
    db.commit()
    return db_farm

def get_zone(db: Session, zone_id: int):
    return db.query(models.ZoneTable).filter(models.ZoneTable.id == zone_id).first()

def update_zone(db: Session, zone_id: int, zone_update: schemas.ZoneUpdate):
    db_zone = get_zone(db, zone_id)
    if not db_zone:
        return None
    
    update_data = zone_update.model_dump(exclude_unset=True)
    
    # Special handling for details dict (merge instead of overwrite if desired, but replace is standard)
    if "crop_details" in update_data:
        # Map crop_details from schema to 'details' in model
        db_zone.details = update_data["crop_details"]
        del update_data["crop_details"]

    for key, value in update_data.items():
        setattr(db_zone, key, value)

    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone
