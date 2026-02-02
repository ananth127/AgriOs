"""
PostgreSQL Migration for IoT Devices
Run this with server STOPPED
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

print("=" * 70)
print("POSTGRESQL MIGRATION FOR IOT DEVICES")
print("=" * 70)
print(f"\nDatabase URL: {settings.DATABASE_URL[:50]}...")
print("\nWARNING: Make sure the backend server is STOPPED before running this!")
input("Press Enter to continue or Ctrl+C to cancel...")

try:
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check current schema
        print("\n[1/5] Checking current table structure...")
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'iot_devices'
        """))
        columns = [row[0] for row in result]
        print(f"Current columns: {', '.join(columns)}")
        
        # Add status column if missing
        if 'status' not in columns:
            print("\n[2/5] Adding 'status' column...")
            conn.execute(text("ALTER TABLE iot_devices ADD COLUMN status VARCHAR DEFAULT 'IDLE'"))
            conn.commit()
            print("  -> status column added")
        else:
            print("\n[2/5] status column already exists")
        
        # Add last_telemetry column if missing
        if 'last_telemetry' not in columns:
            print("\n[3/5] Adding 'last_telemetry' column...")
            conn.execute(text("ALTER TABLE iot_devices ADD COLUMN last_telemetry JSONB DEFAULT '{}'"))
            conn.commit()
            print("  -> last_telemetry column added")
        else:
            print("\n[3/5] last_telemetry column already exists")
        
        # Verify final schema
        print("\n[4/5] Verifying final structure...")
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'iot_devices'
        """))
        final_columns = [row[0] for row in result]
        print(f"Final columns: {', '.join(final_columns)}")
        
        # Check device count
        print("\n[5/5] Checking device count...")
        result = conn.execute(text("SELECT COUNT(*) FROM iot_devices"))
        count = result.scalar()
        print(f"Total devices in database: {count}")
        
        if count > 0:
            # Show sample device
            result = conn.execute(text("""
                SELECT id, name, asset_type, status, last_telemetry 
                FROM iot_devices 
                LIMIT 1
            """))
            sample = result.fetchone()
            print(f"\nSample device:")
            print(f"  ID: {sample[0]}")
            print(f"  Name: {sample[1]}")
            print(f"  Type: {sample[2]}")
            print(f"  Status: {sample[3]}")
            print(f"  Telemetry: {sample[4]}")
    
    print("\n" + "=" * 70)
    print("SUCCESS: Migration completed!")
    print("\nNext steps:")
    print("1. Start the backend server:")
    print("   cd backend")
    print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("2. Open http://localhost:3000/en/smart-monitor")
    print("3. You should see your devices!")
    print("=" * 70)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    print("\nMake sure:")
    print("1. The backend server is STOPPED")
    print("2. PostgreSQL is running")
    print("3. Database credentials are correct in .env")
