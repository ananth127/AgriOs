from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class IoTDevice(Base):
    __tablename__ = "iot_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    hardware_id = Column(String, unique=True, index=True, nullable=False)  # ESP32 MAC or Unique ID
    phone_number = Column(String, nullable=True)  # SIM number in the device
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    is_online = Column(Boolean, default=False)
    last_heartbeat = Column(DateTime, nullable=True)
    secret_key = Column(String, nullable=False)  # For HMAC signing
    config = Column(JSON, default={})  # Store pin configs, schedule, etc.
    asset_type = Column(String, default="Device")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("app.modules.auth.models.User", back_populates="devices")
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
