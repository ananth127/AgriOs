
import os
import sys

# Set DEV=false to avoid interactive prompts if needed
os.environ["DEV"] = "false"

try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except ImportError:
    print("Warning: Could not import load_env.py")

from sqlalchemy import text, inspect
from app.core.database import engine

def add_is_default_column():
    print("Checking database schema for 'product_listings' table...")
    inspector = inspect(engine)
    
    # Check if table exists
    if not inspector.has_table('product_listings'):
        print("Error: Table 'product_listings' does not exist.")
        return

    columns = [c['name'] for c in inspector.get_columns('product_listings')]
    
    with engine.connect() as conn:
        if 'is_default' not in columns:
            print("Adding 'is_default' column to 'product_listings' table...")
            conn.execute(text("ALTER TABLE product_listings ADD COLUMN is_default BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Column 'is_default' added successfully.")
        else:
            print("Column 'is_default' already exists.")

if __name__ == "__main__":
    try:
        add_is_default_column()
    except Exception as e:
        print(f"Migration failed: {e}")
