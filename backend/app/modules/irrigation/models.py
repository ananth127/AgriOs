"""
Variable Rate Irrigation (VRI) Models
Database models for irrigation zones, schedules, and water usage tracking.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class IrrigationZone(Base):
    """VRI zone - represents a distinct irrigation area with specific water needs"""
    __tablename__ = "irrigation_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True, index=True)
    
    # Zone identification
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    zone_type = Column(String, default="sector")  # sector, ring, custom
    
    # GeoJSON boundary
    boundary = Column(JSON, nullable=True)  # GeoJSON polygon
    area_hectares = Column(Float, nullable=True)
    
    # Soil properties
    soil_type = Column(String, nullable=True)  # clay, loam, sand, etc.
    field_capacity = Column(Float, nullable=True)  # % water at field capacity
    wilting_point = Column(Float, nullable=True)  # % water at wilting point
    infiltration_rate = Column(Float, nullable=True)  # mm/hour
    
    # Crop information
    crop_type = Column(String, nullable=True)
    crop_stage = Column(String, nullable=True)  # germination, vegetative, flowering, maturity
    crop_coefficient = Column(Float, default=1.0)  # Kc for ETc calculation
    root_zone_depth = Column(Float, default=300)  # mm
    
    # VRI settings
    target_moisture = Column(Float, nullable=True)  # Target soil moisture %
    min_moisture = Column(Float, nullable=True)  # Minimum before irrigation triggers
    max_application_rate = Column(Float, nullable=True)  # mm/hour
    
    # IoT device links
    moisture_sensor_id = Column(Integer, ForeignKey("iot_devices.id"), nullable=True)
    valve_device_id = Column(Integer, ForeignKey("iot_devices.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_irrigation = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    schedules = relationship("IrrigationSchedule", back_populates="zone")
    logs = relationship("IrrigationLog", back_populates="zone")


class IrrigationSchedule(Base):
    """Scheduled irrigation events for a zone"""
    __tablename__ = "irrigation_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    
    # Schedule type
    schedule_type = Column(String, default="time")  # time, sensor, ai_prediction
    
    # Time-based scheduling
    start_time = Column(String, nullable=True)  # HH:MM format
    days_of_week = Column(JSON, default=[])  # [0,1,2,3,4,5,6] for Mon-Sun
    
    # Duration/volume
    duration_minutes = Column(Integer, nullable=True)
    target_volume_liters = Column(Float, nullable=True)
    target_depth_mm = Column(Float, nullable=True)
    
    # Sensor-based triggers
    trigger_moisture_below = Column(Float, nullable=True)
    stop_moisture_above = Column(Float, nullable=True)
    
    # AI prediction settings
    use_lstm_prediction = Column(Boolean, default=False)
    prediction_horizon_hours = Column(Integer, default=24)
    
    # Status
    is_enabled = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    zone = relationship("IrrigationZone", back_populates="schedules")


class IrrigationLog(Base):
    """Log of irrigation events for analytics and water usage tracking"""
    __tablename__ = "irrigation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("irrigation_schedules.id"), nullable=True)
    
    # Event info
    event_type = Column(String, default="scheduled")  # scheduled, manual, ai_triggered
    trigger_reason = Column(String, nullable=True)  # e.g., "moisture below 30%"
    
    # Timing
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Water usage
    volume_liters = Column(Float, nullable=True)
    depth_mm = Column(Float, nullable=True)
    flow_rate_lpm = Column(Float, nullable=True)  # Liters per minute
    
    # Conditions before/after
    moisture_before = Column(Float, nullable=True)
    moisture_after = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    et0 = Column(Float, nullable=True)  # Reference evapotranspiration
    
    # Status
    status = Column(String, default="completed")  # running, completed, aborted, failed
    abort_reason = Column(String, nullable=True)
    
    # Relationships
    zone = relationship("IrrigationZone", back_populates="logs")


class WeatherForecast(Base):
    """Weather forecast data for irrigation prediction"""
    __tablename__ = "weather_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True, index=True)
    
    # Forecast timing
    forecast_date = Column(DateTime, nullable=False, index=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    
    # Weather parameters
    temp_max = Column(Float, nullable=True)  # Celsius
    temp_min = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)  # %
    wind_speed = Column(Float, nullable=True)  # m/s
    solar_radiation = Column(Float, nullable=True)  # MJ/m²/day
    precipitation = Column(Float, nullable=True)  # mm
    precipitation_probability = Column(Float, nullable=True)  # %
    
    # Calculated values
    et0 = Column(Float, nullable=True)  # Reference evapotranspiration (Penman-Monteith)
    
    # Raw data
    raw_data = Column(JSON, default={})


class IrrigationPrediction(Base):
    """LSTM model predictions for irrigation needs"""
    __tablename__ = "irrigation_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False, index=True)
    
    # Prediction details
    prediction_date = Column(DateTime, nullable=False)  # Date this prediction is for
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # Predicted values
    predicted_etc = Column(Float, nullable=True)  # Crop evapotranspiration (mm)
    predicted_moisture = Column(Float, nullable=True)  # Predicted soil moisture %
    recommended_irrigation = Column(Float, nullable=True)  # Recommended irrigation (mm)
    
    # Confidence
    confidence = Column(Float, nullable=True)
    model_version = Column(String, nullable=True)
    
    # Actual values (filled in later for model validation)
    actual_moisture = Column(Float, nullable=True)
    prediction_error = Column(Float, nullable=True)  # RMSE
