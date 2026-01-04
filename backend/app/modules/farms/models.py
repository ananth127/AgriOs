from sqlalchemy import Column, Integer, String, JSON
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
