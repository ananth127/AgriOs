import sqlite3

# Check backend database
conn = sqlite3.connect('e:/MY_PROJECT/AgriOs/backend/agrios_dev.db')
cur = conn.cursor()

# Get all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cur.fetchall()]

print("=" * 60)
print("BACKEND DATABASE (backend/agrios_dev.db)")
print("=" * 60)
print(f"Total tables: {len(tables)}")
print()

livestock_tables = [t for t in tables if 'livestock' in t.lower()]
print(f"Livestock tables ({len(livestock_tables)}):")
for t in livestock_tables:
    print(f"  + {t}")

# Check IoT devices table info
print("\nIoT Devices table columns:")
cur.execute("PRAGMA table_info(iot_devices)")
cols = cur.fetchall()
for col in cols:
    print(f"  - {col[1]} ({col[2]})")

# Count records in key tables
print("\nRecord counts:")
for table in ['users', 'farms', 'iot_devices', 'livestock', 'assets']:
    try:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        print(f"  {table}: {count}")
    except:
        print(f"  {table}: NOT FOUND")

conn.close()

# Check root database
print("\n" + "=" * 60)
print("ROOT DATABASE (agrios_dev.db)")
print("=" * 60)
try:
    conn2 = sqlite3.connect('e:/MY_PROJECT/AgriOs/agrios_dev.db')
    cur2 = conn2.cursor()
    cur2.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    root_tables = [row[0] for row in cur2.fetchall()]
    print(f"Total tables: {len(root_tables)}")
    print(f"Tables: {root_tables[:5] if root_tables else 'NONE'}")
    conn2.close()
except Exception as e:
    print(f"Error: {e}")
