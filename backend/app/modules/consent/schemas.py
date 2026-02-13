from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ConsentPolicyCreate(BaseModel):
    version: str
    content_text: str
    is_required: bool = True

class ConsentPolicyOut(BaseModel):
    id: int
    version: str
    content_text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserConsentCreate(BaseModel):
    policy_id: int
    is_accepted: bool
    device_id: Optional[str] = None
    ip_address: Optional[str] = None

class UserConsentOut(BaseModel):
    id: int
    user_id: int
    policy_id: int
    is_accepted: bool
    timestamp: datetime
    
    class Config:
        from_attributes = True
