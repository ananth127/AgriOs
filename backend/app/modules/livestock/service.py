from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from datetime import datetime, date, timedelta
from typing import List, Optional

from app.modules.registry.models import RegistryTable

def get_animal(db: Session, animal_id: int):
    result = db.query(models.Animal, RegistryTable).join(
        RegistryTable, models.Animal.registry_id == RegistryTable.id
    ).filter(models.Animal.id == animal_id).first()
    
    if result:
        animal, registry = result
        animal.species = registry.category
        animal.breed = registry.name
        return animal
    return None

def get_animal_details(db: Session, animal_id: int):
    animal = get_animal(db, animal_id)
    if not animal:
        return None
    
    # 1. Fetch Housing Details
    if animal.housing_id:
        animal.housing = db.query(models.LivestockHousing).filter(models.LivestockHousing.id == animal.housing_id).first()
        
    # 2. Fetch Applicable Feed Plans (Individual + Housing)
    feed_plans = db.query(models.LivestockFeedPlan).filter(
        (models.LivestockFeedPlan.animal_id == animal_id) |
        (models.LivestockFeedPlan.housing_id == animal.housing_id)
    ).all()
    
    animal.feed_plans = feed_plans
    animal.health_logs = db.query(models.LivestockHealthLog).filter(models.LivestockHealthLog.animal_id == animal_id).order_by(models.LivestockHealthLog.date.desc()).all()
    
    return animal

def create_animal(db: Session, animal: schemas.AnimalCreate):
    # Find or Create Registry Entry
    registry_entry = db.query(RegistryTable).filter(
        RegistryTable.category == animal.species,
        RegistryTable.name == animal.breed
    ).first()

    if not registry_entry:
        registry_entry = RegistryTable(
            category=animal.species, 
            name=animal.breed,
            definition={}
        )
        db.add(registry_entry)
        db.commit()
        db.refresh(registry_entry)

    # Auto-generate Tag ID if missing
    if not animal.tag_id:
        count = db.query(models.Animal).count()
        animal.tag_id = f"{animal.species.upper()[:3]}-{1000 + count + 1}"

    # Create Animal
    db_animal = models.Animal(
        farm_id=animal.farm_id,
        registry_id=registry_entry.id,
        tag_id=animal.tag_id,
        date_of_birth=animal.birth_date,
        weight_kg=animal.weight_kg,
        health_status=animal.health_status,
        last_vaccination_date=animal.last_vaccination_date,
        name=animal.name,
        gender=animal.gender,
        purpose=animal.purpose,
        origin=animal.origin,
        source_details=animal.source_details,
        parent_id=animal.parent_id,
        housing_id=animal.housing_id
    )
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)

    # Generate QR Code (One-time generation)
    # Payload strategy: https://app.agrios.com/livestock/{id} or deep link
    if not db_animal.qr_code:
        db_animal.qr_code = f"https://app.agrios.com/livestock/{db_animal.id}"
        db_animal.qr_created_at = datetime.utcnow()
        db.commit()
    
    return db_animal

def add_production_log(db: Session, animal_id: int, log: schemas.ProductionCreate):
    db_log = models.LivestockProduction(
        animal_id=animal_id,
        **log.model_dump()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_production_logs(db: Session, animal_id: int):
    return db.query(models.LivestockProduction).filter(models.LivestockProduction.animal_id == animal_id).order_by(models.LivestockProduction.date.desc()).all()

def get_farm_production_stats(db: Session, farm_id: int):
    # Get total production for the last 30 days
    thirty_days_ago = date.today() - timedelta(days=30)
    
    # Needs a join with Animal to filter by farm_id
    stats = db.query(
        models.LivestockProduction.product_type,
        models.LivestockProduction.unit,
        func.sum(models.LivestockProduction.quantity).label("total_qty"),
        func.avg(models.LivestockProduction.quantity).label("avg_qty")
    ).join(models.Animal, models.Animal.id == models.LivestockProduction.animal_id)\
     .filter(models.Animal.farm_id == farm_id)\
     .filter(models.LivestockProduction.date >= thirty_days_ago)\
     .group_by(models.LivestockProduction.product_type, models.LivestockProduction.unit)\
     .all()
    
    return [
        {
            "product_type": s.product_type,
            "unit": s.unit,
            "total_30d": s.total_qty,
            "avg_daily": s.avg_qty # This is avg per entry, not per day, but good enough for now
        }
        for s in stats
    ]


def get_animals_by_farm(db: Session, farm_id: int):
    results = db.query(models.Animal, RegistryTable).join(
        RegistryTable, models.Animal.registry_id == RegistryTable.id
    ).filter(models.Animal.farm_id == farm_id).all()
    
    animals = []
    for animal, registry in results:
        # Pydantic's from_attributes handles the mapping if we attach attributes dynamically
        # or we explicitly construct dict/object.
        # Safer way:
        animal.species = registry.category
        animal.breed = registry.name
        animals.append(animal)
    
    return animals

def update_animal(db: Session, animal_id: int, animal_update: schemas.AnimalUpdate):
    db_animal = get_animal(db, animal_id)
    if not db_animal:
        return None
    
    update_data = animal_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_animal, key, value)
    
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal

