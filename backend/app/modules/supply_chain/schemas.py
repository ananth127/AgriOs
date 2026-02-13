from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class EventBase(BaseModel):
    location: str
    description: str
    status_update: str

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class BatchBase(BaseModel):
    product_name: str
    quantity: float
    unit: str
    current_location: str
    status: str

class BatchCreate(BatchBase):
    crop_cycle_id: Optional[int] = None

class Batch(BatchBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # events: List[Event] = []

    class Config:
        from_attributes = True
