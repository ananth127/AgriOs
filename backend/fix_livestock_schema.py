from app.core import database
from sqlalchemy import text

def fix():
    print("Attempting to fix livestock table...")
    try:
        with database.engine.connect() as connection:
            # Add qr_code
            try:
                connection.execute(text("ALTER TABLE livestock ADD COLUMN qr_code VARCHAR;"))
                connection.commit()
                print("Added qr_code column.")
            except Exception as e:
                connection.rollback()
                print(f"Skipped qr_code: {e}")

            # Add qr_created_at
            try:
                connection.execute(text("ALTER TABLE livestock ADD COLUMN qr_created_at TIMESTAMP;"))
                connection.commit()
                print("Added qr_created_at column.")
            except Exception as e:
                connection.rollback()
                print(f"Skipped qr_created_at: {e}")
                
            print("Done.")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    fix()
