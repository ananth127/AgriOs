from sqlalchemy.orm import Session
from . import models, schemas

def get_animal(db: Session, animal_id: int):
    return db.query(models.Animal).filter(models.Animal.id == animal_id).first()

def create_animal(db: Session, animal: schemas.AnimalCreate):
    db_animal = models.Animal(**animal.model_dump())
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal

def get_animals_by_farm(db: Session, farm_id: int):
    return db.query(models.Animal).filter(models.Animal.farm_id == farm_id).all()

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
