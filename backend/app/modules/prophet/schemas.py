from pydantic import BaseModel
from typing import List, Optional

class PredictionRequest(BaseModel):
    location: str
    date: str # ISO format
    crop_name: Optional[str] = None # If None, suggest best crops

class PredictionResponse(BaseModel):
    crop_name: str
    profitability_score: float # 0.0 to 1.0
    confidence: float
    reason: str
    recommended_action: str
