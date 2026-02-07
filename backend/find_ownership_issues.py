import os
import sys
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Use the database URL from settings or hardcode if needed
database_url = settings.DATABASE_URL
# fallback if settings doesn't pick it up from partial env load
if "sqlite" in database_url:
    # Try to load from env file manually just for the URL if needed, but I'll use the one I saw earlier
    database_url = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print(f"Connecting to: {database_url}")
engine = create_engine(database_url)

def get_users():
    with engine.connect() as connection:
        query = text("SELECT id, email, full_name, role FROM users")
        result = connection.execute(query).fetchall()
        print("\nUsers found:")
        for row in result:
            print(f"ID: {row.id}, Email: {row.email}, Name: {row.full_name}, Role: {row.role}")
            
def find_tables_with_owner():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    print("\nTables with 'owner_id' or 'user_id' columns:")
    
    tables_to_update = []
    
    for table in table_names:
        columns = [col['name'] for col in inspector.get_columns(table)]
        if 'owner_id' in columns:
            print(f"- {table} (has owner_id)")
            tables_to_update.append((table, 'owner_id'))
        elif 'user_id' in columns:
            print(f"- {table} (has user_id)")
            tables_to_update.append((table, 'user_id'))
            
    return tables_to_update

if __name__ == "__main__":
    try:
        get_users()
        find_tables_with_owner()
    except Exception as e:
        print(f"Error: {e}")
