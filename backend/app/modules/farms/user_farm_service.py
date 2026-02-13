"""
Service to ensure each user has their own default farm
"""
from sqlalchemy.orm import Session
from . import models, service

def get_or_create_user_farm(db: Session, user_id: int) -> models.FarmTable:
    """
    Get the user's primary farm, or create one if they don't have any.
    This ensures every user has at least one farm to work with.
    """
    # Check if user already has a farm
    existing_farm = db.query(models.FarmTable).filter(
        models.FarmTable.owner_id == user_id
    ).first()
    
    if existing_farm:
        return existing_farm
    
    # Create a default farm for this user
    from . import schemas
    
    # Simple default geometry (a small square)
    default_geometry = "POLYGON((0 0, 0 0.001, 0.001 0.001, 0.001 0, 0 0))"
    
    farm_data = schemas.FarmCreate(
        name=f"My Farm",
        owner_id=user_id,
        geometry=default_geometry,
        soil_profile={"type": "Not specified"}
    )
    
    new_farm = service.create_farm(db, farm_data)
    print(f"✓ Created default farm (ID: {new_farm.id}) for user {user_id}")
    
    return new_farm
