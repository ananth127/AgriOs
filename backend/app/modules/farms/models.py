from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.db_compat import get_geo_column

class FarmTable(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    farm_unique_id = Column(String, unique=True, index=True, nullable=False)
    user_unique_id = Column(String, index=True, nullable=False)
    
    owner_id = Column(Integer, index=True) 
    name = Column(String, index=True)
    
    # Geometry
    geometry = Column(get_geo_column('POLYGON', srid=4326))
    soil_profile = Column(JSON, nullable=True) 
    
    zones = relationship("ZoneTable", back_populates="farm", cascade="all, delete-orphan")

class ZoneTable(Base):
    __tablename__ = "zones"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_unique_id = Column(String, unique=True, index=True, nullable=False)
    user_unique_id = Column(String, index=True, nullable=False)
    
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String)
    land_id = Column(String)
    
    geometry = Column(get_geo_column('POLYGON', srid=4326))
    details = Column(JSON, default={})
    
    farm = relationship("FarmTable", back_populates="zones") 
