import sqlite3
import os
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Check which database file exists and is being used
backend_db = "agrios_dev.db"
root_db = "../agrios_dev.db"

print("=" * 60)
print("DATABASE STATUS CHECK")
print("=" * 60)

print("\n1. BACKEND DATABASE (backend/agrios_dev.db):")
if os.path.exists(backend_db):
    size = os.path.getsize(backend_db)
    print(f"   [OK] EXISTS - Size: {size:,} bytes ({size/1024:.1f} KB)")
    
    # Check IoT devices table
    conn = sqlite3.connect(backend_db)
    cursor = conn.cursor()
    
    # Get IoT devices columns
    cursor.execute("PRAGMA table_info(iot_devices)")
    iot_columns = [row[1] for row in cursor.fetchall()]
    print(f"\n   IoT Devices Table:")
    print(f"   - Total columns: {len(iot_columns)}")
    print(f"   - Has 'status' column: {'[YES]' if 'status' in iot_columns else '[NO]'}")
    print(f"   - Has 'last_telemetry' column: {'[YES]' if 'last_telemetry' in iot_columns else '[NO]'}")
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    all_tables = [row[0] for row in cursor.fetchall()]
    print(f"\n   Total Tables: {len(all_tables)}")
    
    # Check livestock tables
    livestock_tables = [t for t in all_tables if 'livestock' in t.lower()]
    print(f"\n   Livestock Tables ({len(livestock_tables)}):")
    for table in livestock_tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"   - {table}: {count} rows")
    
    # Check for required livestock tables
    required_livestock_tables = [
        'livestock',
        'livestock_housing',
        'livestock_feed_plans',
        'livestock_production',
        'livestock_health_logs'
    ]
    print(f"\n   Required Livestock Tables:")
    for table in required_livestock_tables:
        exists = table in all_tables
        print(f"   - {table}: {'[OK]' if exists else '[MISSING]'}")
    
    conn.close()
else:
    print("   [NOT FOUND]")

print("\n2. ROOT DATABASE (agrios_dev.db):")
if os.path.exists(root_db):
    size = os.path.getsize(root_db)
    print(f"   [OK] EXISTS - Size: {size:,} bytes ({size/1024:.1f} KB)")
    print(f"   [WARNING] Multiple database files detected!")
else:
    print("   [NOT FOUND]")

print("\n3. DATABASE CONFIGURATION:")
print(f"   Config file says: sqlite:///./agrios_dev.db")
print(f"   This points to: backend/agrios_dev.db (relative to backend/)")

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

# Run final checks
if os.path.exists(backend_db):
    conn = sqlite3.connect(backend_db)
    cursor = conn.cursor()
    
    # ISS-001 Check
    cursor.execute("PRAGMA table_info(iot_devices)")
    iot_columns = [row[1] for row in cursor.fetchall()]
    iss_001_fixed = 'status' in iot_columns and 'last_telemetry' in iot_columns
    print(f"\nISS-001 (IoT columns): {'[FIXED]' if iss_001_fixed else '[BROKEN]'}")
    
    # ISS-004 Check
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    all_tables = [row[0] for row in cursor.fetchall()]
    required_tables = ['livestock_housing', 'livestock_feed_plans', 'livestock_production', 'livestock_health_logs']
    missing_tables = [t for t in required_tables if t not in all_tables]
    iss_004_fixed = len(missing_tables) == 0
    print(f"ISS-004 (Livestock tables): {'[FIXED]' if iss_004_fixed else f'[MISSING: {missing_tables}]'}")
    
    # ISS-007 Check
    iss_007_status = "[RESOLVED]" if not os.path.exists(root_db) else "[MULTIPLE DB FILES]"
    print(f"ISS-007 (Database confusion): {iss_007_status}")
    
    conn.close()

print("\n" + "=" * 60)
