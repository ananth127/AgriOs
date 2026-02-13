from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime

# --- Device Schemas ---
class IoTDeviceBase(BaseModel):
    name: str
    hardware_id: str
    phone_number: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    secret_key: Optional[str] = None  # Needed for creation, hidden in read usually

class IoTDeviceCreate(IoTDeviceBase):
    config: Optional[Dict[str, Any]] = {}

class IoTDeviceUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    is_online: Optional[bool] = None
    last_heartbeat: Optional[datetime] = None
    config: Optional[Dict[str, Any]] = None

class IoTDeviceResponse(IoTDeviceBase):
    id: int
    user_id: int
    is_online: bool
    last_heartbeat: Optional[datetime]
    config: Dict[str, Any]
    created_at: datetime
    
    # Hide secret_key in response for security, unless explicitly needed (handled in service)
    class Config:
        from_attributes = True


# --- Command Schemas ---
class IoTCommandBase(BaseModel):
    command: str
    payload: Dict[str, Any] = {}

class IoTCommandCreate(IoTCommandBase):
    device_id: int

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
