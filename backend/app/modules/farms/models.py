from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.db_compat import get_geo_column

class FarmTable(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, index=True)
    
    # Geometry: Polygon, SRID 4326 (WGS84). 
    # Use management=True to ensure AddGeometryColumn is called for PostGIS 1.5, 
    # but strictly this is modern PostGIS so standard definition works.
    # ADAPTIVE: Uses String for SQLite, Geometry for PostGIS
    geometry = Column(get_geo_column('POLYGON', srid=4326))
    
    # Detailed soil data
    soil_profile = Column(JSON, nullable=True) 
    
    # Relationship
    zones = relationship("ZoneTable", back_populates="farm", cascade="all, delete-orphan")

class ZoneTable(Base):
    __tablename__ = "zones"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String)
    land_id = Column(String) # Unique ID like L-1234
    
    # Geometry for the zone
    geometry = Column(get_geo_column('POLYGON', srid=4326))
    
    # Crop & Status Info
    # e.g. {"crop": "Wheat", "status": "Irrigation in 2 days", "color": "green"}
    details = Column(JSON, default={})
    
    farm = relationship("FarmTable", back_populates="zones") 
