from app.core import database
from sqlalchemy import text

def fix_missing_columns():
    print("Attempting to add missing columns to livestock table...")
    
    new_columns = [
        ("name", "VARCHAR"),
        ("gender", "VARCHAR"),
        ("purpose", "VARCHAR"),
        ("origin", "VARCHAR"),
        ("source_details", "VARCHAR"),
        ("parent_id", "INTEGER")
    ]
    
    try:
        with database.engine.connect() as connection:
            for col_name, col_type in new_columns:
                try:
                    # Generic SQL that works for Postgres/SQLite usually
                    # Note: "IF NOT EXISTS" is Postgres 9.6+, assume it works or handle error
                    sql = f"ALTER TABLE livestock ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    connection.execute(text(sql))
                    connection.commit()
                    print(f"Added column: {col_name}")
                except Exception as e:
                    connection.rollback()
                    # Fallback for older DBs or SQLite where IF NOT EXISTS might differ
                    try:
                         # Try simple add, if it exists it will fail, which is fine
                        sql = f"ALTER TABLE livestock ADD COLUMN {col_name} {col_type};"
                        connection.execute(text(sql))
                        connection.commit()
                        print(f"Added column (fallback): {col_name}")
                    except Exception as e2:
                        print(f"Skipped {col_name} (likely exists): {e2}")

            print("Done.")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    fix_missing_columns()
