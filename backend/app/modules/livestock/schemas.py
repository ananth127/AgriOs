from pydantic import BaseModel
from datetime import date
from typing import Optional

class AnimalBase(BaseModel):
    registry_id: int
    farm_id: int
    tag_id: str
    date_of_birth: date
    weight_kg: float
    health_status: str = "Healthy"

class AnimalCreate(AnimalBase):
    pass

class AnimalUpdate(BaseModel):
    registry_id: Optional[int] = None
    farm_id: Optional[int] = None
    tag_id: Optional[str] = None
    date_of_birth: Optional[date] = None
    weight_kg: Optional[float] = None
    health_status: Optional[str] = None
    last_vaccination_date: Optional[date] = None

class Animal(AnimalBase):
    id: int
    last_vaccination_date: Optional[date]

    class Config:
        from_attributes = True
