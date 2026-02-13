"""
Variable Rate Irrigation Service
Business logic for VRI zone management and LSTM-based prediction.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import math
from .models import (
    IrrigationZone, IrrigationSchedule, IrrigationLog, 
    WeatherForecast, IrrigationPrediction
)


class VRIService:
    """Service for Variable Rate Irrigation management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============ Zone Management ============
    
    def create_zone(
        self,
        user_id: int,
        name: str,
        boundary: dict = None,
        soil_type: str = None,
        crop_type: str = None,
        crop_stage: str = None,
        target_moisture: float = None,
        farm_id: int = None,
        **kwargs
    ) -> IrrigationZone:
        """Create a new irrigation zone"""
        zone = IrrigationZone(
            user_id=user_id,
            farm_id=farm_id,
            name=name,
            boundary=boundary,
            soil_type=soil_type,
            crop_type=crop_type,
            crop_stage=crop_stage,
            target_moisture=target_moisture,
            **kwargs
        )
        
        # Calculate area if boundary provided
        if boundary:
            zone.area_hectares = self._calculate_area(boundary)
        
        # Set default crop coefficient
        if crop_type:
            zone.crop_coefficient = self._get_crop_coefficient(crop_type, crop_stage)
        
        self.db.add(zone)
        self.db.commit()
        self.db.refresh(zone)
        return zone
    
    def get_zones(self, user_id: int, farm_id: int = None) -> List[IrrigationZone]:
        """Get all zones for a user"""
        query = self.db.query(IrrigationZone).filter(IrrigationZone.user_id == user_id)
        if farm_id:
            query = query.filter(IrrigationZone.farm_id == farm_id)
        return query.all()
    
    def get_zone(self, zone_id: int, user_id: int) -> Optional[IrrigationZone]:
        """Get a specific zone"""
        return self.db.query(IrrigationZone).filter(
            IrrigationZone.id == zone_id,
            IrrigationZone.user_id == user_id
        ).first()
    
    def update_zone(self, zone_id: int, user_id: int, **updates) -> Optional[IrrigationZone]:
        """Update zone properties"""
        zone = self.get_zone(zone_id, user_id)
        if not zone:
            return None
        
        for key, value in updates.items():
            if hasattr(zone, key):
                setattr(zone, key, value)
        
        zone.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(zone)
        return zone
    
    # ============ Evapotranspiration Calculation ============
    
    def calculate_et0(
        self,
        temp_max: float,
        temp_min: float,
        humidity: float,
        wind_speed: float,
        solar_radiation: float,
        latitude: float = 17.0,  # Default to central India
    ) -> float:
        """
        Calculate reference evapotranspiration (ET0) using Penman-Monteith equation
        Returns ET0 in mm/day
        """
        # Mean temperature
        temp_mean = (temp_max + temp_min) / 2
        
        # Saturation vapor pressure (kPa)
        e_s_max = 0.6108 * math.exp((17.27 * temp_max) / (temp_max + 237.3))
        e_s_min = 0.6108 * math.exp((17.27 * temp_min) / (temp_min + 237.3))
        e_s = (e_s_max + e_s_min) / 2
        
        # Actual vapor pressure (kPa)
        e_a = (humidity / 100) * e_s
        
        # Vapor pressure deficit
        vpd = e_s - e_a
        
        # Slope of saturation vapor pressure curve
        delta = 4098 * e_s / ((temp_mean + 237.3) ** 2)
        
        # Psychrometric constant (assuming sea level)
        gamma = 0.0665  # kPa/°C
        
        # Net radiation (simplified, using solar radiation)
        rn = solar_radiation * 0.77  # Assume 23% reflected
        
        # Soil heat flux (assume 0 for daily calculations)
        g = 0
        
        # Penman-Monteith equation (FAO-56)
        numerator = 0.408 * delta * (rn - g) + gamma * (900 / (temp_mean + 273)) * wind_speed * vpd
        denominator = delta + gamma * (1 + 0.34 * wind_speed)
        
        et0 = numerator / denominator
        return max(0, et0)
    
    def calculate_etc(self, et0: float, crop_coefficient: float) -> float:
        """Calculate crop evapotranspiration (ETc)"""
        return et0 * crop_coefficient
    
    def calculate_irrigation_need(
        self,
        zone: IrrigationZone,
        current_moisture: float,
        etc: float,
        precipitation: float = 0,
    ) -> float:
        """
        Calculate irrigation requirement in mm
        Based on soil water balance
        """
        # Target refill to field capacity
        target = zone.target_moisture or zone.field_capacity or 35.0
        
        # Root zone water holding (simplified)
        raw = max(0, target - current_moisture)  # % to refill
        
        # Convert to mm based on root zone depth
        root_depth = zone.root_zone_depth or 300  # mm
        
        # Irrigation need = soil deficit + predicted ET - expected rain
        soil_deficit = (raw / 100) * root_depth
        
        irrigation_mm = soil_deficit + etc - precipitation
        
        return max(0, irrigation_mm)
    
    # ============ LSTM Prediction (Simplified) ============
    
    def generate_prediction(
        self,
        zone_id: int,
        forecast_days: int = 3,
    ) -> List[IrrigationPrediction]:
        """
        Generate irrigation predictions for upcoming days
        Uses weather forecast and historical patterns
        
        Note: Full LSTM model would require TensorFlow/PyTorch
        This is a simplified rule-based approximation
        """
        zone = self.db.query(IrrigationZone).get(zone_id)
        if not zone:
            return []
        
        predictions = []
        
        for day_offset in range(forecast_days):
            prediction_date = datetime.utcnow() + timedelta(days=day_offset)
            
            # Get weather forecast for this day
            forecast = self.db.query(WeatherForecast).filter(
                WeatherForecast.farm_id == zone.farm_id,
                func.date(WeatherForecast.forecast_date) == prediction_date.date()
            ).first()
            
            if forecast and forecast.et0:
                etc = self.calculate_etc(forecast.et0, zone.crop_coefficient)
            else:
                # Default estimate based on temperature
                etc = 4.0  # mm/day average
            
            # Get current moisture (from IoT sensor if available)
            current_moisture = self._get_current_moisture(zone)
            
            # Calculate predicted moisture for this day
            # Simplified: moisture drops by ETc equivalent each day
            moisture_reduction = (etc / (zone.root_zone_depth or 300)) * 100
            predicted_moisture = max(0, current_moisture - (moisture_reduction * (day_offset + 1)))
            
            # Calculate recommended irrigation
            precipitation = forecast.precipitation if forecast else 0
            recommended = self.calculate_irrigation_need(
                zone, predicted_moisture, etc, precipitation
            )
            
            prediction = IrrigationPrediction(
                zone_id=zone_id,
                prediction_date=prediction_date,
                predicted_etc=etc,
                predicted_moisture=predicted_moisture,
                recommended_irrigation=recommended,
                confidence=0.85 - (day_offset * 0.1),  # Confidence decreases with time
                model_version="rule_based_v1",
            )
            
            self.db.add(prediction)
            predictions.append(prediction)
        
        self.db.commit()
        return predictions
    
    def _get_current_moisture(self, zone: IrrigationZone) -> float:
        """Get current soil moisture from IoT sensor"""
        if zone.moisture_sensor_id:
            # Query latest telemetry from IoT device
            from app.modules.iot.models import IoTDevice
            device = self.db.query(IoTDevice).get(zone.moisture_sensor_id)
            if device and device.last_telemetry:
                return device.last_telemetry.get("soil_moisture", 30.0)
        
        # Default value
        return 30.0
    
    # ============ Irrigation Execution ============
    
    def start_irrigation(
        self,
        zone_id: int,
        duration_minutes: int = None,
        target_depth_mm: float = None,
        trigger_reason: str = "manual",
    ) -> IrrigationLog:
        """Start irrigation for a zone"""
        zone = self.db.query(IrrigationZone).get(zone_id)
        if not zone:
            raise ValueError("Zone not found")
        
        # Create log entry
        log = IrrigationLog(
            zone_id=zone_id,
            event_type="manual" if trigger_reason == "manual" else trigger_reason,
            trigger_reason=trigger_reason,
            started_at=datetime.utcnow(),
            moisture_before=self._get_current_moisture(zone),
            status="running",
        )
        
        if target_depth_mm:
            log.depth_mm = target_depth_mm
        
        self.db.add(log)
        
        # Update zone
        zone.last_irrigation = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(log)
        
        # TODO: Send command to valve IoT device
        
        return log
    
    def stop_irrigation(self, log_id: int, abort_reason: str = None) -> IrrigationLog:
        """Stop an ongoing irrigation event"""
        log = self.db.query(IrrigationLog).get(log_id)
        if not log:
            raise ValueError("Log not found")
        
        log.ended_at = datetime.utcnow()
        log.duration_seconds = int((log.ended_at - log.started_at).total_seconds())
        log.status = "aborted" if abort_reason else "completed"
        log.abort_reason = abort_reason
        
        # Get moisture after
        zone = self.db.query(IrrigationZone).get(log.zone_id)
        if zone:
            log.moisture_after = self._get_current_moisture(zone)
        
        self.db.commit()
        self.db.refresh(log)
        
        return log
    
    # ============ Analytics ============
    
    def get_water_usage(
        self,
        user_id: int,
        days: int = 30,
        zone_id: int = None,
    ) -> Dict[str, Any]:
        """Get water usage statistics"""
        since = datetime.utcnow() - timedelta(days=days)
        
        query = self.db.query(IrrigationLog).join(IrrigationZone).filter(
            IrrigationZone.user_id == user_id,
            IrrigationLog.started_at >= since,
        )
        
        if zone_id:
            query = query.filter(IrrigationLog.zone_id == zone_id)
        
        logs = query.all()
        
        total_volume = sum(l.volume_liters or 0 for l in logs)
        total_duration = sum(l.duration_seconds or 0 for l in logs)
        
        return {
            "period_days": days,
            "total_events": len(logs),
            "total_volume_liters": total_volume,
            "total_duration_minutes": total_duration / 60,
            "average_volume_per_event": total_volume / len(logs) if logs else 0,
            "events_by_type": self._count_events_by_type(logs),
        }
    
    def _count_events_by_type(self, logs: List[IrrigationLog]) -> Dict[str, int]:
        """Count irrigation events by trigger type"""
        counts = {}
        for log in logs:
            event_type = log.event_type or "unknown"
            counts[event_type] = counts.get(event_type, 0) + 1
        return counts
    
    # ============ Helpers ============
    
    def _calculate_area(self, boundary: dict) -> float:
        """Calculate area in hectares from GeoJSON polygon"""
        # Simplified - would use shapely in production
        return 1.0  # Default 1 hectare
    
    def _get_crop_coefficient(self, crop_type: str, stage: str = None) -> float:
        """Get crop coefficient (Kc) for ETc calculation"""
        # Simplified coefficients
        coefficients = {
            "rice": {"initial": 1.0, "mid": 1.2, "late": 0.9},
            "wheat": {"initial": 0.4, "mid": 1.15, "late": 0.4},
            "maize": {"initial": 0.3, "mid": 1.2, "late": 0.6},
            "tomato": {"initial": 0.6, "mid": 1.15, "late": 0.8},
            "potato": {"initial": 0.5, "mid": 1.15, "late": 0.75},
            "cotton": {"initial": 0.35, "mid": 1.2, "late": 0.7},
            "sugarcane": {"initial": 0.4, "mid": 1.25, "late": 0.75},
        }
        
        crop_lower = crop_type.lower() if crop_type else "default"
        stage_map = coefficients.get(crop_lower, {"initial": 0.5, "mid": 1.0, "late": 0.7})
        
        if stage:
            stage_lower = stage.lower()
            if "initial" in stage_lower or "germin" in stage_lower:
                return stage_map.get("initial", 0.5)
            elif "mid" in stage_lower or "veget" in stage_lower or "flower" in stage_lower:
                return stage_map.get("mid", 1.0)
            elif "late" in stage_lower or "matur" in stage_lower:
                return stage_map.get("late", 0.7)
        
        return stage_map.get("mid", 1.0)
