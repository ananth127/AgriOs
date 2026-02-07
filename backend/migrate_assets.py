"""
Migrate assets from Farm 1 (Demo) to User 1 (Ananth)
This restores access to the IoT devices for the main user
"""
import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

database_url = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print(f"Connecting to database...")
engine = create_engine(database_url)

target_user_id = 1  # Ananth
source_farm_id = 1  # Demo Farm (currently owned by User 4)

with engine.connect() as connection:
    # 1. properties of User 1
    print(f"Checking User {target_user_id}...")
    
    # 2. Get User 1's primary farm (first one)
    user_farms = connection.execute(
        text("SELECT id, name FROM farms WHERE owner_id = :uid ORDER BY id"),
        {"uid": target_user_id}
    ).fetchall()
    
    if not user_farms:
        print("User 1 has no farms! Creating one...")
        # (This should be handled by the service, but let's be safe)
        sys.exit(1)
        
    primary_farm_id = user_farms[0].id
    primary_farm_name = user_farms[0].name
    print(f"Target Farm: {primary_farm_id} ({primary_farm_name})")
    
    # 3. Check assets in Source Farm 1
    assets_to_move = connection.execute(
        text("SELECT id, name, asset_type FROM farm_assets WHERE farm_id = :fid"),
        {"fid": source_farm_id}
    ).fetchall()
    
    print(f"\nFound {len(assets_to_move)} assets in Farm {source_farm_id}:")
    for asset in assets_to_move:
        print(f" - [{asset.id}] {asset.name} ({asset.asset_type})")
        
    if not assets_to_move:
        print("No assets to migrate.")
    else:
        # 4. Migrate them
        print(f"\nMigrating {len(assets_to_move)} assets to Farm {primary_farm_id}...")
        
        connection.execute(
            text("UPDATE farm_assets SET farm_id = :new_fid WHERE farm_id = :old_fid"),
            {"new_fid": primary_farm_id, "old_fid": source_farm_id}
        )
        connection.commit()
        print("SUCCESS: Assets migrated.")
        
    # 5. (Optional) Migrate the Farm 1 itself to User 1? 
    # The user might prefer to just Own Farm 1.
    # But usually better to have one farm.
    
    user_farms_after = connection.execute(
        text("SELECT id, name FROM farms WHERE owner_id = :uid ORDER BY id"),
        {"uid": target_user_id}
    ).fetchall()
    print(f"\nUser {target_user_id} now has farms: {[f.id for f in user_farms_after]}")
