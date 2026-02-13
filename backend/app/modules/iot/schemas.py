from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

# --- Device Schemas ---
class IoTDeviceBase(BaseModel):
    name: str
    hardware_id: str
    phone_number: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    # secret_key is not passed by user, generated server-side or passed only on creation if pre-provisioned

class IoTDeviceCreate(IoTDeviceBase):
    config: Optional[Dict[str, Any]] = {}
    asset_type: Optional[str] = "Device"
    parent_device_id: Optional[int] = None

class IoTDeviceUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    config: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    parent_device_id: Optional[int] = None
    # Can also manually reset stats if needed, but usually handled by system

class IoTDeviceResponse(IoTDeviceBase):
    id: int
    user_id: int
    is_online: bool
    status: Optional[str] = "IDLE"
    last_telemetry: Optional[Dict[str, Any]] = {}
    last_heartbeat: Optional[datetime]
    config: Dict[str, Any]
    asset_type: str = "Device"
    created_at: datetime
    
    # Stats
    parent_device_id: Optional[int]
    last_active_at: Optional[datetime]
    total_runtime_minutes: float
    current_run_start_time: Optional[datetime]
    target_turn_off_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# --- Command Schemas ---
class IoTCommandBase(BaseModel):
    command: str
    payload: Dict[str, Any] = {}

class IoTCommandCreate(IoTCommandBase):
    payload: Optional[Dict[str, Any]] = {}

class IoTCommandResponse(IoTCommandBase):
    id: int
    device_id: int
    user_id: Optional[int]
    status: str
    source: str
    transport_used: Optional[str]
    executed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# --- SMS Webhook Schema ---
class SMSWebhookInput(BaseModel):
    From: str
    Body: str
