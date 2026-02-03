from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean, JSON, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import sys

# Load environment variables
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not set in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
metadata = MetaData()

def migrate_health_schema():
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    print(f"Connecting to database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'LOCAL'}")

    # Create livestock_health_logs table if not exists
    if "livestock_health_logs" not in existing_tables:
        print("Creating table: livestock_health_logs")
        logs_table = Table(
            "livestock_health_logs", metadata,
            Column("id", Integer, primary_key=True, index=True),
            Column("animal_id", Integer, ForeignKey("livestock.id")),
            Column("date", Date),
            Column("event_type", String),
            Column("description", String),
            Column("cost", Float, default=0.0),
            Column("next_due_date", Date, nullable=True)
        )
        logs_table.create(engine)
        print("Table 'livestock_health_logs' created successfully.")
    else:
        print("Table 'livestock_health_logs' already exists.")

if __name__ == "__main__":
    try:
        migrate_health_schema()
        print("Migration complete.")
    except Exception as e:
        print(f"Migration failed: {e}")
