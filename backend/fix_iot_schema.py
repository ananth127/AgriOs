import sys
import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_schema():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # 1. Add columns to farm_assets
        # Check if columns exist first? Or just try-catch adding them.
        
        # iot_settings
        try:
            print("Adding iot_settings to farm_assets...")
            if 'sqlite' in settings.DATABASE_URL:
                 conn.execute(text("ALTER TABLE farm_assets ADD COLUMN iot_settings JSON;"))
            else:
                 conn.execute(text("ALTER TABLE farm_assets ADD COLUMN iot_settings JSONB;")) # Postgres uses JSONB usually
            print("Added iot_settings.")
        except Exception as e:
            print(f"iot_settings might already exist: {e}")

        # iot_device_id
        try:
            print("Adding iot_device_id to farm_assets...")
            conn.execute(text("ALTER TABLE farm_assets ADD COLUMN iot_device_id VARCHAR;"))
            print("Added iot_device_id.")
        except Exception as e:
            print(f"iot_device_id might already exist: {e}")

        # is_iot_enabled (Might be missing if I just added it?)
        try:
            print("Adding is_iot_enabled to farm_assets...")
            if 'sqlite' in settings.DATABASE_URL:
                conn.execute(text("ALTER TABLE farm_assets ADD COLUMN is_iot_enabled BOOLEAN DEFAULT 0;"))
            else:
                conn.execute(text("ALTER TABLE farm_assets ADD COLUMN is_iot_enabled BOOLEAN DEFAULT FALSE;"))
            print("Added is_iot_enabled.")
        except Exception as e:
            print(f"is_iot_enabled might already exist: {e}")

        # 2. Add columns to iot_devices
        # asset_type
        try:
            print("Adding asset_type to iot_devices...")
            conn.execute(text("ALTER TABLE iot_devices ADD COLUMN asset_type VARCHAR DEFAULT 'Device';"))
            print("Added asset_type.")
        except Exception as e:
            print(f"asset_type might already exist: {e}")

        conn.commit()
        print("Schema update completed.")

if __name__ == "__main__":
    fix_schema()
