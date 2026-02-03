from app.core.database import engine
from sqlalchemy import text

print("=== Creating Smart Log Table (SQLite Compatible) ===")

with engine.connect() as conn:
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_smart_device_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                action VARCHAR,
                details VARCHAR
            );
        """))
        conn.commit()
        print("Created livestock_smart_device_logs table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating logs table: {e}")

print("\n=== Done! ===")
