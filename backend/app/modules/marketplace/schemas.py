from pydantic import BaseModel
from typing import List, Optional

class ListingBase(BaseModel):
    title: str
    category: str
    price: float
    price_unit: str

class ListingCreate(ListingBase):
    pass

class Listing(ListingBase):
    id: int
    provider_id: int
    is_active: bool

    class Config:
        from_attributes = True

class ProviderBase(BaseModel):
    business_name: str
    description: Optional[str] = None
    phone_number: str
    latitude: float
    longitude: float

class ProviderCreate(ProviderBase):
    pass

class Provider(ProviderBase):
    id: int
    listings: List[Listing] = []

    class Config:
        from_attributes = True
