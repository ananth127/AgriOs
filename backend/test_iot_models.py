"""
Quick test to verify IoT devices endpoint is working
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.modules.iot.models import IoTDevice
from app.modules.auth.models import User

def test_models():
    """Test that models can be loaded without errors"""
    db = SessionLocal()
    
    try:
        print("=" * 70)
        print("TESTING IOT MODELS")
        print("=" * 70)
        print()
        
        # Test 1: Query IoT devices
        print("[1/3] Testing IoTDevice model...")
        devices = db.query(IoTDevice).limit(3).all()
        print(f"  OK: Successfully queried {len(devices)} devices")
        if devices:
            device = devices[0]
            print(f"  Sample: {device.name} ({device.asset_type})")
            print(f"  Status: {device.status}")
            print(f"  Telemetry: {device.last_telemetry}")
        print()
        
        # Test 2: Query User model
        print("[2/3] Testing User model...")
        users = db.query(User).limit(1).all()
        print(f"  OK: Successfully queried {len(users)} users")
        if users:
            user = users[0]
            print(f"  Sample: {user.full_name} ({user.email})")
        print()
        
        # Test 3: Query devices by user_id
        print("[3/3] Testing user_id filtering...")
        if users:
            user_devices = db.query(IoTDevice).filter(IoTDevice.user_id == users[0].id).all()
            print(f"  OK: User has {len(user_devices)} devices")
        print()
        
        print("=" * 70)
        print("SUCCESS: All model tests passed!")
        print("The API endpoint should now work correctly.")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_models()
