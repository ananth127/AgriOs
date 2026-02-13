from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class BlockchainLedger(Base):
    """
    Mock Blockchain Entry (Digital Passport).
    In real world, this hash goes to Fabric/Ethereum.
    """
    __tablename__ = "blockchain_ledger"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String) # ProduceBatch, ChemicalApplication
    entity_id = Column(Integer)
    event_type = Column(String) # "HARVEST", "SPRAY", "SHIP"
    
    hash_value = Column(String, unique=True, index=True)
    previous_hash = Column(String)
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON) # Snapshot of data at that time

class CarbonLog(Base):
    """
    MRV Tool for Carbon.
    """
    __tablename__ = "carbon_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, index=True)
    activity_type = Column(String) # TILLAGE, FERTILIZER, FUEL
    quantity = Column(Float)
    
    emission_factor = Column(Float) # kgCO2e per unit
    total_emissions = Column(Float) # Calculated
    
    timestamp = Column(DateTime, default=datetime.utcnow)

class GlobalGapChecklist(Base):
    __tablename__ = "global_gap_checklists"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, index=True)
    audit_date = Column(DateTime, default=datetime.utcnow)
    
    # JSON Blob for flexible checklist answers
    # Ex: { "hygiene_1": true, "pesticide_store_locked": true }
    answers = Column(JSON) 
    is_compliant = Column(Boolean)
