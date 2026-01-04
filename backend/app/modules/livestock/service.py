from sqlalchemy.orm import Session
from . import models, schemas

def create_animal(db: Session, animal: schemas.AnimalCreate):
    db_animal = models.Animal(**animal.model_dump())
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal

def get_animals_by_farm(db: Session, farm_id: int):
    return db.query(models.Animal).filter(models.Animal.farm_id == farm_id).all()
