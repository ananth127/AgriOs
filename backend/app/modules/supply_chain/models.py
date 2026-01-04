from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ProductBatch(Base):
    __tablename__ = "supply_chain_batches"

    id = Column(Integer, primary_key=True, index=True)
    crop_cycle_id = Column(Integer, index=True) # Optional link to source crop
    product_name = Column(String)
    quantity = Column(Float)
    unit = Column(String) # kg, tons
    
    current_location = Column(String) # lat,long or address
    status = Column(String) # "Harvested", "Processing", "In Transit", "Delivered"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class SupplyChainEvent(Base):
    __tablename__ = "supply_chain_events"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("supply_chain_batches.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    location = Column(String)
    description = Column(String)
    status_update = Column(String)
