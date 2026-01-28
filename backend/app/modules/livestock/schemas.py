from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class AnimalBase(BaseModel):
    registry_id: int
    farm_id: int
    tag_id: str
    date_of_birth: date
    weight_kg: float
    health_status: str = "Healthy"

class AnimalCreate(BaseModel):
    farm_id: int
    tag_id: str
    species: str
    breed: str
    birth_date: date
    weight_kg: float
    health_status: str = "Healthy"
    last_vaccination_date: Optional[date] = None
    name: Optional[str] = None
    gender: str = "Female"
    purpose: str = "Dairy"
    origin: str = "BORN"
    source_details: Optional[str] = None
    parent_id: Optional[int] = None

class AnimalUpdate(BaseModel):
    tag_id: Optional[str] = None
    weight_kg: Optional[float] = None
    health_status: Optional[str] = None
    last_vaccination_date: Optional[date] = None
    name: Optional[str] = None
    purpose: Optional[str] = None
    daily_production_average: Optional[float] = None # Calculated field

class ProductionCreate(BaseModel):
    date: date
    product_type: str
    quantity: float
    unit: str

class Production(ProductionCreate):
    id: int
    animal_id: int
    class Config:
        from_attributes = True

class Animal(AnimalBase):
    id: int
    last_vaccination_date: Optional[date]
    name: Optional[str] = None
    gender: Optional[str] = None
    purpose: Optional[str] = None
    origin: Optional[str] = None
    source_details: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    qr_code: Optional[str] = None
    qr_created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
