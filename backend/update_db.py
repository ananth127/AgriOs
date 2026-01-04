
import os
import sys

# Force DEV=false to use plain .env file and avoid password prompt
os.environ["DEV"] = "false"

try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except ImportError:
    print("Warning: Could not import load_env.py")

from sqlalchemy import text, inspect
from app.core.database import engine
from sqlalchemy.orm import sessionmaker

def run_migrations():
    print("Checking database schema...")
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('users')]
    
    with engine.connect() as conn:
        if 'latitude' not in columns:
            print("Adding latitude column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN latitude FLOAT"))
        
        if 'longitude' not in columns:
            print("Adding longitude column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN longitude FLOAT"))
            
        if 'location_name' not in columns:
            print("Adding location_name column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN location_name VARCHAR"))
            
        if 'phone_number' not in columns:
            print("Adding phone_number column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR"))

        conn.commit()
    print("Database schema updated successfully.")

if __name__ == "__main__":
    try:
        run_migrations()
    except Exception as e:
        print(f"Migration failed: {e}")
