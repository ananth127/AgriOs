from app.core.database import engine
from sqlalchemy import text

print("=== Creating Smart Monitoring Tables (SQLite Compatible) ===")

with engine.connect() as conn:
    # 1. Monitoring Devices
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_monitoring_devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                housing_id INTEGER NOT NULL,
                name VARCHAR,
                device_type VARCHAR,
                stream_url VARCHAR,
                api_endpoint VARCHAR,
                is_active BOOLEAN DEFAULT 1,
                settings JSON
            );
        """))
        conn.commit()
        print("Created livestock_monitoring_devices table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating devices table: {e}")

    # 2. Monitoring Alerts
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_monitoring_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                alert_type VARCHAR,
                severity VARCHAR,
                message VARCHAR,
                snapshot_url VARCHAR,
                clip_url VARCHAR,
                data_value FLOAT,
                resolved BOOLEAN DEFAULT 0,
                resolved_at DATETIME
            );
        """))
        conn.commit()
        print("Created livestock_monitoring_alerts table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating alerts table: {e}")
        
    # 3. Telemetry Reading
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS livestock_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                temperature FLOAT,
                humidity FLOAT,
                co2_level FLOAT,
                ammonia_level FLOAT,
                noise_level_db FLOAT,
                luminosity FLOAT
            );
        """))
        conn.commit()
        print("Created livestock_telemetry table")
    except Exception as e:
        conn.rollback()
        print(f"Error creating telemetry table: {e}")

print("\n=== Done! ===")
