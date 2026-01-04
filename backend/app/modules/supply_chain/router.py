from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from . import service, schemas

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/batches", response_model=schemas.Batch)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(get_db)):
    return service.create_batch(db, batch)

@router.post("/batches/{batch_id}/events", response_model=schemas.Event)
def add_tracking_event(batch_id: int, event: schemas.EventCreate, db: Session = Depends(get_db)):
    return service.add_event(db, batch_id, event)

@router.get("/batches/{batch_id}", response_model=schemas.Batch)
def track_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = service.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch
