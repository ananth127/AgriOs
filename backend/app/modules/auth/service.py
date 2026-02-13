from sqlalchemy.orm import Session
from sqlalchemy import or_
import random
import string
import requests
from . import models, schemas, utils

# Mapping ISO country codes to 2-digit prefixes (mostly phone codes)
COUNTRY_PHONE_CODES = {
    'in': '91', 'us': '01', 'ca': '01', 'gb': '44', 'au': '61',
    'de': '49', 'fr': '33', 'br': '55', 'cn': '86', 'jp': '81',
    'ru': '07', 'za': '27', 'mx': '52', 'it': '39', 'es': '34',
    'pk': '92', 'bd': '88', 'id': '62', 'ng': '23', 'eg': '20',
    'tr': '90', 'ir': '98', 'vn': '84', 'ph': '63', 'th': '66',
    'lk': '94', 'np': '97', 'my': '60', 'kr': '82', 'sa': '96'
}

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

def _get_country_prefix(lat: float, lon: float) -> str:
    """Determine 2-digit country code from coordinates."""
    try:
        if not lat or not lon:
            return "00"
            
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        # Important: User-Agent is required by OSM Nominatim policy
        headers = {'User-Agent': 'AgriOS-Backend/1.0'}
        # Short timeout to avoid hanging registration
        resp = requests.get(url, headers=headers, timeout=3)
        
        if resp.status_code == 200:
            data = resp.json()
            cc = data.get('address', {}).get('country_code', '').lower()
            return COUNTRY_PHONE_CODES.get(cc, '99') # 99 for unknown country
            
    except Exception as e:
        print(f"Geo-lookup failed: {e}")
        pass
        
    return "00" # Default/Fallback

def generate_unique_id(lat: float = None, lon: float = None, phone_number: str = None):
    """Generate a 12-digit ID: 2-digit Country Code + 10 digit Phone Number (or random)."""
    prefix = _get_country_prefix(lat, lon)
    
    if phone_number:
        # Extract only digits
        clean_phone = ''.join(filter(str.isdigit, phone_number))
        
        # We need 10 digits for the suffix to make 12 total
        if len(clean_phone) >= 10:
            suffix = clean_phone[-10:]
        else:
            # If phone is short (unlikely for valid mobile), pad with leading zeros
            suffix = clean_phone.zfill(10)
    else:
        suffix = ''.join(random.choices(string.digits, k=10))
        
    return f"{prefix}{suffix}"

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = utils.get_password_hash(user.password)
    
    # Validate Location Uniqueness
    if user.latitude and user.longitude:
        _check_location_conflict(db, user.latitude, user.longitude)

    while True:
        unique_id = generate_unique_id(user.latitude, user.longitude, user.phone_number)
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
