from fastapi import APIRouter, Depends
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from . import service, schemas

router = APIRouter()

@router.post("/analyze", response_model=schemas.DroneAnalysisResponse)
def analyze_drone_imagery(request: schemas.DroneAnalysisRequest, current_user: User = Depends(get_current_user)):
    return service.analyze_image(request)
