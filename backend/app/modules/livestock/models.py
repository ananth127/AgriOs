from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
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
