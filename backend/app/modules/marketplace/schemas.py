from pydantic import BaseModel
from typing import List, Optional
from datetime import date

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
    product_name: str
    category: str
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
    description: Optional[str]
    image_url: Optional[str]
    unit_price: float

    class Config:
        from_attributes = True
