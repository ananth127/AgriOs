from pydantic import BaseModel
from typing import Dict, Any, Optional, List

class FarmBase(BaseModel):
    name: str
    owner_id: int
    geometry: str # Accepts WKT string for simplicity, e.g. "POLYGON((...))"
    soil_profile: Optional[Dict[str, Any]] = None

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    owner_id: Optional[int] = None
    geometry: Optional[str] = None
    soil_profile: Optional[Dict[str, Any]] = None

class ZoneBase(BaseModel):
    name: str
    land_id: Optional[str] = None
    geometry: Optional[str] = None # WKT
    details: Optional[Dict[str, Any]] = {}

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    crop_details: Optional[Dict[str, Any]] = None

class Zone(ZoneBase):
    id: int
    farm_id: int

    class Config:
        from_attributes = True

class Farm(FarmBase):
    id: int
    zones: List[Zone] = []
    
    class Config:
        from_attributes = True

# AI Service Models
class BoundaryRequest(BaseModel):
    lat: float
    lng: float
    zoom: float

class BoundaryResponse(BaseModel):
    geojson: Dict[str, Any]
