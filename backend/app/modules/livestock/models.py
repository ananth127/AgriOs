from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean, JSON
from datetime import datetime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Animal(Base):
    __tablename__ = "livestock"

    id = Column(Integer, primary_key=True, index=True)
    registry_id = Column(Integer, ForeignKey("registry.id"), nullable=True) 
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
    
    # Housing and Location
    housing_id = Column(Integer, ForeignKey("livestock_housing.id"), nullable=True)

    # QR Code
    qr_code = Column(String, unique=True, nullable=True)
    qr_created_at = Column(DateTime, default=datetime.utcnow)

    production_logs = relationship("LivestockProduction", back_populates="animal")
    housing = relationship("LivestockHousing", back_populates="animals")
    feeding_plans = relationship("LivestockFeedPlan", back_populates="animal")
    health_logs = relationship("LivestockHealthLog", back_populates="animal")

class LivestockProduction(Base):
    __tablename__ = "livestock_production"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("livestock.id"))
    date = Column(Date)
    product_type = Column(String) # "Milk", "Eggs", "Wool"
    quantity = Column(Float)
    unit = Column(String) # "Liters", "Kg", "Count"

    animal = relationship("Animal", back_populates="production_logs")

class LivestockHousing(Base):
    __tablename__ = "livestock_housing"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    name = Column(String) # e.g., "Main Barn", "Coop 1"
    type = Column(String) # "Barn", "Stable", "Coop", "Pasture"
    capacity = Column(Integer, default=10)
    current_occupancy = Column(Integer, default=0)
    
    # Automation / IoT
    auto_cleaning_enabled = Column(Boolean, default=False)
    cleaning_schedule = Column(String, nullable=True) # Cron string or simple text "08:00"
    
    animals = relationship("Animal", back_populates="housing")

class LivestockFeedPlan(Base):
    __tablename__ = "livestock_feed_plans"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("livestock.id"), nullable=True) # Individual plan
    housing_id = Column(Integer, ForeignKey("livestock_housing.id"), nullable=True) # Group plan
    
    feed_item_name = Column(String) # Link to Inventory loosely or by ID
    quantity_per_day = Column(Float) # kg
    schedule_times = Column(JSON) # ["06:00", "18:00"]
    
    # Automation
    auto_feeder_enabled = Column(Boolean, default=False)
    auto_water_enabled = Column(Boolean, default=False)
    
    animal = relationship("Animal", back_populates="feeding_plans")

class LivestockHealthLog(Base):
    __tablename__ = "livestock_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("livestock.id"))
    date = Column(Date, default=datetime.utcnow)
    event_type = Column(String) # "Vaccination", "Checkup", "Injury", "Treatment"
    description = Column(String)
    cost = Column(Float, default=0.0)
    next_due_date = Column(Date, nullable=True) # Reminder for next dose/checkup

    animal = relationship("Animal", back_populates="health_logs")
