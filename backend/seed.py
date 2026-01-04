from datetime import date
from app.core.database import SessionLocal
from app.modules.registry import models as registry_models, schemas as registry_schemas, service as registry_service
from app.modules.farms import models as farm_models, schemas as farm_schemas, service as farm_service
from app.modules.marketplace import models as market_models, schemas as market_schemas, service as market_service
from app.modules.livestock import models as livestock_models, schemas as livestock_schemas, service as livestock_service

def seed_all():
    db = SessionLocal()
    
    # --- 1. Registry ---
    crops = [
        {"name": "Wheat (Genhu)", "category": "Cereal", "definition": {"duration_days": 120, "water_needs": "Moderate"}},
        {"name": "Rice (Dhan)", "category": "Cereal", "definition": {"duration_days": 150, "water_needs": "High"}},
        {"name": "Onion (Pyaz)", "category": "Vegetable", "definition": {"duration_days": 90, "water_needs": "Moderate"}},
        {"name": "Gir Cow", "category": "Animal", "definition": {"type": "Cattle", "milk_capacity": "12L"}}
    ]
    print("🌱 Seeding Registry...")
    registry_map = {}
    for crop in crops:
        exists = registry_service.get_registry_item(db, crop["name"])
        if not exists:
            item = registry_schemas.RegistryCreate(**crop)
            created = registry_service.create_registry_item(db, item)
            registry_map[crop["name"]] = created.id
            print(f"   Created {crop['name']}")
        else:
            registry_map[crop["name"]] = exists.id
            print(f"   Skipped {crop['name']}")

    # --- 2. Farms ---
    print("🚜 Seeding Farms...")
    # 5 Polygon coords closing loop
    wkt_poly = "POLYGON((73.5 18.5, 73.51 18.5, 73.51 18.51, 73.5 18.51, 73.5 18.5))"
    farm_data = {
        "name": "Sunny Acres (Nasik)",
        "owner_id": 1,
        "geometry": wkt_poly,
        "soil_profile": {"type": "Black Soil", "ph": 6.5}
    }
    # Check if farm exists (simple check by name for seed)
    existing_farm = db.query(farm_models.FarmTable).filter_by(name=farm_data["name"]).first()
    if not existing_farm:
        farm_create = farm_schemas.FarmCreate(**farm_data)
        created_farm = farm_service.create_farm(db, farm_create)
        farm_id = created_farm.id
        print(f"   Created Farm: {created_farm.name}")
    else:
        farm_id = existing_farm.id
        print("   Skipped Farm (Exists)")

    # --- 3. Livestock ---
    print("🐄 Seeding Livestock...")
    cow_registry_id = registry_map.get("Gir Cow")
    if cow_registry_id:
        animals = [
             {"tag_id": "TAG-101", "date_of_birth": date(2023, 1, 1), "health_status": "Healthy", "weight_kg": 350.5},
             {"tag_id": "TAG-102", "date_of_birth": date(2023, 2, 15), "health_status": "Sick", "weight_kg": 340.0}
        ]
        for anim in animals:
             exists = db.query(livestock_models.Animal).filter_by(tag_id=anim["tag_id"]).first()
             if not exists:
                 new_anim = livestock_models.Animal(
                     registry_id=cow_registry_id,
                     farm_id=farm_id,
                     **anim
                 )
                 db.add(new_anim)
                 print(f"   Registered Animal {anim['tag_id']}")
        db.commit()

    # --- 4. Marketplace ---
    print("🛒 Seeding Marketplace...")
    provider_data = {
        "business_name": "AgriDrone Services",
        "description": "Professional Drone Spraying",
        "phone_number": "+91-9876543210",
        "latitude": 18.52,
        "longitude": 73.85
    }
    existing_provider = db.query(market_models.ServiceProvider).filter_by(business_name=provider_data["business_name"]).first()
    
    if not existing_provider:
        prov_create = market_schemas.ProviderCreate(**provider_data)
        # Service handles point WKT creation if we used the create_provider service
        # But we need to be careful with the service logic imports.
        # Let's verify service usage. the service.create_provider takes (db, schemas, user_id)
        created_prov = market_service.create_provider(db, prov_create, user_id=99)
        prov_id = created_prov.id
        print("   Created Provider: AgriDrone")
        
        # Add Listing
        listing = market_schemas.ListingCreate(
            title="Drone Spraying (Per Acre)",
            category="Service",
            price=800.0,
            price_unit="per_acre"
        )
        market_service.create_listing(db, listing, prov_id)
        print("   Created Listing: Drone Spraying")
    else:
        print("   Skipped Marketplace (Exists)")

    db.close()
    print("✅ All Modules Seeded!")

if __name__ == "__main__":
    seed_all()
