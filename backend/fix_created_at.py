"""
Fix missing created_at timestamps for IoT devices
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from datetime import datetime

DATABASE_URL = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print("=" * 70)
print("FIXING MISSING CREATED_AT TIMESTAMPS")
print("=" * 70)

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check devices without created_at
        result = conn.execute(text("""
            SELECT id, name, created_at 
            FROM iot_devices 
            WHERE created_at IS NULL
        """))
        
        devices = result.fetchall()
        print(f"\nFound {len(devices)} devices without created_at timestamp")
        
        if len(devices) > 0:
            # Update all devices without created_at to current timestamp
            result = conn.execute(text("""
                UPDATE iot_devices 
                SET created_at = NOW() 
                WHERE created_at IS NULL
            """))
            
            conn.commit()
            updated = result.rowcount
            print(f"Updated {updated} devices with current timestamp")
        
        # Verify
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM iot_devices 
            WHERE created_at IS NULL
        """))
        
        null_count = result.scalar()
        print(f"\nVerification: {null_count} devices still have NULL created_at")
        
        if null_count == 0:
            print("SUCCESS: All devices now have created_at timestamps!")
        else:
            print("WARNING: Some devices still missing timestamps")
        
        # Show sample
        result = conn.execute(text("""
            SELECT id, name, created_at 
            FROM iot_devices 
            ORDER BY id 
            LIMIT 3
        """))
        
        print("\nSample devices:")
        for row in result:
            print(f"  ID {row[0]}: {row[1]} - Created: {row[2]}")
        
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()

print("=" * 70)
print("\nNext: Restart the backend server to see the devices!")
print("=" * 70)
