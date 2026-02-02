from app.core.database import engine
from sqlalchemy import inspect, text

inspector = inspect(engine)

print("=== Livestock-related tables ===")
for table in inspector.get_table_names():
    if 'livestock' in table.lower():
        print(f"\nTable: {table}")
        cols = inspector.get_columns(table)
        for c in cols:
            print(f"  - {c['name']}: {c['type']}")

# Create missing tables
print("\n=== Creating missing livestock tables ===")
from app.modules.livestock import models
from app.core.database import Base

Base.metadata.create_all(bind=engine)
print("Done! Tables created.")

# Verify
print("\n=== Verifying tables ===")
inspector = inspect(engine)
livestock_tables = [t for t in inspector.get_table_names() if 'livestock' in t.lower()]
print(f"Found {len(livestock_tables)} livestock tables:")
for t in livestock_tables:
    print(f"  - {t}")
