from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    machine_unique_id = Column(String, unique=True, index=True, nullable=False)
    user_unique_id = Column(String, index=True, nullable=False)
    
    name = Column(String, index=True) # e.g., "John Deere 5050D"
    type = Column(String) # Tractor, Harvester, Drone
    serial_number = Column(String, unique=True)
    engine_hours = Column(Float, default=0.0)
    fuel_level = Column(Float, default=100.0) # Percentage
    last_maintenance_date = Column(DateTime, default=datetime.utcnow)
    next_maintenance_hours = Column(Float) # e.g., at 500 hours
    
    telemetry_logs = relationship("TelemetryLog", back_populates="machine")

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # ISOBUS Data Points
    gps_lat = Column(Float)
    gps_lng = Column(Float)
    speed_kmh = Column(Float)
    fuel_rate_lph = Column(Float)
    engine_rpm = Column(Float)
    
    # Task Controller Data (XML parsed)
    task_id = Column(String, nullable=True)
    applied_product = Column(String, nullable=True) # e.g., "Urea"
    application_rate = Column(Float, nullable=True) # e.g., kg/ha
    
    machine = relationship("Machine", back_populates="telemetry_logs")
