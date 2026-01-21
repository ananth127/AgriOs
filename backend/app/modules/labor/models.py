from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class FieldWorker(Base):
    __tablename__ = "field_workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    qr_code_id = Column(String, unique=True) # For scanning
    hourly_rate = Column(Float, default=0.0)
    
    attendance = relationship("AttendanceLog", back_populates="worker")
    harvest_logs = relationship("WorkerHarvestLog", back_populates="worker")

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("field_workers.id"))
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime, nullable=True)
    date = Column(String) # YYYY-MM-DD
    
    worker = relationship("FieldWorker", back_populates="attendance")

class WorkerHarvestLog(Base):
    __tablename__ = "worker_harvest_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("field_workers.id"))
    crop_name = Column(String)
    quantity = Column(Float) # e.g. kg or crates
    unit = Column(String) # "kg", "crate"
    timestamp = Column(DateTime, default=datetime.utcnow)
    payout_amount = Column(Float) # Calculated piece-rate
    
    worker = relationship("FieldWorker", back_populates="harvest_logs")
