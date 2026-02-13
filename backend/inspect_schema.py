
from sqlalchemy import create_engine, text
from app.core.config import settings

def inspect_db():
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[-1]}") # Log host/port only (privacy)
    engine = create_engine(str(settings.DATABASE_URL))
    with engine.connect() as conn:
        print("Checking 'users' table columns:")
        columns = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';")).fetchall()
        column_list = [row[0] for row in columns]
        print(column_list)
        
        if 'unique_id' in column_list:
            print("SUCCESS: 'unique_id' column found!")
        else:
            print("ERROR: 'unique_id' column MISSING!")

if __name__ == "__main__":
    inspect_db()
