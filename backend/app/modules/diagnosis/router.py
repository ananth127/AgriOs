from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from . import service, schemas
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "static/uploads/diagnosis"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/predict", response_model=schemas.DiagnosisResponse)
async def predict_disease(
    file: UploadFile = File(...),
    crop_name: str = Form("Unknown"),
    lat: float = Form(None),
    lng: float = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a leaf image for disease diagnosis (Crop Doctor).
    """
    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/static/uploads/diagnosis/{safe_filename}"

    svc = service.DiagnosisService(db)
    result = svc.perform_diagnosis(image_url, crop_name, user_id=current_user.id)

    if lat and lng:
        result.location_lat = lat
        result.location_lng = lng
        db.commit()
        db.refresh(result)

    return result

@router.get("/history", response_model=list[schemas.DiagnosisResponse])
def get_diagnosis_history(limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = service.DiagnosisService(db)
    return svc.get_history(limit, user_id=current_user.id)
