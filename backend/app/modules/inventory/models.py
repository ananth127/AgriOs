from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # Urea, Seed X
    category = Column(String) # Fertilizer, Seed, Chemical
    sku = Column(String, unique=True)
    total_quantity = Column(Float, default=0.0) # Aggregated
    unit = Column(String) # kg, liters
    min_threshold = Column(Float) # Reorder level

    batches = relationship("InventoryBatch", back_populates="item")

class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"))
    batch_number = Column(String)
    quantity_remaining = Column(Float)
    expiry_date = Column(DateTime)
    received_date = Column(DateTime, default=datetime.utcnow)
    
    item = relationship("InventoryItem", back_populates="batches")
