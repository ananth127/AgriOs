from sqlalchemy.orm import Session
from datetime import date, timedelta
from . import models, schemas

def create_crop_cycle(db: Session, cycle: schemas.CropCycleCreate):
    # Logic: Get duration from Registry (mocked here)
    duration_days = 90 # Mock
    estimated_harvest = cycle.sowing_date + timedelta(days=duration_days)
    
    db_cycle = models.CropCycle(
        farm_id=cycle.farm_id,
        registry_id=cycle.registry_id,
        sowing_date=cycle.sowing_date,
        harvest_date_estimated=estimated_harvest,
        current_stage="Sowing",
        health_score=1.0
    )
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

def get_crop_cycle(db: Session, cycle_id: int):
    return db.query(models.CropCycle).filter(models.CropCycle.id == cycle_id).first()

def get_crop_cycles(db: Session, farm_id: int):
    cycles = db.query(models.CropCycle).filter(models.CropCycle.farm_id == farm_id).all()
    
    # Dynamic "Realtime" Calculation
    today = date.today()
    for cycle in cycles:
        days_elapsed = (today - cycle.sowing_date).days
        
        # Calculate Stage
        if days_elapsed < 10:
            cycle.current_stage = "Germination"
        elif days_elapsed < 40:
            cycle.current_stage = "Vegetative"
        elif days_elapsed < 70:
            cycle.current_stage = "Flowering"
        elif days_elapsed < 90:
            cycle.current_stage = "Fruiting"
        else:
            cycle.current_stage = "Harvest Ready"
            
        # Calculate Health (Mock simulation based on age)
        # Random fluctuation or decay logic could go here
        # For now, let's just make it look somewhat realistic
        if days_elapsed > 100:
             cycle.health_score = 0.5 # Old crop
        else:
             cycle.health_score = 0.95 # Healthy
    
    return cycles

def update_crop_cycle(db: Session, cycle_id: int, cycle_update: schemas.CropCycleUpdate):
    db_cycle = get_crop_cycle(db, cycle_id)
    if not db_cycle:
        return None

    update_data = cycle_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cycle, key, value)
    
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

def delete_crop_cycle(db: Session, cycle_id: int):
    db_cycle = get_crop_cycle(db, cycle_id)
    if not db_cycle:
        return None
    db.delete(db_cycle)
    db.commit()
    return db_cycle
