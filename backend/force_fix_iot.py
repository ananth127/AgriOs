from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_iot_table():
    print(f"Connecting to database to fix iot_devices...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if asset_type column exists
            print("Checking asset_type in iot_devices...")
            # We just try to add it. If it fails, we catch it.
            # Postgres: ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS asset_type VARCHAR DEFAULT 'Device';
            # But sqlalchemy text() doesn't always support IF NOT EXISTS depending on DB.
            # We'll just try ADD COLUMN and catch error.
            
            conn.execute(text("ALTER TABLE iot_devices ADD COLUMN asset_type VARCHAR DEFAULT 'Device';"))
            print("Added asset_type column.")
            conn.commit()
        except Exception as e:
            print(f"Error adding column (maybe exists): {e}")
            # If it failed, it might exist. But user error said "UndefinedColumn: column iot_devices.asset_type does not exist"
            # So it definitely FAILED to add previously?
            # Or maybe the previous script failed silently or targeted SQLite instead of Postgres?
            
        # Verify it exists now
        try:
            result = conn.execute(text("SELECT asset_type FROM iot_devices LIMIT 1;"))
            print("Verification: Column exists.")
        except Exception as e:
            print(f"Verification FAILED: {e}")

if __name__ == "__main__":
    fix_iot_table()
