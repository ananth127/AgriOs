
import sys
import os
import random
import string
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# LOAD ENV VARS FIRST
try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except ImportError:
    print("Warning: load_env not found")

from app.core.database import SessionLocal, engine
from app.modules.auth.models import User

def generate_unique_id():
    """Generate a random 12-digit ID string."""
    return ''.join(random.choices(string.digits, k=12))

def update_user_ids():
    db = SessionLocal()
    try:
        print("="*60)
        print("UPDATING USER UNIQUE IDs (12-DIGIT)")
        print("="*60)

        # 1. Check/Add Column via Raw SQL (safest for migrations without Alembic)
        print("[1] Ensuring 'unique_id' column exists...")
        try:
            with engine.connect() as connection:
                # PostgreSQL approach
                try:
                    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_id VARCHAR(20);"))
                    connection.commit()
                    print("   - Column 'unique_id' added (or already existed).")
                except Exception as e:
                    connection.rollback()
                    # SQLite approach (IF NOT EXISTS not supported in older versions, but just try adding)
                    try:
                        connection.execute(text("ALTER TABLE users ADD COLUMN unique_id VARCHAR(20);"))
                        connection.commit()
                        print("   - Column 'unique_id' added (SQLite style).")
                    except Exception as e2:
                        # Likely already exists
                        print(f"   - Column likely exists: {e2}")

                # Create Index if needed (optional but good)
                try:
                    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_unique_id ON users (unique_id);"))
                    connection.commit()
                    print("   - Index on 'unique_id' created.")
                except Exception:
                    connection.rollback() 
                    print("   - Index creation skipped/failed (might exist).")

        except Exception as e:
            print(f"ERROR Adding Column: {e}")

        # 2. Backfill existing users
        print("\n[2] Backfilling existing users...")
        users = db.query(User).filter((User.unique_id == None) | (User.unique_id == "")).all()
        
        if not users:
            print("   - No users found needing ID update.")
        else:
            print(f"   - Found {len(users)} users without unique_id.")
            for user in users:
                new_id = generate_unique_id()
                # Ensure uniqueness (simple check, collisions rare but possible)
                while db.query(User).filter(User.unique_id == new_id).first():
                    new_id = generate_unique_id()
                
                user.unique_id = new_id
                print(f"   - Updated User {user.id} ({user.email}) -> ID: {new_id}")
            
            db.commit()
            print("SUCCESS: All users updated.")

        # 3. Verify
        print("\n[3] Verification:")
        all_users = db.query(User).all()
        for u in all_users:
            print(f"   - User: {u.email:<30} | ID: {u.unique_id}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    update_user_ids()
