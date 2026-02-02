"""
Seed IoT devices with detailed debugging
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
import secrets
import json

DATABASE_URL = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print("=" * 70)
print("SEEDING IOT DEVICES - WITH DEBUGGING")
print("=" * 70)

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Get first user
        result = conn.execute(text("SELECT id, full_name FROM users LIMIT 1"))
        user = result.fetchone()
        
        if not user:
            print("No users found!")
            exit(1)
        
        user_id = user[0]
        user_name = user[1]
        print(f"\nSeeding for User ID: {user_id}, Name: {user_name}")
        
        # Delete existing demo devices
        result = conn.execute(text("DELETE FROM iot_devices WHERE hardware_id LIKE 'DEMO-%'"))
        conn.commit()
        deleted = result.rowcount
        print(f"Deleted {deleted} existing demo devices")
        
        # Insert devices one by one
        devices = [
            ("Shelter A - Main Camera", "DEMO-LS-CAM-001", "LIVESTOCK", "ACTIVE", True, 
             json.dumps({"subType": "CAMERA", "videoUrl": "https://cdn.coverr.co/videos/coverr-cow-eating-grass-in-the-field-5287/1080p.mp4", "battery": 95, "signal": 5}),
             json.dumps({"location": "Barn A", "resolution": "1080p"})),
            
            ("Shelter B - Feed Dispenser", "DEMO-LS-FEED-001", "LIVESTOCK", "ACTIVE", True,
             json.dumps({"subType": "SENSOR", "value": "Dispensing", "battery": 78, "signal": 4}),
             json.dumps({"schedule": "3x daily"})),
            
            ("Isolation Ward Monitor", "DEMO-LS-CAM-002", "LIVESTOCK", "ALERT", True,
             json.dumps({"subType": "CAMERA", "videoUrl": "https://cdn.coverr.co/videos/coverr-cows-in-the-pasture-5379/1080p.mp4", "alert": "Motion Detected", "battery": 45, "signal": 3}),
             json.dumps({"motion_detection": True})),
            
            ("Field A - Soil Moisture", "DEMO-CROP-SOIL-001", "CROP", "ACTIVE", True,
             json.dumps({"value": "45%", "battery": 85, "signal": 5}),
             json.dumps({"threshold": 30, "crop": "Wheat"})),
            
            ("Greenhouse 1 - Climate Control", "DEMO-CROP-CLIMATE-001", "CROP", "WARNING", True,
             json.dumps({"value": "92% Humidity", "temperature": "32°C", "battery": 12, "signal": 3, "alert": "High Humidity"}),
             json.dumps({"auto_vent": True})),
            
            ("Orchard West - Light Sensor", "DEMO-CROP-LIGHT-001", "CROP", "ACTIVE", True,
             json.dumps({"value": "1200 lx", "battery": 90, "signal": 4}),
             json.dumps({"crop": "Apple"})),
            
            ("Tractor - John Deere 5050D", "DEMO-MACH-TRAC-001", "MACHINERY", "RUNNING", True,
             json.dumps({"activity": "Plowing Field C", "operator": "Ramesh K.", "fuel": 65, "speed": "12 km/h"}),
             json.dumps({"gps_enabled": True})),
            
            ("Drone Sprayer X1", "DEMO-MACH-DRONE-001", "MACHINERY", "IDLE", True,
             json.dumps({"activity": "Docked", "fuel": 100, "battery": 100, "signal": 5}),
             json.dumps({"max_altitude": 120})),
            
            ("Harvester Pro", "DEMO-MACH-HARV-001", "MACHINERY", "MAINTENANCE", False,
             json.dumps({"activity": "Engine Check", "fuel": 0, "alert": "Oil Pressure Low"}),
             json.dumps({"service_due": "2024-03-15"})),
            
            ("Team Alpha Tracker", "DEMO-LABOR-TEAM-001", "LABOR", "ACTIVE", True,
             json.dumps({"location": "Sector 4", "task": "Harvesting", "count": 12, "progress": "65%"}),
             json.dumps({"shift": "Morning"})),
            
            ("Irrigation Crew", "DEMO-LABOR-IRR-001", "LABOR", "IDLE", True,
             json.dumps({"location": "Rest Area", "task": "Break", "count": 4}),
             json.dumps({"shift": "Afternoon"}))
        ]
        
        print(f"\nInserting {len(devices)} devices...")
        
        for name, hw_id, asset_type, status, is_online, telemetry, config in devices:
            secret_key = secrets.token_urlsafe(32)
            
            result = conn.execute(text("""
                INSERT INTO iot_devices 
                (user_id, name, hardware_id, asset_type, status, is_online, last_telemetry, config, secret_key)
                VALUES 
                (:user_id, :name, :hardware_id, :asset_type, :status, :is_online, CAST(:telemetry AS jsonb), CAST(:config AS jsonb), :secret_key)
                RETURNING id
            """), {
                "user_id": user_id,
                "name": name,
                "hardware_id": hw_id,
                "asset_type": asset_type,
                "status": status,
                "is_online": is_online,
                "telemetry": telemetry,
                "config": config,
                "secret_key": secret_key
            })
            
            device_id = result.scalar()
            print(f"  OK: Added: {name} (ID: {device_id}, Type: {asset_type})")
        
        conn.commit()
        print(f"\nOK: Successfully committed {len(devices)} devices!")
        
        # Verify
        result = conn.execute(text("SELECT COUNT(*) FROM iot_devices"))
        total = result.scalar()
        print(f"\nVerification: Total devices in database: {total}")
        
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()

print("=" * 70)
