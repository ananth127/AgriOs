import os
import sys

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from load_env import load_env_with_decryption
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_real_db():
    print("Loading environment using APP logic...")
    # This loads env vars into os.environ just like the app does
    load_env_with_decryption()
    
    # Now settings.DATABASE_URL might still be the default because settings object was instantiated at import time
    # We must re-instantiate or just grab from os.environ
    
    real_db_url = os.getenv("DATABASE_URL")
    print(f"Discovered DATABASE_URL: {real_db_url.split('@')[1] if real_db_url and '@' in real_db_url else real_db_url}")
    
    if not real_db_url:
        print("ERROR: Could not find DATABASE_URL in environment even after loading!")
        return

    engine = create_engine(real_db_url)
    
    with engine.connect() as conn:
        try:
            print("Applying schema changes...")
            
            # 1. asset_type in iot_devices
            try:
                conn.execute(text("ALTER TABLE iot_devices ADD COLUMN asset_type VARCHAR DEFAULT 'Device';"))
                print("Added asset_type to iot_devices.")
            except Exception as e:
                print(f"asset_type warning: {e}")

            # 2. iot_settings in farm_assets
            try:
                conn.execute(text("ALTER TABLE farm_assets ADD COLUMN iot_settings JSONB;")) # PG uses JSONB
                print("Added iot_settings to farm_assets.")
            except Exception as e:
                print(f"iot_settings warning: {e}")

            # 3. iot_device_id in farm_assets
            try:
                 conn.execute(text("ALTER TABLE farm_assets ADD COLUMN iot_device_id VARCHAR;"))
                 print("Added iot_device_id to farm_assets.")
            except Exception as e:
                 print(f"iot_device_id warning: {e}")
                 
            # 4. is_iot_enabled in farm_assets
            try:
                 conn.execute(text("ALTER TABLE farm_assets ADD COLUMN is_iot_enabled BOOLEAN DEFAULT FALSE;"))
                 print("Added is_iot_enabled to farm_assets.")
            except Exception as e:
                 print(f"is_iot_enabled warning: {e}")

            conn.commit()
            print("Done committing changes.")
        except Exception as e:
            print(f"Critical Error: {e}")

if __name__ == "__main__":
    fix_real_db()
