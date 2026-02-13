from sqlalchemy import text
from app.core import database

def migrate():
    with database.engine.connect() as connection:
        trans = connection.begin()
        try:
            # Add columns if they don't exist
            connection.execute(text("ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS parent_device_id INTEGER REFERENCES iot_devices(id);"))
            connection.execute(text("ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;"))
            connection.execute(text("ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS total_runtime_minutes FLOAT DEFAULT 0.0;"))
            connection.execute(text("ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS current_run_start_time TIMESTAMP;"))
            connection.execute(text("ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS target_turn_off_at TIMESTAMP;"))
            
            trans.commit()
            print("Migration successful: Added smart columns to iot_devices")
        except Exception as e:
            trans.rollback()
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
