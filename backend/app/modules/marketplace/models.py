from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
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
