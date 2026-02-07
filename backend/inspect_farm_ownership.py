import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

database_url = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print(f"Connecting to database...")
engine = create_engine(database_url)

with engine.connect() as connection:
    # Get all users
    users = connection.execute(text("SELECT id, email, full_name FROM users ORDER BY id")).fetchall()
    
    print("\n=== Current Users ===")
    for user in users:
        print(f"User {user.id}: {user.full_name} ({user.email})")
    
    print("\n=== Current Farms ===")
    farms = connection.execute(text("SELECT id, name, owner_id FROM farms ORDER BY id")).fetchall()
    for farm in farms:
        print(f"Farm {farm.id}: {farm.name} (Owner: {farm.owner_id})")
    
    print("\n=== Farm Assets ===")
    assets = connection.execute(text("SELECT id, name, asset_type, farm_id FROM farm_assets ORDER BY farm_id, id")).fetchall()
    for asset in assets:
        print(f"Asset {asset.id}: {asset.name} ({asset.asset_type}) - Farm {asset.farm_id}")
    
    print("\n" + "="*50)
    print("RECOMMENDATION:")
    print("="*50)
    print("Each user should have their own farm.")
    print("Run fix_user_farms.py to ensure each user has a dedicated farm.")
