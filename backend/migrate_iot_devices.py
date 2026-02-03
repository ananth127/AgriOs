"""
Proper migration for IoT devices table - PostgreSQL compatible
Adds status and last_telemetry columns
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, SessionLocal

def migrate_iot_table():
    """Add new columns to iot_devices table"""
    db = SessionLocal()
    
    try:
        with engine.connect() as conn:
            print("Checking iot_devices table structure...")
            
            # Detect database type
            db_name = engine.dialect.name
            print(f"Database type: {db_name}")
            
            # Get existing columns based on database type
            if db_name == 'sqlite':
                result = conn.execute(text("PRAGMA table_info(iot_devices)"))
                existing_columns = [row[1] for row in result]
            else:  # PostgreSQL
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'iot_devices'
                """))
                existing_columns = [row[0] for row in result]
            
            print(f"Existing columns: {existing_columns}")
            
            # Add status column if it doesn't exist
            if 'status' not in existing_columns:
                print("Adding 'status' column...")
                conn.execute(text("""
                    ALTER TABLE iot_devices 
                    ADD COLUMN status VARCHAR DEFAULT 'IDLE'
                """))
                conn.commit()
                print("  -> status column added")
            else:
                print("  -> status column already exists")
            
            # Add last_telemetry column if it doesn't exist
            if 'last_telemetry' not in existing_columns:
                print("Adding 'last_telemetry' column...")
                if db_name == 'sqlite':
                    # SQLite: Use TEXT for JSON
                    conn.execute(text("""
                        ALTER TABLE iot_devices 
                        ADD COLUMN last_telemetry TEXT DEFAULT '{}'
                    """))
                else:
                    # PostgreSQL: Use JSONB
                    conn.execute(text("""
                        ALTER TABLE iot_devices 
                        ADD COLUMN last_telemetry JSONB DEFAULT '{}'::jsonb
                    """))
                conn.commit()
                print("  -> last_telemetry column added")
            else:
                print("  -> last_telemetry column already exists")
            
            print("\nMigration completed successfully!")
            print("\nIMPORTANT: Please restart the backend server for changes to take effect!")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("IoT Devices Table Migration")
    print("=" * 60)
    migrate_iot_table()
