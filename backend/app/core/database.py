from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import sys

# Determine DB Type for logging
db_url = settings.DATABASE_URL
print(f"🐘 Using Database: PostgreSQL ({'Production' if not settings.DEV else 'Development'})")

try:
    engine = create_engine(
        db_url, 
        pool_pre_ping=True  # Good for Postgres to handle dropped connections
    )
except Exception as e:
    print(f"❌ Database Connection Error: {e}")
    sys.exit(1)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
