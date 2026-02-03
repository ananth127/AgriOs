"""
Debug: Check users and their devices
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print("=" * 70)
print("DEBUGGING: USERS AND DEVICES")
print("=" * 70)

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Get all users
        print("\n[1] All Users:")
        result = conn.execute(text("SELECT id, email, full_name FROM users"))
        users = result.fetchall()
        for user in users:
            print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
        
        # Get all devices with user info
        print("\n[2] All Devices:")
        result = conn.execute(text("""
            SELECT d.id, d.name, d.asset_type, d.user_id, u.full_name
            FROM iot_devices d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.id
        """))
        devices = result.fetchall()
        for device in devices:
            print(f"  ID: {device[0]}, Name: {device[1]}, Type: {device[2]}, User ID: {device[3]}, User: {device[4]}")
        
        print(f"\nTotal: {len(devices)} devices")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
