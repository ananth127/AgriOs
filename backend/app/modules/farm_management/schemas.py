from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import date, datetime

# --- Loans ---
class FarmLoanBase(BaseModel):
    purpose: str
    amount: float
    interest_rate: float
    duration_months: int
    start_date: date
    linked_crop_cycle_id: Optional[int] = None

class FarmLoanCreate(FarmLoanBase):
    farm_id: int

class FarmLoan(FarmLoanBase):
    id: int
    farm_id: int
    outstanding_balance: float
    repayment_schedule: Optional[Any] = None
    class Config:
        from_attributes = True

# --- Inventory ---
class FarmInventoryBase(BaseModel):
    item_type: str
    name: str
    quantity: float
    unit: str
    purchase_date: date
    expiry_date: Optional[date] = None
    cost_per_unit: float

class FarmInventoryCreate(FarmInventoryBase):
    farm_id: int

class FarmInventory(FarmInventoryBase):
    id: int
    farm_id: int
    class Config:
        from_attributes = True

# --- Assets (Machinery) ---
class FarmAssetBase(BaseModel):
    name: str # John Deere 5310
    asset_type: str # Tractor
    purchase_date: date
    cost: float
    status: str = "Active"
    is_iot_enabled: bool = False

class FarmAssetCreate(FarmAssetBase):
    farm_id: int
    config: Optional[Dict[str, Any]] = {}
    iot_device_id: Optional[str] = None

class FarmAsset(FarmAssetBase):
    id: int
    farm_id: int
    iot_device_id: Optional[str] = None
    iot_settings: Optional[Dict[str, Any]] = {}
    class Config:
        from_attributes = True

class FarmAssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    purchase_date: Optional[date] = None
    cost: Optional[float] = None
    status: Optional[str] = None
    is_iot_enabled: Optional[bool] = None
    iot_device_id: Optional[str] = None

# --- Activities ---
class FarmActivityCreate(BaseModel):
    crop_cycle_id: Optional[int] = None
    activity_type: str
    activity_date: Optional[datetime] = None
    description: Optional[str] = None
    item_used_id: Optional[int] = None
    quantity_used: Optional[float] = None
    asset_used_id: Optional[int] = None
    duration_hours: Optional[float] = None
    acres_covered: Optional[float] = None
    cost: Optional[float] = 0.0

class FarmActivity(FarmActivityCreate):
    id: int
    farm_id: int
    class Config:
        from_attributes = True

# --- Labor ---
class LaborJobCreate(BaseModel):
    title: str
    description: Optional[str] = None
    required_count: int
    start_date: date
    duration_days: int
    wage_per_day: float
    provides_food: bool = False
    provides_travel: bool = False
    farm_id: int

class LaborJob(LaborJobCreate):
    id: int
    farm_id: int
    status: str
    filled_count: int = 0
    class Config:
        from_attributes = True
