"""
Verification script to check Smart Monitor setup
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.modules.iot.models import IoTDevice

def verify_setup():
    """Verify all components are correctly set up"""
    db = SessionLocal()
    
    print("=" * 70)
    print("SMART MONITOR SETUP VERIFICATION")
    print("=" * 70)
    print()
    
    try:
        # 1. Check database type
        db_name = engine.dialect.name
        print(f"[1/5] Database Type: {db_name}")
        print()
        
        # 2. Check table structure
        print("[2/5] Checking table structure...")
        with engine.connect() as conn:
            if db_name == 'sqlite':
                result = conn.execute(text("PRAGMA table_info(iot_devices)"))
                columns = [row[1] for row in result]
            else:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'iot_devices'
                """))
                columns = [row[0] for row in result]
        
        required_columns = ['status', 'last_telemetry']
        missing_columns = [col for col in required_columns if col not in columns]
        
        if missing_columns:
            print(f"  ERROR: Missing columns: {missing_columns}")
            print(f"  Run: python migrate_iot_devices.py")
            return False
        else:
            print(f"  OK: All required columns present")
            print(f"  Columns: {', '.join(columns)}")
        print()
        
        # 3. Check device count
        print("[3/5] Checking seeded devices...")
        device_count = db.query(IoTDevice).count()
        print(f"  Total devices: {device_count}")
        
        if device_count == 0:
            print(f"  WARNING: No devices found!")
            print(f"  Run: python seed_iot_devices.py")
        else:
            # Show breakdown by type
            with engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT asset_type, COUNT(*) as count 
                    FROM iot_devices 
                    GROUP BY asset_type
                """))
                print(f"  Breakdown:")
                for row in result:
                    print(f"    - {row[0]}: {row[1]} devices")
        print()
        
        # 4. Check sample device data
        print("[4/5] Checking sample device...")
        sample = db.query(IoTDevice).first()
        if sample:
            print(f"  Sample Device:")
            print(f"    Name: {sample.name}")
            print(f"    Type: {sample.asset_type}")
            print(f"    Status: {sample.status}")
            print(f"    Online: {sample.is_online}")
            print(f"    Telemetry: {sample.last_telemetry}")
        else:
            print(f"  No devices to sample")
        print()
        
        # 5. Final checklist
        print("[5/5] Setup Checklist:")
        checks = [
            ("Database columns migrated", not missing_columns),
            ("Devices seeded", device_count > 0),
            ("Sample device has telemetry", sample and sample.last_telemetry),
        ]
        
        all_passed = True
        for check_name, passed in checks:
            status = "PASS" if passed else "FAIL"
            symbol = "✓" if passed else "✗"
            print(f"  [{status}] {check_name}")
            if not passed:
                all_passed = False
        
        print()
        print("=" * 70)
        
        if all_passed:
            print("SUCCESS: All checks passed!")
            print()
            print("Next Steps:")
            print("1. RESTART the backend server (CRITICAL!)")
            print("   - Stop current server (Ctrl+C)")
            print("   - Run: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
            print()
            print("2. Test the API endpoint:")
            print("   http://localhost:8000/api/v1/iot/devices")
            print()
            print("3. Open Smart Monitor:")
            print("   http://localhost:3000/en/smart-monitor")
        else:
            print("FAILED: Some checks did not pass")
            print("Please review the errors above and run the suggested commands")
        
        print("=" * 70)
        
        return all_passed
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    verify_setup()
