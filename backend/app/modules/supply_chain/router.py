from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from . import service, schemas, models

router = APIRouter()

@router.post("/batches", response_model=schemas.Batch)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.create_batch(db, batch, user_id=current_user.id)

@router.post("/batches/{batch_id}/events", response_model=schemas.Event)
def add_tracking_event(batch_id: int, event: schemas.EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = service.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    if batch.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this batch")
    return service.add_event(db, batch_id, event)

# Keep public — QR code tracking use case
@router.get("/batches/{batch_id}", response_model=schemas.Batch)
def track_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = service.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@router.get("/batches", response_model=list[schemas.Batch])
def get_all_batches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.get_all_batches(db, user_id=current_user.id)
