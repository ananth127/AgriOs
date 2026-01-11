from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

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

class ProductListingBase(BaseModel):
    listing_type: str = "SELL" # SELL, BUY, RENT
    product_name: str
    category: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    
    quantity: float
    unit: str
    price: float
    price_unit: str
    available_date: Optional[date] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ProductListingCreate(ProductListingBase):
    pass

class ProductListing(ProductListingBase):
    id: int
    seller_id: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    listing_id: int
    quantity: float

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    buyer_id: int
    total_price: float
    status: str
    created_at: datetime
    
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

class CommercialProductDTO(BaseModel):
    id: int
    brand_name: str
    manufacturer: str
    active_ingredient_name: str
    category: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    unit_price: float

    class Config:
        from_attributes = True
