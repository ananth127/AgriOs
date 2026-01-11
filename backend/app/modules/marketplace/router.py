from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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

# --- Product Listings (Crops/Livestock/Machinery) ---
@router.post("/products", response_model=schemas.ProductListing)
def create_product_listing(listing: schemas.ProductListingCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return service.create_product_listing(db, listing, user_id)

@router.get("/products/", response_model=List[schemas.ProductListing])
def list_products(
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = Query(None),
    listing_type: Optional[str] = Query(None, description="SELL, BUY, RENT"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Ensure dummy data exists
    service.seed_dummy_listings(db)
    
    return service.get_all_product_listings(db, skip, limit, category, listing_type, search)

@router.get("/search", response_model=List[schemas.Provider])
def search_services(lat: float, lon: float, radius_km: float = 10, db: Session = Depends(get_db)):
    return service.search_providers(db, lat, lon, radius_km)

@router.put("/products/{product_id}", response_model=schemas.ProductListing)
def update_product_listing(product_id: int, listing_update: schemas.ProductListingCreate, db: Session = Depends(get_db)):
    # Mock authorization check
    product = db.query(service.models.ProductListing).filter(service.models.ProductListing.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in listing_update.model_dump().items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}")
def delete_product_listing(product_id: int, db: Session = Depends(get_db)):
    # Mock authorization check
    product = db.query(service.models.ProductListing).filter(service.models.ProductListing.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

# --- Transactions ---
@router.post("/orders", response_model=schemas.Order)
def place_order(order: schemas.OrderCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    try:
        return service.create_order(db, order, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Commercial Products (Contextual Commerce/Retail) ---
@router.get("/commercial-products", response_model=List[schemas.CommercialProductDTO])
def search_commercial_products(
    ingredient: Optional[str] = None, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Search for commercial products (Pesticides, Fertilizers, Seeds)
    """
    # Auto-seed if empty
    service.seed_commercial_products(db)
    
    return service.search_commercial_products(db, ingredient, category)
