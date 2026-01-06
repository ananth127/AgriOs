from pydantic import BaseModel
from datetime import date
from typing import Optional

class CropCycleBase(BaseModel):
    farm_id: int
    registry_id: int
    sowing_date: date
    # estimated harvest can be auto-calculated

class CropCycleCreate(CropCycleBase):
    pass

class CropCycleUpdate(BaseModel):
    farm_id: Optional[int] = None
    registry_id: Optional[int] = None
    sowing_date: Optional[date] = None
    harvest_date_estimated: Optional[date] = None
    current_stage: Optional[str] = None
    health_score: Optional[float] = None

class CropCycle(CropCycleBase):
    id: int
    current_stage: str
    health_score: float
    harvest_date_estimated: Optional[date]

    class Config:
        from_attributes = True
