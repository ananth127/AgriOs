from pydantic import BaseModel
from typing import List, Dict, Any

class DroneAnalysisRequest(BaseModel):
    image_url: str # S3 URL or similar
    task_type: str = "health_check" # count, health_check, weed_detection

class DetectedObject(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float] # [x1, y1, x2, y2]

class DroneAnalysisResponse(BaseModel):
    image_url: str
    detected_objects: List[DetectedObject]
    summary: Dict[str, int] # e.g. {"Weed": 5, "Crop": 100}
