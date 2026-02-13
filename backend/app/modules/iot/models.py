from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class IoTDevice(Base):
    __tablename__ = "iot_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_unique_id = Column(String, unique=True, index=True, nullable=False)
    user_unique_id = Column(String, index=True, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    hardware_id = Column(String, unique=True, index=True, nullable=False)  # ESP32 MAC or Unique ID
    phone_number = Column(String, nullable=True)  # SIM number in the device
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    is_online = Column(Boolean, default=False)
    status = Column(String, default="IDLE") # ACTIVE, ALERT, WARNING, IDLE, RUNNING
    last_telemetry = Column(JSON, default={}) # e.g. {"battery": 80, "value": "24C", "video_url": "..."}
    last_heartbeat = Column(DateTime, nullable=True)
    secret_key = Column(String, nullable=False)  # For HMAC signing
    config = Column(JSON, default={})  # Store pin configs, schedule, etc.
    asset_type = Column(String, default="Device") # Pump, Valve, Sensor
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- New Fields for Smart Logic ---
    parent_device_id = Column(Integer, ForeignKey("iot_devices.id"), nullable=True) # Linked Pump for a Valve
    last_active_at = Column(DateTime, nullable=True)
    total_runtime_minutes = Column(Float, default=0.0)
    current_run_start_time = Column(DateTime, nullable=True) # If set, device is currently ON
    target_turn_off_at = Column(DateTime, nullable=True) # Timer Target

    # Relationships
    parent_device = relationship("IoTDevice", remote_side=[id], backref="child_devices")
    commands = relationship("IoTCommand", back_populates="device")


class IoTCommand(Base):
    __tablename__ = "iot_commands"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("iot_devices.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who sent it?
    command = Column(String, nullable=False)  # e.g., "VALVE_OPEN"
    payload = Column(JSON, default={})  # e.g., {"valve_index": 1, "duration": 60}
    status = Column(String, default="PENDING")  # PENDING, SENT_MQTT, SENT_SMS, EXECUTED, FAILED
    source = Column(String, default="WEB")  # WEB, MOBILE, SMS_GATEWAY
    transport_used = Column(String, nullable=True)  # MQTT or SMS
    executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    device = relationship("IoTDevice", back_populates="commands")
