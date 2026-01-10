from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core import database
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
    db: Session = Depends(database.get_db)
):
    """
    Upload a leaf image for disease diagnosis (Crop Doctor).
    """
    # Save file
    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Construct URL (assuming local serving)
    # In prod, upload to S3/Supabase Storage
    image_url = f"/static/uploads/diagnosis/{safe_filename}"
    
    svc = service.DiagnosisService(db)
    result = svc.perform_diagnosis(image_url, crop_name)
    
    # Update location if provided
    if lat and lng:
        result.location_lat = lat
        result.location_lng = lng
        db.commit()
        db.refresh(result)
        
    return result

@router.get("/history", response_model=list[schemas.DiagnosisResponse])
def get_diagnosis_history(limit: int = 10, db: Session = Depends(database.get_db)):
    svc = service.DiagnosisService(db)
    return svc.get_history(limit)
