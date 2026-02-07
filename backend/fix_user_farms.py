"""
Ensure each user has exactly one primary farm and clean up duplicates/orphaned data
"""
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
    
    print("\n=== Ensuring Each User Has One Primary Farm ===\n")
    
    for user in users:
        user_id = user.id
        print(f"Processing User {user_id}: {user.full_name}")
        
        # Check existing farms for this user
        farms = connection.execute(
            text("SELECT id, name FROM farms WHERE owner_id = :uid ORDER BY id"),
            {"uid": user_id}
        ).fetchall()
        
        if len(farms) == 0:
            # Create a farm for this user
            result = connection.execute(
                text("""
                    INSERT INTO farms (name, owner_id, geometry, soil_profile) 
                    VALUES (:name, :uid, 'POLYGON((0 0, 0 0.001, 0.001 0.001, 0.001 0, 0 0))', '{"type": "Not specified"}')
                    RETURNING id
                """),
                {"name": f"{user.full_name}'s Farm", "uid": user_id}
            )
            new_farm_id = result.fetchone()[0]
            connection.commit()
            print(f"  ✓ Created Farm {new_farm_id}")
            
        elif len(farms) == 1:
            print(f"  ✓ Already has Farm {farms[0].id}")
            
        else:
            # User has multiple farms - keep the first one, delete others
            primary_farm = farms[0]
            print(f"  ✓ Primary Farm: {primary_farm.id}")
            
            for extra_farm in farms[1:]:
                # Move assets from extra farms to primary farm
                connection.execute(
                    text("UPDATE farm_assets SET farm_id = :primary WHERE farm_id = :extra"),
                    {"primary": primary_farm.id, "extra": extra_farm.id}
                )
                
                # Delete the extra farm
                connection.execute(
                    text("DELETE FROM farms WHERE id = :fid"),
                    {"fid": extra_farm.id}
                )
                print(f"  ✓ Merged Farm {extra_farm.id} into Farm {primary_farm.id}")
            
            connection.commit()
    
    print("\n" + "="*50)
    print("CLEANUP COMPLETE!")
    print("="*50)
    
    # Show final state
    print("\n=== Final Farm Ownership ===")
    final_farms = connection.execute(text("""
        SELECT f.id, f.name, f.owner_id, u.full_name, COUNT(fa.id) as asset_count
        FROM farms f
        JOIN users u ON f.owner_id = u.id
        LEFT JOIN farm_assets fa ON fa.farm_id = f.id
        GROUP BY f.id, f.name, f.owner_id, u.full_name
        ORDER BY f.owner_id, f.id
    """)).fetchall()
    
    for farm in final_farms:
        print(f"Farm {farm.id}: {farm.name} | Owner: {farm.full_name} (ID: {farm.owner_id}) | Assets: {farm.asset_count}")
