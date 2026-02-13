from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from . import service, schemas
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

router = APIRouter()

def _fix_geometry(obj):
    """
    Helper to convert PostGIS WKBElement to WKT string for Pydantic serialization.
    Handles both Farm and Zone objects recursively.
    """
    # 1. Convert object's own geometry
    if hasattr(obj, "geometry") and hasattr(obj.geometry, "desc"):
         from geoalchemy2.shape import to_shape
         try:
             sh = to_shape(obj.geometry)
             obj.geometry = sh.wkt
         except:
             pass
    
    # 2. Convert zones if they exist (for Farm objects)
    if hasattr(obj, "zones") and obj.zones:
        for z in obj.zones:
            # Recursive call would be cleaner but 1 level deep is enough for now
            if hasattr(z, "geometry") and hasattr(z.geometry, "desc"):
                 from geoalchemy2.shape import to_shape
                 try:
                     sh = to_shape(z.geometry)
                     z.geometry = sh.wkt
                 except:
                     pass

@router.post("/", response_model=schemas.Farm)
def create_farm(farm: schemas.FarmCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Auto-assign to current user
    farm.owner_id = current_user.id
    db_farm = service.create_farm(db=db, farm=farm)
    _fix_geometry(db_farm)
    return db_farm

@router.get("/", response_model=List[schemas.Farm])
def read_farms(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farms = service.get_farms(db, skip=skip, limit=limit, owner_id=current_user.id)
    for farm in farms:
        _fix_geometry(farm)
    return farms

@router.get("/{farm_id}", response_model=schemas.Farm)
def read_farm(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_farm = service.get_farm(db, farm_id=farm_id)
    if db_farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    # Strict Ownership Check
    if db_farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found") # Hide existence
    _fix_geometry(db_farm)
    return db_farm

@router.put("/{farm_id}", response_model=schemas.Farm)
def update_farm(farm_id: int, farm_update: schemas.FarmUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check ownership first
    db_farm = service.get_farm(db, farm_id=farm_id)
    if not db_farm or db_farm.owner_id != current_user.id:
         raise HTTPException(status_code=404, detail="Farm not found")
         
    db_farm = service.update_farm(db, farm_id=farm_id, farm_update=farm_update)
    _fix_geometry(db_farm)
    return db_farm

@router.delete("/{farm_id}", response_model=schemas.Farm)
def delete_farm(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check ownership first
    db_farm = service.get_farm(db, farm_id=farm_id)
    if not db_farm or db_farm.owner_id != current_user.id:
         raise HTTPException(status_code=404, detail="Farm not found")

    db_farm = service.delete_farm(db, farm_id=farm_id)
    # _fix_geometry(db_farm) - not strictly needed if we don't return zones, but schemas.Farm might include them? 
    # Yes, schemas.Farm includes zones.
    _fix_geometry(db_farm)
    return db_farm

@router.put("/zones/{zone_id}", response_model=schemas.Zone)
def update_zone(zone_id: int, zone_update: schemas.ZoneUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from .models import ZoneTable, FarmTable
    zone = db.query(ZoneTable).filter(ZoneTable.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    farm = db.query(FarmTable).filter(FarmTable.id == zone.farm_id).first()
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Zone not found")
    db_zone = service.update_zone(db, zone_id=zone_id, zone_update=zone_update)
    _fix_geometry(db_zone)
    return db_zone

@router.post("/detect-boundaries", response_model=schemas.BoundaryResponse)
def detect_boundaries_endpoint(req: schemas.BoundaryRequest, current_user: User = Depends(get_current_user)):
    """
    AI-powered land boundary detection.
    Simulates finding field boundaries around likely coordinates.
    """
    from .ai_service import detect_boundaries
    geojson_result = detect_boundaries(req.lat, req.lng, req.zoom)
    return {"geojson": geojson_result}

@router.post("/{farm_id}/zones", response_model=schemas.Zone)
def create_farm_zone(farm_id: int, zone: schemas.ZoneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Create a new zone for a farm.
    """
    try:
        # Check ownership
        db_farm = service.get_farm(db, farm_id)
        if not db_farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        if db_farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Import service
        from .zone_service import create_zone
        db_zone = create_zone(db, farm_id, zone)
        
        # Convert Geometry
        _fix_geometry(db_zone)
        
        return db_zone
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.delete("/zones/{zone_id}", response_model=schemas.Zone)
def delete_zone(zone_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from .models import ZoneTable, FarmTable
    # Verify ownership
    zone = db.query(ZoneTable).filter(ZoneTable.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    farm = db.query(FarmTable).filter(FarmTable.id == zone.farm_id).first()
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from .zone_service import delete_zone
    deleted_zone = delete_zone(db, zone_id)
    _fix_geometry(deleted_zone)
    return deleted_zone
