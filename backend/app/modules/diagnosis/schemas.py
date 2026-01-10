from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DiagnosisBase(BaseModel):
    image_url: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    crop_name: Optional[str] = None

class DiagnosisCreate(DiagnosisBase):
    pass

class DiagnosisResponse(DiagnosisBase):
    id: int
    disease_detected: str
    confidence_score: float
    recommendation: Optional[str]
    cause: Optional[str] = None
    prevention: Optional[str] = None
    treatment_organic: Optional[str] = None
    treatment_chemical: Optional[str] = None
    identified_crop: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
