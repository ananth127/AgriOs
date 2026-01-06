from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.db_compat import get_geo_column

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
    seller_id = Column(Integer, index=True) # User ID (Farmer)
    
    product_name = Column(String, index=True)
    category = Column(String) # Crop, Livestock, Seeds
    
    quantity = Column(Float)
    unit = Column(String) # tons, kg, numbers
    
    price = Column(Float)
    price_unit = Column(String) # per_kg, per_ton, per_head
    
    available_date = Column(Date, nullable=True) # For future harvest selling
    is_active = Column(Boolean, default=True)
    
    location = Column(get_geo_column('POINT', srid=4326), nullable=True)

