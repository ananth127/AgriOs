from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Date, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.db_compat import get_geo_column
import enum

class ListingType(str, enum.Enum):
    SELL = "SELL"
    BUY = "BUY"
    RENT = "RENT"

class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # Link to User
    business_name = Column(String, index=True)
    description = Column(String)
    phone_number = Column(String)
    
    # Store Location (Point)
    location = Column(get_geo_column('POINT', srid=4326))
    
    listings = relationship("ServiceListing", back_populates="provider")

class ServiceListing(Base):
    __tablename__ = "service_listings"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id"))
    title = Column(String, index=True)
    category = Column(String, index=True) # e.g., "Drone Spraying", "Harvester Rental"
    price = Column(Float)
    price_unit = Column(String) # "per_acre", "per_hour"
    is_active = Column(Boolean, default=True)

    provider = relationship("ServiceProvider", back_populates="listings")

class ProductListing(Base):
    __tablename__ = "product_listings"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, index=True) # User ID (Farmer/Seller/Buyer)
    
    listing_type = Column(String, default="SELL", index=True) # SELL, BUY, RENT
    product_name = Column(String, index=True)
    category = Column(String, index=True) # Crop, Seeds, Fruit, Veg, Livestock, Machinery, etc.
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    
    quantity = Column(Float)
    unit = Column(String) # tons, kg, numbers
    
    price = Column(Float)
    price_unit = Column(String) # per_kg, per_ton, per_head
    
    available_date = Column(Date, nullable=True) # For future harvest selling
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    location = Column(get_geo_column('POINT', srid=4326), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CommercialProduct(Base):
    __tablename__ = "commercial_products"

    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String, index=True)      # e.g., "Dithane M-45"
    manufacturer = Column(String, index=True)    # e.g., "UPL"
    active_ingredient_id = Column(Integer, index=True) # Following KGPest/KGChemical structure
    active_ingredient_name = Column(String, index=True) # e.g., "Mancozeb" 
    
    category = Column(String, index=True) # Pesticide, Fertilizer, Seeds
    description = Column(String)
    image_url = Column(String, nullable=True)
    unit_price = Column(Float) # MSRP
    
class Order(Base):
    __tablename__ = "marketplace_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, index=True)
    listing_id = Column(Integer, ForeignKey("product_listings.id"))
    
    quantity = Column(Float)
    total_price = Column(Float)
    status = Column(String, default="PENDING") # PENDING, CONFIRMED, COMPLETED, CANCELLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())


