import sys
import os

# 1. Load Environment Variables BEFORE importing anything from app.*
# This prevents Pydantic Settings from crashing due to missing DATABASE_URL
try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
    print("✅ Environment variables loaded.")
except ImportError:
    print("⚠️  Could not load 'load_env'. Assuming env vars are already set.")
except Exception as e:
    print(f"⚠️  Error loading environment: {e}")

# 2. Now import app modules
try:
    from app.core.database import engine
    from sqlalchemy import text
except Exception as e:
    print(f"❌ Failed to import database engine: {e}")
    sys.exit(1)

def add_missing_column():
    print("Attempting to add missing 'filled_count' column to 'labor_jobs' table...")
    with engine.connect() as connection:
        try:
            # Postgres: ALTER TABLE labor_jobs ADD COLUMN IF NOT EXISTS filled_count INTEGER DEFAULT 0;
            statement = text("ALTER TABLE labor_jobs ADD COLUMN IF NOT EXISTS filled_count INTEGER DEFAULT 0;")
            connection.execute(statement)
            connection.commit()
            print("Successfully added 'filled_count' column.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_missing_column()
