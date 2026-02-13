from sqlalchemy.orm import Session
from sqlalchemy import or_
import random
import string
from . import models, schemas, utils

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_login_id(db: Session, identifier: str):
    return db.query(models.User).filter(
        or_(
            models.User.email == identifier,
            models.User.phone_number == identifier,
            models.User.unique_id == identifier
        )
    ).first()

def generate_unique_id():
    """Generate a random 12-digit ID string."""
    return ''.join(random.choices(string.digits, k=12))

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = utils.get_password_hash(user.password)
    
    # Validate Location Uniqueness
    if user.latitude and user.longitude:
        _check_location_conflict(db, user.latitude, user.longitude)

    while True:
        unique_id = generate_unique_id()
        if not db.query(models.User).filter(models.User.unique_id == unique_id).first():
            break

    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        unique_id=unique_id,
        phone_number=user.phone_number,
        latitude=user.latitude,
        longitude=user.longitude,
        location_name=user.location_name,
        survey_number=user.survey_number,
        boundary=user.boundary
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, identifier: str, password: str):
    user = get_user_by_login_id(db, identifier)
    if not user:
        return None
    if not utils.verify_password(password, user.hashed_password):
        return None
    return user

def _check_location_conflict(db: Session, lat: float, lng: float, exclude_user_id: int = None):
    if lat is None or lng is None:
        return
    # Check for any user within ~11 meters (0.0001 degrees)
    EPSILON = 0.0001
    query = db.query(models.User).filter(
        models.User.latitude.between(lat - EPSILON, lat + EPSILON),
        models.User.longitude.between(lng - EPSILON, lng + EPSILON)
    )
    if exclude_user_id:
        query = query.filter(models.User.id != exclude_user_id)
    
    conflict = query.first()
    if conflict:
        raise ValueError(f"Location is already claimed by another user ({conflict.location_name or 'Unknown'}). Please choose a different spot.")

def update_user(db: Session, current_user: models.User, user_update: schemas.UserUpdate):
    update_data = user_update.dict(exclude_unset=True)
    
    # Validate Location Uniqueness if location is changing
    if 'latitude' in update_data and 'longitude' in update_data:
        _check_location_conflict(db, update_data['latitude'], update_data['longitude'], current_user.id)
        
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
