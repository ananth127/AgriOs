from fastapi import APIRouter
from . import service, schemas

router = APIRouter()

@router.post("/analyze", response_model=schemas.DroneAnalysisResponse)
def analyze_drone_imagery(request: schemas.DroneAnalysisRequest):
    return service.analyze_image(request)
