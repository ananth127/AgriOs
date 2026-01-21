from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table, Boolean
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
    eppo_code = Column(String, nullable=True, index=True) # EPPO Code for standardization
    agrovoc_uri = Column(String, nullable=True) # AGROVOC URI for linked data

    crops = relationship("KGCrop", secondary=pest_crop_association, back_populates="pests")
    chemicals = relationship("KGChemical", secondary=chemical_pest_association, back_populates="pests")

class KGChemical(Base):
    __tablename__ = "kg_chemicals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "Mancozeb"
    description = Column(Text)
    active_ingredient = Column(String, nullable=True)
    
    # Regulatory Compliance
    is_banned = Column(Boolean, default=False)
    regulatory_status = Column(String, nullable=True) # e.g., "Restricted", "Approved"
    cibrc_registration_number = Column(String, nullable=True) # For India
    epa_registration_number = Column(String, nullable=True) # For US (optional)
    
    pests = relationship("KGPest", secondary=chemical_pest_association, back_populates="chemicals")
