from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

def create_provider(db: Session, provider: schemas.ProviderCreate, user_id: int):
    # Create Point geometry structure: 'POINT(lon lat)'
    point_wkt = f'POINT({provider.longitude} {provider.latitude})'
    
    db_provider = models.ServiceProvider(
        user_id=user_id,
        business_name=provider.business_name,
        description=provider.description,
        phone_number=provider.phone_number,
        location=point_wkt
    )
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider

def create_listing(db: Session, listing: schemas.ListingCreate, provider_id: int):
    db_listing = models.ServiceListing(
        **listing.model_dump(),
        provider_id=provider_id
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return db_listing

def get_all_listings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ServiceListing).filter(models.ServiceListing.is_active == True).offset(skip).limit(limit).all()

def search_providers(db: Session, lat: float, lon: float, radius_km: float = 50):
    # Example logic using GeoAlchemy2
    # In real PostGIS: ST_DWithin(location, POINT(lon, lat), radius_in_meters, use_spheroid=False)
    # Note: ST_DWithin arguments are in meters if using geography or if projection allows. 
    # For SRID 4326 (degrees), strictly DWithin checks degrees. 
    # Usually we cast to Geography for meters comparison:
    # filter(func.ST_DWithin(models.ServiceProvider.location.cast(Geography), point, radius_meters))
    
    # For this scaffold, we return all as strict Geo query requires PostGIS runtime.
    # We will assume logic is correct for future.
    return db.query(models.ServiceProvider).all()
