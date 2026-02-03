"""
Seed IoT devices for Smart Monitor - PostgreSQL Compatible
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.modules.iot.models import IoTDevice
from app.modules.auth.models import User
import secrets

def seed_iot_devices():
    db = SessionLocal()
    
    try:
        # Get first user
        user = db.query(User).first()
        if not user:
            print("No users found. Please create a user first.")
            return
        
        print(f"Seeding devices for user: {user.full_name}")
        
        # Clear existing demo devices
        deleted = db.query(IoTDevice).filter(IoTDevice.hardware_id.like('DEMO-%')).delete()
        db.commit()
        print(f"Cleared {deleted} existing demo devices")
        
        # Seed diverse IoT devices
        devices = [
            # LIVESTOCK
            {
                "name": "Shelter A - Main Camera",
                "hardware_id": "DEMO-LS-CAM-001",
                "asset_type": "LIVESTOCK",
                "status": "ACTIVE",
                "is_online": True,
                "last_telemetry": {
                    "subType": "CAMERA",
                    "videoUrl": "https://cdn.coverr.co/videos/coverr-cow-eating-grass-in-the-field-5287/1080p.mp4",
                    "battery": 95,
                    "signal": 5
                },
                "config": {"location": "Barn A", "resolution": "1080p"}
            },
            {
                "name": "Shelter B - Feed Dispenser",
                "hardware_id": "DEMO-LS-FEED-001",
                "asset_type": "LIVESTOCK",
                "status": "ACTIVE",
                "is_online": True,
                "last_telemetry": {
                    "subType": "SENSOR",
                    "value": "Dispensing",
                    "battery": 78,
                    "signal": 4
                },
                "config": {"schedule": "3x daily"}
            },
            {
                "name": "Isolation Ward Monitor",
                "hardware_id": "DEMO-LS-CAM-002",
                "asset_type": "LIVESTOCK",
                "status": "ALERT",
                "is_online": True,
                "last_telemetry": {
                    "subType": "CAMERA",
                    "videoUrl": "https://cdn.coverr.co/videos/coverr-cows-in-the-pasture-5379/1080p.mp4",
                    "alert": "Motion Detected - Unusual Activity",
                    "battery": 45,
                    "signal": 3
                },
                "config": {"motion_detection": True}
            },
            
            # CROP SENSORS
            {
                "name": "Field A - Soil Moisture",
                "hardware_id": "DEMO-CROP-SOIL-001",
                "asset_type": "CROP",
                "status": "ACTIVE",
                "is_online": True,
                "last_telemetry": {
                    "value": "45%",
                    "battery": 85,
                    "signal": 5,
                    "lastUpdate": "Just now"
                },
                "location_lat": 12.9716,
                "location_lng": 77.5946,
                "config": {"threshold": 30, "crop": "Wheat"}
            },
            {
                "name": "Greenhouse 1 - Climate Control",
                "hardware_id": "DEMO-CROP-CLIMATE-001",
                "asset_type": "CROP",
                "status": "WARNING",
                "is_online": True,
                "last_telemetry": {
                    "value": "92% Humidity",
                    "temperature": "32°C",
                    "battery": 12,
                    "signal": 3,
                    "alert": "High Humidity - Ventilation Needed"
                },
                "config": {"auto_vent": True}
            },
            {
                "name": "Orchard West - Light Sensor",
                "hardware_id": "DEMO-CROP-LIGHT-001",
                "asset_type": "CROP",
                "status": "ACTIVE",
                "is_online": True,
                "last_telemetry": {
                    "value": "1200 lx",
                    "battery": 90,
                    "signal": 4
                },
                "config": {"crop": "Apple"}
            },
            
            # MACHINERY
            {
                "name": "Tractor - John Deere 5050D",
                "hardware_id": "DEMO-MACH-TRAC-001",
                "asset_type": "MACHINERY",
                "status": "RUNNING",
                "is_online": True,
                "last_telemetry": {
                    "activity": "Plowing Field C",
                    "operator": "Ramesh K.",
                    "fuel": 65,
                    "speed": "12 km/h",
                    "location": "Field C - North"
                },
                "location_lat": 12.9716,
                "location_lng": 77.5946,
                "config": {"gps_enabled": True}
            },
            {
                "name": "Drone Sprayer X1",
                "hardware_id": "DEMO-MACH-DRONE-001",
                "asset_type": "MACHINERY",
                "status": "IDLE",
                "is_online": True,
                "last_telemetry": {
                    "activity": "Docked",
                    "fuel": 100,
                    "battery": 100,
                    "signal": 5
                },
                "config": {"max_altitude": 120}
            },
            {
                "name": "Harvester Pro",
                "hardware_id": "DEMO-MACH-HARV-001",
                "asset_type": "MACHINERY",
                "status": "MAINTENANCE",
                "is_online": False,
                "last_telemetry": {
                    "activity": "Engine Check",
                    "fuel": 0,
                    "alert": "Oil Pressure Low - Service Required"
                },
                "config": {"service_due": "2024-03-15"}
            },
            
            # LABOR TRACKING
            {
                "name": "Team Alpha Tracker",
                "hardware_id": "DEMO-LABOR-TEAM-001",
                "asset_type": "LABOR",
                "status": "ACTIVE",
                "is_online": True,
                "last_telemetry": {
                    "location": "Sector 4",
                    "task": "Harvesting",
                    "count": 12,
                    "progress": "65%"
                },
                "config": {"shift": "Morning"}
            },
            {
                "name": "Irrigation Crew",
                "hardware_id": "DEMO-LABOR-IRR-001",
                "asset_type": "LABOR",
                "status": "IDLE",
                "is_online": True,
                "last_telemetry": {
                    "location": "Rest Area",
                    "task": "Break",
                    "count": 4
                },
                "config": {"shift": "Afternoon"}
            }
        ]
        
        for device_data in devices:
            device = IoTDevice(
                user_id=user.id,
                name=device_data["name"],
                hardware_id=device_data["hardware_id"],
                asset_type=device_data["asset_type"],
                status=device_data["status"],
                is_online=device_data["is_online"],
                last_telemetry=device_data["last_telemetry"],
                location_lat=device_data.get("location_lat"),
                location_lng=device_data.get("location_lng"),
                config=device_data["config"],
                secret_key=secrets.token_urlsafe(32)
            )
            db.add(device)
            print(f"Added: {device.name} ({device.asset_type})")
        
        db.commit()
        print(f"\nSuccessfully seeded {len(devices)} IoT devices!")
        print("\nNow restart the backend server and refresh the Smart Monitor page!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("SEEDING IOT DEVICES FOR SMART MONITOR (PostgreSQL)")
    print("=" * 70)
    print()
    seed_iot_devices()
