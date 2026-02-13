from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.core.ownership import verify_farm_ownership
from . import service, schemas, smart_service, models, smart_models
from app.modules.farms.models import FarmTable

router = APIRouter()


# --- Ownership chain helpers ---

def _get_farm_id_for_animal(db: Session, animal_id: int) -> int:
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return animal.farm_id

def _get_farm_id_for_housing(db: Session, housing_id: int) -> int:
    housing = db.query(models.LivestockHousing).filter(models.LivestockHousing.id == housing_id).first()
    if not housing:
        raise HTTPException(status_code=404, detail="Housing not found")
    return housing.farm_id

def _get_farm_id_for_device(db: Session, device_id: int) -> int:
    device = db.query(smart_models.MonitoringDevice).filter(smart_models.MonitoringDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return _get_farm_id_for_housing(db, device.housing_id)


# IMPORTANT: Specific routes MUST come before generic path parameter routes

# --- Smart Monitoring Routes ---

@router.post("/smart/devices", response_model=schemas.MonitoringDevice)
def register_smart_device(device: schemas.MonitoringDeviceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_housing(db, device.housing_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return smart_service.register_device(db, device)

@router.get("/smart/housing/{housing_id}/devices", response_model=List[schemas.MonitoringDevice])
def get_housing_devices(housing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_housing(db, housing_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return smart_service.get_devices_by_housing(db, housing_id)

@router.post("/smart/telemetry", response_model=schemas.Telemetry)
def log_telemetry(reading: schemas.TelemetryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_device(db, reading.device_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return smart_service.create_telemetry_reading(db, reading)

@router.post("/smart/alerts", response_model=schemas.Alert)
def create_alert(alert: schemas.AlertCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_device(db, alert.device_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return smart_service.create_alert(db, alert)

@router.get("/smart/alerts/active", response_model=List[schemas.Alert])
def get_active_alerts(housing_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if housing_id:
        farm_id = _get_farm_id_for_housing(db, housing_id)
        verify_farm_ownership(db, farm_id, current_user.id)
        return smart_service.get_active_alerts(db, housing_id)
    else:
        # Filter to only alerts belonging to user's farms
        user_farms = db.query(FarmTable.id).filter(FarmTable.owner_id == current_user.id).all()
        farm_ids = [f.id for f in user_farms]
        if not farm_ids:
            return []
        user_housing_ids = db.query(models.LivestockHousing.id).filter(
            models.LivestockHousing.farm_id.in_(farm_ids)
        ).all()
        housing_ids = [h.id for h in user_housing_ids]
        if not housing_ids:
            return []
        return db.query(smart_models.MonitoringAlert).join(smart_models.MonitoringDevice).filter(
            smart_models.MonitoringAlert.resolved == False,
            smart_models.MonitoringDevice.housing_id.in_(housing_ids)
        ).order_by(smart_models.MonitoringAlert.timestamp.desc()).all()

@router.put("/smart/alerts/{alert_id}/resolve", response_model=schemas.Alert)
def resolve_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(smart_models.MonitoringAlert).filter(smart_models.MonitoringAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    farm_id = _get_farm_id_for_device(db, alert.device_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return smart_service.resolve_alert(db, alert_id)

@router.post("/smart/devices/{device_id}/log")
def log_device_action(device_id: int, action: str = Query(...), details: str = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Log an interaction to learn user habits"""
    farm_id = _get_farm_id_for_device(db, device_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return smart_service.log_device_action(db, device_id, action, details)

@router.get("/smart/housing/{housing_id}/suggestions")
def get_smart_suggestions(housing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get AI-driven scheduling suggestions"""
    farm_id = _get_farm_id_for_housing(db, housing_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return smart_service.get_suggestions(db, housing_id)

# Otherwise /{animal_id} will match everything like /feed-plans, /housing, etc.

# --- Feed Plans (MUST be before /{animal_id}) ---

@router.get("/feed-plans", response_model=List[schemas.FeedPlan])
def get_feed_plans(
    housing_id: Optional[int] = Query(None),
    animal_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify ownership via the provided filter parameter
    if housing_id:
        farm_id = _get_farm_id_for_housing(db, housing_id)
        if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
            return []
    elif animal_id:
        farm_id = _get_farm_id_for_animal(db, animal_id)
        if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
            return []
    else:
        return []

    try:
        result = service.get_feed_plans(db, housing_id, animal_id)
        for plan in result:
            if plan.schedule_times is None:
                plan.schedule_times = []
        return result
    except Exception as e:
        import traceback
        print(f"Error fetching feed plans: {e}")
        print(traceback.format_exc())
        return []

@router.post("/feed-plans", response_model=schemas.FeedPlan)
def create_feed_plan(plan: schemas.FeedPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify via animal or housing chain
    if plan.animal_id:
        farm_id = _get_farm_id_for_animal(db, plan.animal_id)
        verify_farm_ownership(db, farm_id, current_user.id)
    elif plan.housing_id:
        farm_id = _get_farm_id_for_housing(db, plan.housing_id)
        verify_farm_ownership(db, farm_id, current_user.id)
    else:
        raise HTTPException(status_code=400, detail="Either animal_id or housing_id is required")
    return service.create_feed_plan(db, plan)

@router.delete("/feed-plans/{plan_id}", response_model=schemas.FeedPlan)
def delete_feed_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch plan to check ownership chain
    db_plan = db.query(models.LivestockFeedPlan).filter(models.LivestockFeedPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Feed plan not found")
    if db_plan.animal_id:
        farm_id = _get_farm_id_for_animal(db, db_plan.animal_id)
    elif db_plan.housing_id:
        farm_id = _get_farm_id_for_housing(db, db_plan.housing_id)
    else:
        raise HTTPException(status_code=400, detail="Feed plan has no ownership link")
    verify_farm_ownership(db, farm_id, current_user.id)
    result = service.delete_feed_plan(db, plan_id)
    return result

# --- Housing (MUST be before /{animal_id}) ---

@router.get("/farm/{farm_id}/housing", response_model=List[schemas.Housing])
def get_housing(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return []
    return service.get_farm_housing(db, farm_id)

@router.post("/housing", response_model=schemas.Housing)
def create_housing(housing: schemas.HousingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    verify_farm_ownership(db, housing.farm_id, current_user.id)
    return service.create_housing(db, housing)

@router.delete("/housing/{housing_id}", response_model=schemas.Housing)
def delete_housing(housing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_housing(db, housing_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    db_housing = service.delete_housing(db, housing_id)
    if not db_housing:
        raise HTTPException(status_code=404, detail="Housing not found")
    return db_housing

# --- Farm-level routes (MUST be before /{animal_id}) ---

@router.get("/farm/{farm_id}", response_model=List[schemas.Animal])
def get_farm_animals(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return []
    return service.get_animals_by_farm(db, farm_id)

@router.get("/farm/{farm_id}/stats", response_model=List[dict])
def get_farm_stats(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return []
    return service.get_farm_production_stats(db, farm_id)

# --- Animals (Generic routes with path parameters come LAST) ---

@router.post("/", response_model=schemas.Animal)
def register_animal(animal: schemas.AnimalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    verify_farm_ownership(db, animal.farm_id, current_user.id)
    return service.create_animal(db, animal)

@router.get("/{animal_id}", response_model=schemas.AnimalDetail)
def get_animal(animal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_animal = service.get_animal_details(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    verify_farm_ownership(db, db_animal.farm_id, current_user.id)
    return db_animal

@router.put("/{animal_id}", response_model=schemas.Animal)
def update_animal(animal_id: int, animal_update: schemas.AnimalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_animal(db, animal_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    db_animal = service.update_animal(db, animal_id, animal_update)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return db_animal

@router.delete("/{animal_id}", response_model=schemas.Animal)
def delete_animal(animal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_animal(db, animal_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    db_animal = service.delete_animal(db, animal_id)
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return db_animal

@router.post("/{animal_id}/production", response_model=schemas.Production)
def log_production(animal_id: int, log: schemas.ProductionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_animal(db, animal_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return service.add_production_log(db, animal_id, log)

@router.get("/{animal_id}/production", response_model=List[schemas.Production])
def get_production_history(animal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_animal(db, animal_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return service.get_production_logs(db, animal_id)

@router.post("/{animal_id}/health-logs", response_model=schemas.HealthLog)
def add_health_log(animal_id: int, log: schemas.HealthLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_animal(db, animal_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return service.create_health_log(db, animal_id, log)

@router.get("/{animal_id}/health-logs", response_model=List[schemas.HealthLog])
def get_health_logs(animal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    farm_id = _get_farm_id_for_animal(db, animal_id)
    verify_farm_ownership(db, farm_id, current_user.id)
    return service.get_health_logs(db, animal_id)
