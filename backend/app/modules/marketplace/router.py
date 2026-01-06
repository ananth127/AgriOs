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

# Mock User ID dependency
def get_current_user_id():
    return 1

# --- Service Providers ---
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

# --- Product Listings (Crops/Livestock) ---
@router.post("/products", response_model=schemas.ProductListing)
def create_product_listing(listing: schemas.ProductListingCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return service.create_product_listing(db, listing, user_id)

@router.get("/products/", response_model=List[schemas.ProductListing])
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.get_all_product_listings(db, skip, limit)

@router.get("/search", response_model=List[schemas.Provider])
def search_services(lat: float, lon: float, radius_km: float = 10, db: Session = Depends(get_db)):
    return service.search_providers(db, lat, lon, radius_km)

@router.put("/products/{product_id}", response_model=schemas.ProductListing)
def update_product_listing(product_id: int, listing_update: schemas.ProductListingCreate, db: Session = Depends(get_db)):
    # Mock authorization check
    product = db.query(service.ProductListing).filter(service.ProductListing.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in listing_update.dict().items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}")
def delete_product_listing(product_id: int, db: Session = Depends(get_db)):
    # Mock authorization check
    product = db.query(service.ProductListing).filter(service.ProductListing.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}
