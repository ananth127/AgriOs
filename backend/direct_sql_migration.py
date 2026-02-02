"""
Direct SQL migration - Run this with server STOPPED
"""

import sqlite3
import os

# Path to database
db_path = os.path.join(os.path.dirname(__file__), "agrios_dev.db")

print("=" * 70)
print("DIRECT SQL MIGRATION FOR IOT DEVICES")
print("=" * 70)
print(f"\nDatabase: {db_path}")
print("\nWARNING: Make sure the backend server is STOPPED before running this!")
input("Press Enter to continue or Ctrl+C to cancel...")

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current schema
    print("\n[1/4] Checking current table structure...")
    cursor.execute("PRAGMA table_info(iot_devices)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Current columns: {', '.join(columns)}")
    
    # Add status column if missing
    if 'status' not in columns:
        print("\n[2/4] Adding 'status' column...")
        cursor.execute("ALTER TABLE iot_devices ADD COLUMN status VARCHAR DEFAULT 'IDLE'")
        conn.commit()
        print("  -> status column added")
    else:
        print("\n[2/4] status column already exists")
    
    # Add last_telemetry column if missing
    if 'last_telemetry' not in columns:
        print("\n[3/4] Adding 'last_telemetry' column...")
        cursor.execute("ALTER TABLE iot_devices ADD COLUMN last_telemetry TEXT DEFAULT '{}'")
        conn.commit()
        print("  -> last_telemetry column added")
    else:
        print("\n[3/4] last_telemetry column already exists")
    
    # Verify final schema
    print("\n[4/4] Verifying final structure...")
    cursor.execute("PRAGMA table_info(iot_devices)")
    final_columns = [row[1] for row in cursor.fetchall()]
    print(f"Final columns: {', '.join(final_columns)}")
    
    # Check device count
    cursor.execute("SELECT COUNT(*) FROM iot_devices")
    count = cursor.fetchone()[0]
    print(f"\nTotal devices in database: {count}")
    
    if count > 0:
        # Show sample device
        cursor.execute("SELECT id, name, asset_type, status, last_telemetry FROM iot_devices LIMIT 1")
        sample = cursor.fetchone()
        print(f"\nSample device:")
        print(f"  ID: {sample[0]}")
        print(f"  Name: {sample[1]}")
        print(f"  Type: {sample[2]}")
        print(f"  Status: {sample[3]}")
        print(f"  Telemetry: {sample[4]}")
    
    conn.close()
    
    print("\n" + "=" * 70)
    print("SUCCESS: Migration completed!")
    print("\nNext steps:")
    print("1. Start the backend server")
    print("2. Open http://localhost:3000/en/smart-monitor")
    print("3. You should see your devices!")
    print("=" * 70)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    print("\nMake sure:")
    print("1. The backend server is STOPPED")
    print("2. The database file exists")
    print("3. You have write permissions")
