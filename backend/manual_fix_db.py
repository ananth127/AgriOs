import os
import sys

# Add backend to path to allow imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    # 1. Load Environment Variables explicitly
    print("Loading environment variables...")
    from load_env import load_env_with_decryption
    load_env_with_decryption()
    
    # 2. Check if DATABASE_URL is set
    if "DATABASE_URL" not in os.environ:
        print("ERROR: DATABASE_URL not found in environment. Defaulting to local postgres for dev if needed.")
        # Fallback for dev if .env fails for some reason
        # os.environ["DATABASE_URL"] = "postgresql://user:password@localhost/dbname" 

    # 3. Import DB engine only AFTER env is loaded
    from sqlalchemy import text
    from app.core.database import engine

    def fix_schema():
        print("Attempting to fix schema...")
        with engine.connect() as connection:
            commercial_cols = ["category VARCHAR", "image_url VARCHAR"]
            for col_def in commercial_cols:
                try:
                    print(f"Adding {col_def}...")
                    connection.execute(text(f"ALTER TABLE commercial_products ADD COLUMN IF NOT EXISTS {col_def};"))
                    connection.commit()
                    print(f"Success: {col_def}")
                except Exception as e:
                    connection.rollback()
                    print(f"Error adding {col_def}: {e}")

    if __name__ == "__main__":
        fix_schema()

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
