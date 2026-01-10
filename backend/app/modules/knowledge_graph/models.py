from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

# Association Tables
pest_crop_association = Table(
    'kg_pest_crop', Base.metadata,
    Column('pest_id', Integer, ForeignKey('kg_pests.id')),
    Column('crop_id', Integer, ForeignKey('kg_crops.id'))
)

chemical_pest_association = Table(
    'kg_chemical_pest', Base.metadata,
    Column('chemical_id', Integer, ForeignKey('kg_chemicals.id')),
    Column('pest_id', Integer, ForeignKey('kg_pests.id'))
)

class KGCrop(Base):
    __tablename__ = "kg_crops"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "Potato"
    
    pests = relationship("KGPest", secondary=pest_crop_association, back_populates="crops")

class KGPest(Base):
    __tablename__ = "kg_pests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "Late Blight"
    symptoms = Column(Text)                         # Description of symptoms
    
    crops = relationship("KGCrop", secondary=pest_crop_association, back_populates="pests")
    chemicals = relationship("KGChemical", secondary=chemical_pest_association, back_populates="pests")

class KGChemical(Base):
    __tablename__ = "kg_chemicals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "Mancozeb"
    description = Column(Text)
    
    pests = relationship("KGPest", secondary=chemical_pest_association, back_populates="chemicals")
