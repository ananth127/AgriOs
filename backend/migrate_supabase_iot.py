"""
Add IoT Device Columns to PostgreSQL (Supabase)
This adds status and last_telemetry columns to the iot_devices table
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
import psycopg2

# Use the actual DATABASE_URL from .env
DATABASE_URL = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print("=" * 70)
print("POSTGRESQL (SUPABASE) MIGRATION FOR IOT DEVICES")
print("=" * 70)
print(f"\nConnecting to Supabase PostgreSQL...")
print("This will add 'status' and 'last_telemetry' columns to iot_devices table")
print("\nPress Enter to continue or Ctrl+C to cancel...")
input()

try:
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check current schema
        print("\n[1/5] Checking current table structure...")
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'iot_devices'
            ORDER BY ordinal_position
        """))
        columns = [row[0] for row in result]
        print(f"Current columns ({len(columns)}): {', '.join(columns)}")
        
        # Add status column if missing
        if 'status' not in columns:
            print("\n[2/5] Adding 'status' column...")
            try:
                conn.execute(text("ALTER TABLE iot_devices ADD COLUMN status VARCHAR DEFAULT 'IDLE'"))
                conn.commit()
                print("  SUCCESS: status column added")
            except Exception as e:
                if 'already exists' in str(e):
                    print("  INFO: status column already exists")
                else:
                    raise
        else:
            print("\n[2/5] status column already exists")
        
        # Add last_telemetry column if missing
        if 'last_telemetry' not in columns:
            print("\n[3/5] Adding 'last_telemetry' column...")
            try:
                conn.execute(text("ALTER TABLE iot_devices ADD COLUMN last_telemetry JSONB DEFAULT '{}'::jsonb"))
                conn.commit()
                print("  SUCCESS: last_telemetry column added")
            except Exception as e:
                if 'already exists' in str(e):
                    print("  INFO: last_telemetry column already exists")
                else:
                    raise
        else:
            print("\n[3/5] last_telemetry column already exists")
        
        # Verify final schema
        print("\n[4/5] Verifying final structure...")
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'iot_devices'
            ORDER BY ordinal_position
        """))
        final_columns = [row[0] for row in result]
        print(f"Final columns ({len(final_columns)}): {', '.join(final_columns)}")
        
        # Check if columns are there
        if 'status' in final_columns and 'last_telemetry' in final_columns:
            print("  SUCCESS: Both columns are present!")
        else:
            print("  WARNING: Some columns may be missing")
        
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
            if sample:
                print(f"\nSample device:")
                print(f"  ID: {sample[0]}")
                print(f"  Name: {sample[1]}")
                print(f"  Type: {sample[2]}")
                print(f"  Status: {sample[3]}")
                print(f"  Telemetry: {sample[4]}")
        else:
            print("\n  INFO: No devices found. Run seed_iot_devices.py to add demo data.")
    
    print("\n" + "=" * 70)
    print("SUCCESS: Migration completed!")
    print("\nNext steps:")
    print("1. If no devices exist, seed them:")
    print("   python seed_iot_devices.py")
    print("2. Start the backend server:")
    print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("3. Open http://localhost:3000/en/smart-monitor")
    print("=" * 70)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    print("\nTroubleshooting:")
    print("1. Check if Supabase database is accessible")
    print("2. Verify DATABASE_URL in .env is correct")
    print("3. Ensure you have network connectivity")
    print("4. Check if iot_devices table exists")
