"""
VRI Irrigation API Router
Endpoints for zone management, scheduling, and predictions.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user_id
from .service import VRIService
from .models import IrrigationZone, IrrigationPrediction


router = APIRouter(prefix="/irrigation", tags=["irrigation"])


# ============ Schemas ============

class ZoneCreate(BaseModel):
    name: str
    boundary: Optional[dict] = None
    soil_type: Optional[str] = None
    crop_type: Optional[str] = None
    crop_stage: Optional[str] = None
    target_moisture: Optional[float] = None
    min_moisture: Optional[float] = None
    farm_id: Optional[int] = None
    moisture_sensor_id: Optional[int] = None
    valve_device_id: Optional[int] = None


class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    crop_type: Optional[str] = None
    crop_stage: Optional[str] = None
    target_moisture: Optional[float] = None
    min_moisture: Optional[float] = None
    is_active: Optional[bool] = None


class ZoneResponse(BaseModel):
    id: int
    name: str
    soil_type: Optional[str]
    crop_type: Optional[str]
    crop_stage: Optional[str]
    crop_coefficient: float
    target_moisture: Optional[float]
    area_hectares: Optional[float]
    is_active: bool
    last_irrigation: Optional[datetime]
    
    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    id: int
    zone_id: int
    prediction_date: datetime
    predicted_etc: Optional[float]
    predicted_moisture: Optional[float]
    recommended_irrigation: Optional[float]
    confidence: Optional[float]
    
    class Config:
        from_attributes = True


class StartIrrigationRequest(BaseModel):
    duration_minutes: Optional[int] = None
    target_depth_mm: Optional[float] = None
    trigger_reason: str = "manual"


class IrrigationLogResponse(BaseModel):
    id: int
    zone_id: int
    event_type: str
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    volume_liters: Optional[float]
    depth_mm: Optional[float]
    moisture_before: Optional[float]
    moisture_after: Optional[float]
    status: str
    
    class Config:
        from_attributes = True


class WaterUsageResponse(BaseModel):
    period_days: int
    total_events: int
    total_volume_liters: float
    total_duration_minutes: float
    average_volume_per_event: float
    events_by_type: dict


# ============ Zone Endpoints ============

@router.post("/zones", response_model=ZoneResponse)
async def create_zone(
    data: ZoneCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Create a new irrigation zone"""
    service = VRIService(db)
    zone = service.create_zone(
        user_id=user_id,
        **data.model_dump()
    )
    return zone


@router.get("/zones", response_model=List[ZoneResponse])
async def get_zones(
    farm_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get all irrigation zones"""
    service = VRIService(db)
    return service.get_zones(user_id, farm_id)


@router.get("/zones/{zone_id}", response_model=ZoneResponse)
async def get_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get a specific zone"""
    service = VRIService(db)
    zone = service.get_zone(zone_id, user_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.patch("/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    zone_id: int,
    data: ZoneUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Update a zone"""
    service = VRIService(db)
    zone = service.update_zone(zone_id, user_id, **data.model_dump(exclude_unset=True))
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


# ============ Prediction Endpoints ============

@router.post("/zones/{zone_id}/predictions", response_model=List[PredictionResponse])
async def generate_predictions(
    zone_id: int,
    days: int = 3,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Generate irrigation predictions for a zone"""
    service = VRIService(db)
    
    # Verify user owns this zone
    zone = service.get_zone(zone_id, user_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    predictions = service.generate_prediction(zone_id, days)
    return predictions


@router.get("/zones/{zone_id}/predictions", response_model=List[PredictionResponse])
async def get_predictions(
    zone_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get existing predictions for a zone"""
    service = VRIService(db)
    zone = service.get_zone(zone_id, user_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    predictions = db.query(IrrigationPrediction).filter(
        IrrigationPrediction.zone_id == zone_id,
        IrrigationPrediction.prediction_date >= datetime.utcnow()
    ).order_by(IrrigationPrediction.prediction_date).all()
    
    return predictions


# ============ Irrigation Control ============

@router.post("/zones/{zone_id}/start", response_model=IrrigationLogResponse)
async def start_irrigation(
    zone_id: int,
    data: StartIrrigationRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Start irrigation for a zone"""
    service = VRIService(db)
    zone = service.get_zone(zone_id, user_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    log = service.start_irrigation(
        zone_id=zone_id,
        duration_minutes=data.duration_minutes,
        target_depth_mm=data.target_depth_mm,
        trigger_reason=data.trigger_reason,
    )
    return log


@router.post("/logs/{log_id}/stop", response_model=IrrigationLogResponse)
async def stop_irrigation(
    log_id: int,
    abort_reason: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Stop an ongoing irrigation event"""
    service = VRIService(db)
    log = service.stop_irrigation(log_id, abort_reason)
    return log


# ============ Analytics ============

@router.get("/analytics/water-usage", response_model=WaterUsageResponse)
async def get_water_usage(
    days: int = 30,
    zone_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get water usage analytics"""
    service = VRIService(db)
    return service.get_water_usage(user_id, days, zone_id)


# ============ ET0 Calculation ============

class ET0Request(BaseModel):
    temp_max: float
    temp_min: float
    humidity: float
    wind_speed: float
    solar_radiation: float
    latitude: float = 17.0


@router.post("/calculate-et0")
async def calculate_et0(
    data: ET0Request,
    db: Session = Depends(get_db),
):
    """Calculate reference evapotranspiration (ET0)"""
    service = VRIService(db)
    et0 = service.calculate_et0(
        temp_max=data.temp_max,
        temp_min=data.temp_min,
        humidity=data.humidity,
        wind_speed=data.wind_speed,
        solar_radiation=data.solar_radiation,
        latitude=data.latitude,
    )
    return {"et0_mm_day": round(et0, 2)}
