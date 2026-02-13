import time
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from . import models, schemas, service

# Uses /api/v1/auth/login as token URL (OAuth2 standard)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Simple in-memory cache: email -> (user_id, timestamp)
# Avoids DB hit on every authenticated request during polling
_user_cache: dict[str, tuple[int, float]] = {}
_USER_CACHE_TTL = 0  # Disabled for immediate updates

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception

    # Check cache first
    cached = _user_cache.get(token_data.email)
    if cached:
        user_id, ts = cached
        if time.time() - ts < _USER_CACHE_TTL:
            user = db.query(models.User).get(user_id)
            if user:
                return user

    # Cache miss — full lookup
    # Use get_user_by_login_id to support email/phone/unique_id stored in token 'sub'
    user = service.get_user_by_login_id(db, identifier=token_data.email)
    if user is None:
        raise credentials_exception

    _user_cache[token_data.email] = (user.id, time.time())
    return user


def get_current_user_id(user: models.User = Depends(get_current_user)) -> int:
    return user.id
