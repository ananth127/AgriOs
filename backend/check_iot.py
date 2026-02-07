
from app.core import database
from sqlalchemy import text

db = database.SessionLocal()
try:
    print("Checking IoT Devices:")
    result = db.execute(text("SELECT id, name, hardware_id FROM iot_devices"))
    rows = result.fetchall()
    print(f"IoT Devices count: {len(rows)}")
    for row in rows:
        print(row)
    
    print("\nChecking Farm Assets:")
    result = db.execute(text("SELECT id, name, iot_device_id FROM farm_assets"))
    rows = result.fetchall()
    print(f"Farm Assets count: {len(rows)}")
    for row in rows:
        print(row)

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
