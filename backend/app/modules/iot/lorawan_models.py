"""
LoRaWAN Gateway Models
Database models for LoRaWAN gateway and node management.
Supports ChirpStack/TTN integration for farm-wide IoT coverage.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class LoRaGateway(Base):
    """LoRaWAN Gateway device - the central hub for sensor nodes"""
    __tablename__ = "lora_gateways"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True, index=True)
    
    # Gateway identification
    gateway_id = Column(String, unique=True, nullable=False)  # EUI-64 format
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Hardware info
    hardware_type = Column(String, default="RAK2287")  # RAK2287, SX1302, WM1302, etc.
    frequency_plan = Column(String, default="IN865")  # IN865, EU868, US915, AU915
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    altitude = Column(Float, default=0)  # meters above sea level
    
    # Network configuration
    network_server = Column(String, default="chirpstack")  # chirpstack, ttn, custom
    api_endpoint = Column(String, nullable=True)  # Network server API URL
    api_key = Column(String, nullable=True)  # Encrypted API key
    
    # Status
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    uptime_seconds = Column(Integer, default=0)
    
    # Statistics
    rx_packets_total = Column(Integer, default=0)
    tx_packets_total = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    nodes = relationship("LoRaNode", back_populates="gateway")


class LoRaNode(Base):
    """LoRaWAN sensor node - end devices (soil sensors, weather stations, etc.)"""
    __tablename__ = "lora_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    gateway_id = Column(Integer, ForeignKey("lora_gateways.id"), nullable=True, index=True)
    
    # Device identification
    dev_eui = Column(String, unique=True, nullable=False)  # Device EUI
    app_eui = Column(String, nullable=True)  # Application EUI (for OTAA)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Device type
    node_type = Column(String, default="SENSOR")  # SENSOR, ACTUATOR, HYBRID
    sensor_type = Column(String, nullable=True)  # soil_moisture, weather, water_level, etc.
    
    # Provisioning
    activation_mode = Column(String, default="OTAA")  # OTAA or ABP
    app_key = Column(String, nullable=True)  # Application key for OTAA (encrypted)
    dev_addr = Column(String, nullable=True)  # Device address (for ABP)
    nwk_s_key = Column(String, nullable=True)  # Network session key (encrypted)
    app_s_key = Column(String, nullable=True)  # App session key (encrypted)
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    zone = Column(String, nullable=True)  # Farm zone/field identifier
    
    # Status
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    battery_level = Column(Float, nullable=True)  # Percentage 0-100
    
    # Signal quality
    rssi = Column(Float, nullable=True)  # Received Signal Strength Indicator (dBm)
    snr = Column(Float, nullable=True)  # Signal-to-Noise Ratio (dB)
    spreading_factor = Column(Integer, default=7)  # SF7-SF12
    
    # Last telemetry
    last_telemetry = Column(JSON, default={})
    telemetry_interval = Column(Integer, default=900)  # Seconds between transmissions
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    gateway = relationship("LoRaGateway", back_populates="nodes")
    telemetry_logs = relationship("LoRaTelemetry", back_populates="node")


class LoRaTelemetry(Base):
    """Telemetry data received from LoRaWAN nodes"""
    __tablename__ = "lora_telemetry"
    
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("lora_nodes.id"), nullable=False, index=True)
    
    # Transmission info
    frame_count = Column(Integer, nullable=True)
    rssi = Column(Float, nullable=True)
    snr = Column(Float, nullable=True)
    spreading_factor = Column(Integer, nullable=True)
    
    # Decoded payload
    payload_raw = Column(String, nullable=True)  # Base64 encoded raw payload
    payload_decoded = Column(JSON, default={})  # Decoded sensor values
    
    # Common sensor fields (for quick queries)
    temperature = Column(Float, nullable=True)  # Celsius
    humidity = Column(Float, nullable=True)  # Percentage
    soil_moisture = Column(Float, nullable=True)  # Percentage or centibar
    battery_voltage = Column(Float, nullable=True)  # Volts
    
    # Timestamp
    received_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    node = relationship("LoRaNode", back_populates="telemetry_logs")


class LoRaDownlink(Base):
    """Downlink commands sent to LoRaWAN nodes"""
    __tablename__ = "lora_downlinks"
    
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("lora_nodes.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=True)
    
    # Command info
    payload = Column(String, nullable=False)  # Base64 or hex encoded
    port = Column(Integer, default=1)  # LoRaWAN fPort
    confirmed = Column(Boolean, default=False)  # Request acknowledgement
    
    # Status
    status = Column(String, default="PENDING")  # PENDING, QUEUED, SENT, DELIVERED, FAILED
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
