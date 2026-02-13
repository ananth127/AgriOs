from sqlalchemy import Column, Integer, String, JSON
from app.core.database import Base

class RegistryTable(Base):
    __tablename__ = "registry"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String, index=True) 
    definition = Column(JSON) 
