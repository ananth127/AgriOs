from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id = Column(Integer, primary_key=True, index=True)
    crop_unique_id = Column(String, unique=True, index=True, nullable=False)
    user_unique_id = Column(String, index=True, nullable=False)
    
    farm_id = Column(Integer, ForeignKey("farms.id"))
    registry_id = Column(Integer, ForeignKey("registry.id")) 
    
    sowing_date = Column(Date)
    harvest_date_estimated = Column(Date)
    
    current_stage = Column(String) # e.g. "Vegetative"
    health_score = Column(Float, default=1.0)
    
    # farm = relationship("FarmTable", back_populates="crops")
    # definition = relationship("RegistryTable")
