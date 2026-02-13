from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.core.ownership import require_admin
from . import service, schemas

router = APIRouter()

@router.post("/", response_model=schemas.RegistryItem)
def create_registry_item(item: schemas.RegistryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_admin(current_user)
    return service.create_registry_item(db=db, item=item)

# Public read endpoints (reference data)
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
