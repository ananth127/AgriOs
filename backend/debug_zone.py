
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.modules.farms import schemas, zone_service
from app.modules.farms import models

print("Testing Zone Creation...")
db = SessionLocal()
try:
    # Try to simulate valid input
    zone = schemas.ZoneCreate(
        name="Test Zone Debug",
        geometry="POLYGON((77.5 12.9, 77.51 12.9, 77.51 12.91, 77.5 12.91, 77.5 12.9))",
        details={"color": "red"}
    )
    # Use farm_id=1 (assuming it exists, otherwise create fake farm)
    farm = db.query(models.FarmTable).first()
    if not farm:
        print("No farms found, creating mock farm...")
        farm = models.FarmTable(name="Mock Farm", owner_id=1, geometry="POINT(0 0)")
        db.add(farm)
        db.commit()
    
    print(f"Using Farm ID: {farm.id}")
    
    res = zone_service.create_zone(db, farm.id, zone)
    print(f"Success! Zone Created ID: {res.id}")
    print(f"Geometry type: {type(res.geometry)}")
    print(f"Geometry value: {res.geometry}")

except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
