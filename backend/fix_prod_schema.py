import os
from sqlalchemy import create_engine, text
from app.core.config import settings
# Manually load env if needed, or rely on os.environ being set by usage context
# But for script, we should probably source .env
from dotenv import load_dotenv

load_dotenv()

def fix_prod_db():
    # Force use of postgres if available in env, else use settings default
    db_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    print(f"Connecting to: {db_url.split('@')[1] if '@' in db_url else db_url} ...") 
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        try:
            print("Applying schema changes to potentially Production DB...")
            # iot_devices.asset_type
            try:
                conn.execute(text("ALTER TABLE iot_devices ADD COLUMN asset_type VARCHAR DEFAULT 'Device';"))
                print("Added asset_type to iot_devices.")
            except Exception as e:
                print(f"asset_type error: {e}")
                
            # farm_assets.iot_settings
            try:
                conn.execute(text("ALTER TABLE farm_assets ADD COLUMN iot_settings JSONB;")) # PG uses JSONB
                print("Added iot_settings to farm_assets.")
            except Exception as e:
                print(f"iot_settings error: {e}")

            conn.commit()
            print("Done.")
        except Exception as e:
            print(f"Critical Error: {e}")

if __name__ == "__main__":
    fix_prod_db()
