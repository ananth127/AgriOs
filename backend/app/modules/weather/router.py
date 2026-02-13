from fastapi import APIRouter, Depends, Query
from .service import WeatherService
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class WeatherDay(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    humidity: float
    rainfall_mm: float
    condition: str

class DiseaseAlert(BaseModel):
    date: str
    risk_level: str
    disease: str
    reason: str

class AdvisoryResponse(BaseModel):
    forecast: List[WeatherDay]
    alerts: List[DiseaseAlert]

@router.get("/advisory", response_model=AdvisoryResponse)
def get_crop_advisory(lat: float, lng: float):
    """
    Get 5-day weather forecast and disease risk alerts.
    """
    svc = WeatherService()
    forecast = svc.get_weather_forecast(lat, lng)
    alerts = svc.calculate_disease_risk(forecast)
    
    return AdvisoryResponse(forecast=forecast, alerts=alerts)
