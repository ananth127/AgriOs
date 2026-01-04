import sys
from sqlalchemy import create_engine, text

# 1. Load Environment Variables FIRST
try:
    from load_env import load_env_with_decryption
except ImportError:
    # Fallback if run directly from backend folder
    sys.path.append('.')
    from load_env import load_env_with_decryption

print("🔐 Loading environment variables...")
load_env_with_decryption()

# 2. Import settings AFTER env vars are loaded
from app.core.config import settings

def enable_postgis():
    db_url = settings.DATABASE_URL
    print(f"DEBUG: Configured DB URL: {db_url}")
    
    if "sqlite" in db_url:
        print("⚠️  You are using SQLite.")
        print("   SQLite/SpatiaLite usually doesn't need 'CREATE EXTENSION'.")
        print("   If you are testing locally, this step is skipped.")
        return

    print(f"🐘 Connecting to PostgreSQL: {db_url.split('@')[1] if '@' in db_url else '...'}")

    try:
        # Create engine
        # We need auto-commit mode for CREATE EXTENSION
        engine = create_engine(db_url, isolation_level="AUTOCOMMIT")
        
        with engine.connect() as connection:
            print("🛠️  Running: CREATE EXTENSION IF NOT EXISTS postgis;")
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            print("✅ PostGIS Extension Enabled Successfully!")
            
    except Exception as e:
        print(f"❌ Failed to enable PostGIS: {e}")
        print("\nPossible reasons:")
        print("1. Connection failed (check password/host)")
        print("2. User doesn't have permission (needs superuser)")
        print("3. Database is already set up")

if __name__ == "__main__":
    enable_postgis()
