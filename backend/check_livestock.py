from app.core import database
from sqlalchemy import inspect, text

def check_schema():
    inspector = inspect(database.engine)
    columns = [col['name'] for col in inspector.get_columns('livestock')]
    print(f"Livestock Columns: {columns}")
    
    # Also try a raw select to be 100% sure
    try:
        title_col = "name"
        with database.engine.connect() as connection:
            result = connection.execute(text(f"SELECT {title_col} FROM livestock LIMIT 1"))
            print(f"SELECT {title_col} success. Rows: {result.fetchall()}")
    except Exception as e:
        print(f"SELECT failed: {e}")

if __name__ == "__main__":
    check_schema()
