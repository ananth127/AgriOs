from sqlalchemy.orm import Session
from . import models, schemas

def create_registry_item(db: Session, item: schemas.RegistryCreate):
    db_item = models.RegistryTable(
        name=item.name,
        category=item.category,
        definition=item.definition
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_registry_item(db: Session, name: str):
    return db.query(models.RegistryTable).filter(models.RegistryTable.name == name).first()

def list_registry_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.RegistryTable).offset(skip).limit(limit).all()
