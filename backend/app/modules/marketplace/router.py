from fastapi import APIRouter, Depends
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

# Mock User ID dependency
def get_current_user_id():
    return 1

@router.post("/providers", response_model=schemas.Provider)
def register_provider(provider: schemas.ProviderCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return service.create_provider(db, provider, user_id)

@router.post("/providers/{provider_id}/listings", response_model=schemas.Listing)
def add_listing(provider_id: int, listing: schemas.ListingCreate, db: Session = Depends(get_db)):
    return service.create_listing(db, listing, provider_id)


@router.get("/listings/", response_model=List[schemas.Listing])
def list_listings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Simple list of all active listings
    return service.get_all_listings(db, skip, limit)

@router.get("/search", response_model=List[schemas.Provider])
def search_services(lat: float, lon: float, radius_km: float = 10, db: Session = Depends(get_db)):
    return service.search_providers(db, lat, lon, radius_km)
