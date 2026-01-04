from pydantic import BaseModel
from typing import Dict, Any, Optional

class FarmBase(BaseModel):
    name: str
    owner_id: int
    geometry: str # Accepts WKT string for simplicity, e.g. "POLYGON((...))"
    soil_profile: Optional[Dict[str, Any]] = None

class FarmCreate(FarmBase):
    pass

class Farm(FarmBase):
    id: int

    class Config:
        from_attributes = True
