from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime

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
        parent_id=animal.parent_id
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
