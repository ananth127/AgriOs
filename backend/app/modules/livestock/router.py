from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core import database
from . import service, schemas, smart_service

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# IMPORTANT: Specific routes MUST come before generic path parameter routes

# --- Smart Monitoring Routes ---

@router.post("/smart/devices", response_model=schemas.MonitoringDevice)
def register_smart_device(device: schemas.MonitoringDeviceCreate, db: Session = Depends(get_db)):
    return smart_service.register_device(db, device)

@router.get("/smart/housing/{housing_id}/devices", response_model=List[schemas.MonitoringDevice])
def get_housing_devices(housing_id: int, db: Session = Depends(get_db)):
    return smart_service.get_devices_by_housing(db, housing_id)

@router.post("/smart/telemetry", response_model=schemas.Telemetry)
def log_telemetry(reading: schemas.TelemetryCreate, db: Session = Depends(get_db)):
    return smart_service.create_telemetry_reading(db, reading)

@router.post("/smart/alerts", response_model=schemas.Alert)
def create_alert(alert: schemas.AlertCreate, db: Session = Depends(get_db)):
    return smart_service.create_alert(db, alert)

@router.get("/smart/alerts/active", response_model=List[schemas.Alert])
def get_active_alerts(housing_id: Optional[int] = None, db: Session = Depends(get_db)):
    return smart_service.get_active_alerts(db, housing_id)

@router.put("/smart/alerts/{alert_id}/resolve", response_model=schemas.Alert)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    return smart_service.resolve_alert(db, alert_id)

@router.post("/smart/devices/{device_id}/log")
def log_device_action(device_id: int, action: str = Query(...), details: str = Query(None), db: Session = Depends(get_db)):
    """Log an interaction to learn user habits"""
    return smart_service.log_device_action(db, device_id, action, details)

@router.get("/smart/housing/{housing_id}/suggestions")
def get_smart_suggestions(housing_id: int, db: Session = Depends(get_db)):
    """Get AI-driven scheduling suggestions"""
    return smart_service.get_suggestions(db, housing_id)
# Otherwise /{animal_id} will match everything like /feed-plans, /housing, etc.

# --- Feed Plans (MUST be before /{animal_id}) ---

@router.get("/feed-plans", response_model=List[schemas.FeedPlan])
def get_feed_plans(
    housing_id: Optional[int] = Query(None), 
    animal_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        result = service.get_feed_plans(db, housing_id, animal_id)
        
        # Ensure schedule_times is always a list, not None or invalid JSON
        for plan in result:
            if plan.schedule_times is None:
                plan.schedule_times = []
        
        return result
    except Exception as e:
        import traceback
        print(f"Error fetching feed plans: {e}")
        print(traceback.format_exc())
        # Return empty list to prevent breaking the frontend
        return []

@router.post("/feed-plans", response_model=schemas.FeedPlan)
def create_feed_plan(plan: schemas.FeedPlanCreate, db: Session = Depends(get_db)):
    return service.create_feed_plan(db, plan)

@router.delete("/feed-plans/{plan_id}", response_model=schemas.FeedPlan)
def delete_feed_plan(plan_id: int, db: Session = Depends(get_db)):
    db_plan = service.delete_feed_plan(db, plan_id)
    if not db_plan:
        raise HTTPException(status_code=404, detail="Feed plan not found")
    return db_plan

# --- Housing (MUST be before /{animal_id}) ---

@router.get("/farm/{farm_id}/housing", response_model=List[schemas.Housing])
def get_housing(farm_id: int, db: Session = Depends(get_db)):
    return service.get_farm_housing(db, farm_id)

@router.post("/housing", response_model=schemas.Housing)
def create_housing(housing: schemas.HousingCreate, db: Session = Depends(get_db)):
    return service.create_housing(db, housing)

@router.delete("/housing/{housing_id}", response_model=schemas.Housing)
def delete_housing(housing_id: int, db: Session = Depends(get_db)):
    db_housing = service.delete_housing(db, housing_id)
    if not db_housing:
        raise HTTPException(status_code=404, detail="Housing not found")
    return db_housing

# --- Farm-level routes (MUST be before /{animal_id}) ---

@router.get("/farm/{farm_id}", response_model=List[schemas.Animal])
def get_farm_animals(farm_id: int, db: Session = Depends(get_db)):
    return service.get_animals_by_farm(db, farm_id)

@router.get("/farm/{farm_id}/stats", response_model=List[dict]) 
def get_farm_stats(farm_id: int, db: Session = Depends(get_db)):
    return service.get_farm_production_stats(db, farm_id)

# --- Animals (Generic routes with path parameters come LAST) ---

@router.post("/", response_model=schemas.Animal)
def register_animal(animal: schemas.AnimalCreate, db: Session = Depends(get_db)):
    return service.create_animal(db, animal)

@router.get("/{animal_id}", response_model=schemas.AnimalDetail)
def get_animal(animal_id: int, db: Session = Depends(get_db)):
    db_animal = service.get_animal_details(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return db_animal

@router.put("/{animal_id}", response_model=schemas.Animal)
def update_animal(animal_id: int, animal_update: schemas.AnimalUpdate, db: Session = Depends(get_db)):
    db_animal = service.update_animal(db, animal_id, animal_update)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return db_animal

@router.delete("/{animal_id}", response_model=schemas.Animal)
def delete_animal(animal_id: int, db: Session = Depends(get_db)):
    db_animal = service.delete_animal(db, animal_id)
    if not db_animal:
         raise HTTPException(status_code=404, detail="Animal not found")
    return db_animal

@router.post("/{animal_id}/production", response_model=schemas.Production)
def log_production(animal_id: int, log: schemas.ProductionCreate, db: Session = Depends(get_db)):
    return service.add_production_log(db, animal_id, log)

@router.get("/{animal_id}/production", response_model=List[schemas.Production])
def get_production_history(animal_id: int, db: Session = Depends(get_db)):
    return service.get_production_logs(db, animal_id)

@router.post("/{animal_id}/health-logs", response_model=schemas.HealthLog)
def add_health_log(animal_id: int, log: schemas.HealthLogCreate, db: Session = Depends(get_db)):
    return service.create_health_log(db, animal_id, log)

@router.get("/{animal_id}/health-logs", response_model=List[schemas.HealthLog])
def get_health_logs(animal_id: int, db: Session = Depends(get_db)):
    return service.get_health_logs(db, animal_id)
