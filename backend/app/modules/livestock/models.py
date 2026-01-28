from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Animal(Base):
    __tablename__ = "livestock"

    id = Column(Integer, primary_key=True, index=True)
    registry_id = Column(Integer, ForeignKey("registry.id")) 
    tag_id = Column(String, unique=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    
    date_of_birth = Column(Date)
    health_status = Column(String) # "Healthy", "Sick", "Critical"
    weight_kg = Column(Float)
    last_vaccination_date = Column(Date, nullable=True)
    
    # Extended Fields
    name = Column(String, nullable=True)
    gender = Column(String, default="Female") # "Male", "Female"
    purpose = Column(String, default="Dairy") # "Dairy", "Meat", "Breeding", "Sale", "Work"
    origin = Column(String, default="BORN") # "BORN", "PURCHASED"
    source_details = Column(String, nullable=True) # JSON String: Seller Name, Mobile, etc.
    parent_id = Column(Integer, ForeignKey("livestock.id"), nullable=True)
    
    # QR Code
    qr_code = Column(String, unique=True, nullable=True)
    qr_created_at = Column(DateTime, default=datetime.utcnow)

    production_logs = relationship("LivestockProduction", back_populates="animal")

class LivestockProduction(Base):
    __tablename__ = "livestock_production"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("livestock.id"))
    date = Column(Date)
    product_type = Column(String) # "Milk", "Eggs", "Wool"
    quantity = Column(Float)
    unit = Column(String) # "Liters", "Kg", "Count"

    animal = relationship("Animal", back_populates="production_logs")
