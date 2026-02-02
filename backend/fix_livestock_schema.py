from app.core.database import engine
from sqlalchemy import text

print("=== Adding missing column and creating tables ===")

with engine.connect() as conn:
    # 1. Add housing_id to livestock table
    try:
        conn.execute(text("ALTER TABLE livestock ADD COLUMN housing_id INTEGER;"))
        conn.commit()
        print("Added housing_id column to livestock table")
    except Exception as e:
        conn.rollback()
        print(f"housing_id column might already exist or error: {e}")
    
    # 2. Create livestock_housing table
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_housing (
                id SERIAL PRIMARY KEY,
                farm_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                type VARCHAR NOT NULL,
                capacity INTEGER DEFAULT 10,
                current_occupancy INTEGER DEFAULT 0,
                auto_cleaning_enabled BOOLEAN DEFAULT FALSE,
                cleaning_schedule VARCHAR
            );
        """))
        conn.commit()
        print("Created livestock_housing table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating livestock_housing: {e}")
    
    # 3. Create livestock_feed_plans table
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_feed_plans (
                id SERIAL PRIMARY KEY,
                animal_id INTEGER,
                housing_id INTEGER,
                feed_item_name VARCHAR,
                quantity_per_day FLOAT,
                schedule_times JSON,
                auto_feeder_enabled BOOLEAN DEFAULT FALSE,
                auto_water_enabled BOOLEAN DEFAULT FALSE
            );
        """))
        conn.commit()
        print("Created livestock_feed_plans table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating livestock_feed_plans: {e}")
    
    # 4. Create livestock_production table
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_production (
                id SERIAL PRIMARY KEY,
                animal_id INTEGER NOT NULL,
                date DATE NOT NULL,
                product_type VARCHAR NOT NULL,
                quantity FLOAT NOT NULL,
                unit VARCHAR NOT NULL
            );
        """))
        conn.commit()
        print("Created livestock_production table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating livestock_production: {e}")
    
    # 5. Create livestock_health_logs table
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_health_logs (
                id SERIAL PRIMARY KEY,
                animal_id INTEGER NOT NULL,
                date DATE DEFAULT CURRENT_DATE,
                event_type VARCHAR NOT NULL,
                description TEXT,
                cost FLOAT DEFAULT 0.0,
                next_due_date DATE
            );
        """))
        conn.commit()
        print("Created livestock_health_logs table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating livestock_health_logs: {e}")

print("\n=== Done! ===")
print("All livestock tables have been created.")
