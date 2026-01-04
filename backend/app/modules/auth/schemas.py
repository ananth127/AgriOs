from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: str = "farmer"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    phone_number: Optional[str] = None

# Properties to receive via API on update
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None

# Properties to return via API
class User(UserBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Login Request
class LoginRequest(BaseModel):
    email: str
    password: str
