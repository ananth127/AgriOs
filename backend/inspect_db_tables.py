import os
import sys
from sqlalchemy import create_engine, inspect, text

# Add the backend directory to sys.path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from load_env import load_env_with_decryption
    # Load environment variables
    load_env_with_decryption()
except ImportError:
    print("Could not import load_env.py, assuming env vars are set or using defaults.")
except Exception as e:
    print(f"Error loading env: {e}")

# Get DATABASE_URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("DATABASE_URL not found in env, using default from config if available...")
    from app.core.config import settings
    database_url = settings.DATABASE_URL
    
print(f"Connecting to database: {database_url}")

try:
    engine = create_engine(database_url)
    inspector = inspect(engine)
    
    # Get table names
    table_names = inspector.get_table_names()
    
    print(f"\nFound {len(table_names)} tables:")
    print("-" * 40)
    print(f"{'Table Name':<30} | {'Row Count'}")
    print("-" * 40)
    
    with engine.connect() as connection:
        for table in table_names:
            try:
                # Count rows
                query = text(f"SELECT COUNT(*) FROM {table}")
                result = connection.execute(query).scalar()
                print(f"{table:<30} | {result}")
            except Exception as e:
                print(f"{table:<30} | Error: {e}")
                
except Exception as e:
    print(f"\nFailed to connect or inspect database: {e}")
