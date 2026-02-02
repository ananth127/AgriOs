"""
Check what devices are actually in the Supabase database
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print("=" * 70)
print("CHECKING IOT DEVICES IN SUPABASE")
print("=" * 70)

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Get all devices
        result = conn.execute(text("""
            SELECT id, name, asset_type, status, is_online, last_telemetry
            FROM iot_devices
            ORDER BY id
        """))
        
        devices = result.fetchall()
        
        print(f"\nTotal devices: {len(devices)}\n")
        
        for device in devices:
            print(f"ID: {device[0]}")
            print(f"  Name: {device[1]}")
            print(f"  Type: {device[2]}")
            print(f"  Status: {device[3]}")
            print(f"  Online: {device[4]}")
            print(f"  Telemetry: {device[5]}")
            print()
        
        # Count by type
        result = conn.execute(text("""
            SELECT asset_type, COUNT(*) as count
            FROM iot_devices
            GROUP BY asset_type
            ORDER BY asset_type
        """))
        
        print("\nDevices by type:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
