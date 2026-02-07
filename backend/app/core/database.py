from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import sys

# Determine DB Type for logging
db_url = settings.DATABASE_URL
print(f"Using Database: PostgreSQL ({'Production' if not settings.DEV else 'Development'})")

try:
    engine = create_engine(
        db_url, 
        pool_pre_ping=True,  # Good for Postgres to handle dropped connections
        pool_size=5,  # Maximum number of permanent connections
        max_overflow=10,  # Maximum number of connections that can be created beyond pool_size
        pool_timeout=30,  # Seconds to wait before giving up on getting a connection
        pool_recycle=3600  # Recycle connections after 1 hour
    )
except Exception as e:
    print(f"Database Connection Error: {e}")
    sys.exit(1)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