def delete_animal(db: Session, animal_id: int):
    db_animal = get_animal(db, animal_id)
    if not db_animal:
        return None
    
    db.delete(db_animal)
    db.commit()
    return db_animal

# --- Housing Services ---

def get_farm_housing(db: Session, farm_id: int) -> List[models.LivestockHousing]:
    housing = db.query(models.LivestockHousing).filter(models.LivestockHousing.farm_id == farm_id).all()
    # Update Occupancy dynamically
    for h in housing:
        count = db.query(models.Animal).filter(models.Animal.housing_id == h.id).count()
        h.current_occupancy = count
    return housing

def create_housing(db: Session, housing: schemas.HousingCreate):
    db_housing = models.LivestockHousing(**housing.model_dump())
    db.add(db_housing)
    db.commit()
    db.refresh(db_housing)
    return db_housing

# --- Feed Plans Services ---

def get_feed_plans(db: Session, housing_id: int = None, animal_id: int = None):
    q = db.query(models.LivestockFeedPlan)
    if housing_id:
        q = q.filter(models.LivestockFeedPlan.housing_id == housing_id)
    if animal_id:
        q = q.filter(models.LivestockFeedPlan.animal_id == animal_id)
    return q.all()

def create_feed_plan(db: Session, plan: schemas.FeedPlanCreate):
    db_plan = models.LivestockFeedPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def delete_feed_plan(db: Session, plan_id: int):
    db_plan = db.query(models.LivestockFeedPlan).filter(models.LivestockFeedPlan.id == plan_id).first()
    if not db_plan:
        return None
    db.delete(db_plan)
    db.commit()
    return db_plan

def delete_housing(db: Session, housing_id: int):
    db_housing = db.query(models.LivestockHousing).filter(models.LivestockHousing.id == housing_id).first()
    if not db_housing:
        return None
        
    # Optional: Logic to prevent deleting housing if it has animals?
    # For now, let's assume we can delete, but animals might still point to it (set null or restrict)
    # The DB foreign key might fail if restrict is on. 
    # Usually we would set animals.housing_id = null
    
    # Unlink animals
    animals = db.query(models.Animal).filter(models.Animal.housing_id == housing_id).all()
    for animal in animals:
        animal.housing_id = None
        db.add(animal)
    
    db.delete(db_housing)
    db.commit()
    return db_housing

def create_health_log(db: Session, animal_id: int, log: schemas.HealthLogCreate):
    db_log = models.LivestockHealthLog(**log.dict(), animal_id=animal_id)
    db.add(db_log)
    
    # Update Animal Health Status and Last Vaccination Date if applicable
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if animal:
        if log.event_type == "Vaccination":
            animal.last_vaccination_date = log.date
            animal.health_status = "Healthy" # Assume healthy after vaccine? Or keep as is.
        elif log.event_type == "Injury" or log.event_type == "Sickness":
             animal.health_status = "Sick"
        elif log.event_type == "Treatment" or log.event_type == "Checkup":
             # Maybe reset to Healthy? Let's leave it to manual or explicit status update
             pass
        
        db.add(animal)
        
    db.commit()
    db.refresh(db_log)
    return db_log

def get_health_logs(db: Session, animal_id: int):
    return db.query(models.LivestockHealthLog).filter(models.LivestockHealthLog.animal_id == animal_id).order_by(models.LivestockHealthLog.date.desc()).all()
