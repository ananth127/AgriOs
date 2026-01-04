from sqlalchemy.orm import Session
from . import models, schemas

def create_batch(db: Session, batch: schemas.BatchCreate):
    db_batch = models.ProductBatch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

def add_event(db: Session, batch_id: int, event: schemas.EventCreate):
    db_event = models.SupplyChainEvent(**event.model_dump(), batch_id=batch_id)
    
    # Update batch status
    batch = db.query(models.ProductBatch).filter(models.ProductBatch.id == batch_id).first()
    if batch:
        batch.status = event.status_update
        batch.current_location = event.location
        db.add(batch)
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_batch(db: Session, batch_id: int):
    return db.query(models.ProductBatch).filter(models.ProductBatch.id == batch_id).first()
