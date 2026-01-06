from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core import database
from . import service, schemas

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Animal)
def register_animal(animal: schemas.AnimalCreate, db: Session = Depends(get_db)):
    return service.create_animal(db, animal)

@router.get("/farm/{farm_id}", response_model=List[schemas.Animal])
def get_farm_animals(farm_id: int, db: Session = Depends(get_db)):
    return service.get_animals_by_farm(db, farm_id)

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
