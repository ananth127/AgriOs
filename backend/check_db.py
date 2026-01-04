"""
Quick script to check database contents
"""
import sys
# Load environment first!
try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except ImportError:
    pass

from app.core.database import SessionLocal
from app.modules.farms import models as farm_models
from app.modules.registry import models as registry_models
from app.modules.livestock import models as livestock_models

def check_database():
    db = SessionLocal()
    
    print("=" * 50)
    print("DATABASE CONTENTS CHECK")
    print("=" * 50)
    
    # Check Farms
    print("\n🚜 FARMS:")
    farms = db.query(farm_models.FarmTable).all()
    print(f"   Total: {len(farms)} farms")
    
    # helper to print geometry safely
    def get_geom_str(geom_obj):
        if geom_obj is None:
            return "None"
        try:
            # Try converting PostGIS WKBElement to shape
            from geoalchemy2.shape import to_shape
            return str(to_shape(geom_obj))
        except Exception:
            # Fallback for SQLite (string) or error
            return str(geom_obj)

    for farm in farms:
        print(f"   - ID: {farm.id}")
        print(f"     Name: {farm.name}")
        print(f"     Owner: {farm.owner_id}")
        print(f"     Location: {get_geom_str(farm.geometry)[:50]}...") # Truncate long coords
    
    # Check Registry
    print("\n🌱 REGISTRY:")
    registry = db.query(registry_models.RegistryTable).all()
    print(f"   Total: {len(registry)} items")
    for item in registry:
        print(f"   - ID: {item.id}, Name: {item.name}, Category: {item.category}")
    
    # Check Livestock
    print("\n🐄 LIVESTOCK:")
    animals = db.query(livestock_models.Animal).all()
    print(f"   Total: {len(animals)} animals")
    for animal in animals:
        print(f"   - Tag: {animal.tag_id}, Farm: {animal.farm_id}, Health: {animal.health_status}")
    
    print("\n" + "=" * 50)
    
    if len(farms) > 0:
        print("✅ Database has data!")
    else:
        print("❌ Database is empty - run: python seed.py")
    
    print("=" * 50)
    
    db.close()

if __name__ == "__main__":
    check_database()
