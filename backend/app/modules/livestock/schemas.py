from pydantic import BaseModel
import datetime
from typing import Optional, List

class AnimalBase(BaseModel):
    registry_id: int
    farm_id: int
    tag_id: str
    date_of_birth: datetime.date
    weight_kg: float
    health_status: str = "Healthy"

class AnimalCreate(BaseModel):
    farm_id: int
    tag_id: str
    species: str
    breed: str
    birth_date: datetime.date
    weight_kg: float
    health_status: str = "Healthy"
    last_vaccination_date: Optional[datetime.date] = None
    name: Optional[str] = None
    gender: str = "Female"
    purpose: str = "Dairy"
    origin: str = "BORN"
    source_details: Optional[str] = None
    parent_id: Optional[int] = None
    housing_id: Optional[int] = None

class AnimalUpdate(BaseModel):
    tag_id: Optional[str] = None
    weight_kg: Optional[float] = None
    health_status: Optional[str] = None
    last_vaccination_date: Optional[datetime.date] = None
    name: Optional[str] = None
    purpose: Optional[str] = None
    daily_production_average: Optional[float] = None # Calculated field
    housing_id: Optional[int] = None

class ProductionCreate(BaseModel):
    date: datetime.date
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
    last_vaccination_date: Optional[datetime.date]
    name: Optional[str] = None
    gender: Optional[str] = None
    purpose: Optional[str] = None
    origin: Optional[str] = None
    source_details: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    qr_code: Optional[str] = None
    qr_created_at: Optional[datetime.datetime] = None
    housing_id: Optional[int] = None

    class Config:
        from_attributes = True

class HealthLogBase(BaseModel):
    event_type: str
    description: Optional[str] = None
    cost: float = 0.0
    next_due_date: Optional[datetime.date] = None
    date: datetime.date = datetime.date.today() # Clashing avoided

class HealthLogCreate(HealthLogBase):
    pass

class HealthLog(HealthLogBase):
    id: int
    animal_id: int

    class Config:
        from_attributes = True

# --- Housing Schemas ---

class HousingBase(BaseModel):
    name: str 
    type: str # Barn, Stable, etc.
    capacity: int 
    auto_cleaning_enabled: bool = False
    cleaning_schedule: Optional[str] = None

class HousingCreate(HousingBase):
    farm_id: int

class Housing(HousingBase):
    id: int
    current_occupancy: int
    
    class Config:
        from_attributes = True

# --- Feeding Plans ---

class FeedPlanCreate(BaseModel):
    housing_id: Optional[int] = None
    animal_id: Optional[int] = None
    feed_item_name: str
    quantity_per_day: float
    schedule_times: Optional[List[str]] = []
    auto_feeder_enabled: bool = False
    auto_water_enabled: bool = False

class FeedPlan(BaseModel):
    id: int
    housing_id: Optional[int] = None
    animal_id: Optional[int] = None
    feed_item_name: Optional[str] = None
    quantity_per_day: Optional[float] = None
    schedule_times: Optional[List[str]] = None
    auto_feeder_enabled: bool = False
    auto_water_enabled: bool = False
    
    class Config:
        from_attributes = True

# --- Joined Models ---

class AnimalDetail(Animal):
    housing: Optional[Housing] = None
    feed_plans: List[FeedPlan] = []
    health_logs: List[HealthLog] = []

# --- Smart Monitoring Schemas ---

class MonitoringDeviceCreate(BaseModel):
    housing_id: int
    name: str
    device_type: str # "CAMERA", "SENSOR_HUB", "FEEDER_CONTROLLER", "LIGHT_CONTROLLER"
    stream_url: Optional[str] = None
    api_endpoint: Optional[str] = None
    settings: Optional[dict] = {}

class MonitoringDevice(MonitoringDeviceCreate):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    device_id: int
    alert_type: str
    severity: str
    message: str
    data_value: Optional[float] = None
    snapshot_url: Optional[str] = None

class Alert(AlertCreate):
    id: int
    timestamp: datetime.datetime
    resolved: bool
    resolved_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class TelemetryCreate(BaseModel):
    device_id: int
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    co2_level: Optional[float] = None
    ammonia_level: Optional[float] = None
    noise_level_db: Optional[float] = None
    luminosity: Optional[float] = None

class Telemetry(TelemetryCreate):
    id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True
