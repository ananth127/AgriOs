from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class MarketPrice(Base):
    """
    Stores daily mandi prices (eNAM/Agmarknet).
    """
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    commodity = Column(String, index=True) # e.g. Tomato
    market_name = Column(String, index=True) # e.g. Azadpur Mandi
    modal_price = Column(Float) # Rs./Quintal
    min_price = Column(Float)
    max_price = Column(Float)
    date = Column(String, index=True) # YYYY-MM-DD
    source = Column(String) # "eNAM", "Agmarknet"

class ProduceBatch(Base):
    """
    Represents a harvested batch for sale.
    """
    __tablename__ = "produce_batches"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, index=True)
    commodity = Column(String)
    weight_kg = Column(Float)
    harvest_date = Column(DateTime)
    
    # Grading Results (Computer Vision)
    grade = Column(String) # A, B, C
    quality_score = Column(Float) # 0-100
    quality_metadata = Column(JSON) # { "size_avg": 50mm, "sugar_brix": 12 }
    
    status = Column(String, default="COLLECTED") # COLLECTED, IN_TRANSIT, SOLD
    
    logistics_logs = relationship("ColdChainLog", back_populates="batch")

class ColdChainLog(Base):
    """
    IoT Sensor Logs for transport.
    """
    __tablename__ = "cold_chain_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("produce_batches.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature_c = Column(Float)
    humidity_p = Column(Float)
    location_lat = Column(Float)
    location_lng = Column(Float)
    
    batch = relationship("ProduceBatch", back_populates="logistics_logs")
