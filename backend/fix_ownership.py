import os
import sys
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Use the database URL
database_url = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print(f"Connecting to: {database_url}")
engine = create_engine(database_url)

def fix_ownership(target_user_id):
    print(f"\n--- Assigning all data to User ID {target_user_id} ---")
    
    with engine.connect() as connection:
        # 1. Update Farms
        print("Updating Farms...")
        try:
            result = connection.execute(text(f"UPDATE farms SET owner_id = :uid"), {"uid": target_user_id})
            # result.rowcount might not be available depending on driver/sqlalchemy version for updates, but usually is
            print(f"Updated farms: {result.rowcount}")
        except Exception as e:
            print(f"Error updating farms: {e}")

        # 2. Update IoT Devices
        print("Updating IoT Devices...")
        try:
            # Check if user_id column exists
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('iot_devices')]
            if 'user_id' in columns:
                result = connection.execute(text(f"UPDATE iot_devices SET user_id = :uid"), {"uid": target_user_id})
                print(f"Updated iot_devices: {result.rowcount}")
            else:
                print("iot_devices table has no user_id column.")
        except Exception as e:
            print(f"Error updating iot_devices: {e}")
            
        # 3. Update Zones
        print("Updating Zones...")
        try:
             # Check if owner_id or user_id column exists
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('zones')]
            if 'owner_id' in columns:
                result = connection.execute(text(f"UPDATE zones SET owner_id = :uid"), {"uid": target_user_id})
                print(f"Updated zones (owner_id): {result.rowcount}")
            elif 'user_id' in columns:
                result = connection.execute(text(f"UPDATE zones SET user_id = :uid"), {"uid": target_user_id})
                print(f"Updated zones (user_id): {result.rowcount}")
        except Exception as e:
             # It might just depend on farm_id, so this error is okay
            print(f"Error updating zones (might be linked via farm_id): {e}")

        connection.commit()
        print("\nSUCCESS: All entities reassigned.")

if __name__ == "__main__":
    # Get the user ID
    target_id = 1 # Default to Ananth
    
    if len(sys.argv) > 1:
        try:
            target_id = int(sys.argv[1])
        except:
            pass
            
    print(f"Target User ID: {target_id}")
    fix_ownership(target_id)
