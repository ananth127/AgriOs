from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from . import service, schemas

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.RegistryItem)
def create_registry_item(item: schemas.RegistryCreate, db: Session = Depends(get_db)):
    return service.create_registry_item(db=db, item=item)

@router.get("/search", response_model=schemas.RegistryItem)
def search_crop(query: str, db: Session = Depends(get_db)):
    """
    Search for a crop profile. usage: /search?query=Potato
    If it doesn't exist, AI will generate it.
    """
    item = service.search_or_create_crop(db, query)
    if not item:
        raise HTTPException(status_code=404, detail="Crop not found and could not be generated.")
    return item

@router.get("/", response_model=list[schemas.RegistryItem])
def list_registry_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.list_registry_items(db, skip=skip, limit=limit)

@router.get("/{name}", response_model=schemas.RegistryItem)
def read_registry_item(name: str, db: Session = Depends(get_db)):
    db_item = service.get_registry_item(db, name=name)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item
