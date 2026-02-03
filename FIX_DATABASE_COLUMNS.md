# 🔧 CRITICAL FIX: Database Column Missing Error

## The Problem

The backend server is trying to query `iot_devices.status` and `iot_devices.last_telemetry` columns that **don't exist in the actual database file being used by the server**.

**Error**: `column iot_devices.status does not exist`

## Root Cause

The database file (`agrios_dev.db`) that the **running server** is using was NOT migrated. The migration script ran successfully but on a different database instance or the server had the file locked.

## ✅ SOLUTION (Choose ONE method)

### Method 1: Automated Fix Script (RECOMMENDED)

1. **Run the fix script**:
   ```bash
   fix_iot_database.bat
   ```

2. **Follow the prompts**:
   - It will ask you to stop the backend server
   - Press Ctrl+C in the backend terminal
   - Press Enter in the fix script
   - Wait for migration and seeding to complete
   - Server will restart automatically

3. **Test**:
   - Open `http://localhost:3000/en/smart-monitor`
   - You should see 11 devices!

---

### Method 2: Manual Fix (If automated fails)

#### Step 1: Stop Backend Server
- Go to the terminal running the backend
- Press **Ctrl+C** to stop it
- Wait until it fully stops

#### Step 2: Run Direct SQL Migration
```bash
cd backend
python direct_sql_migration.py
```

This will:
- Add the missing `status` column
- Add the missing `last_telemetry` column
- Verify the changes

#### Step 3: Seed Demo Data (if needed)
```bash
python seed_iot_devices.py
```

#### Step 4: Restart Backend Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 5: Verify
Open `http://localhost:3000/en/smart-monitor`

---

## Why This Happened

1. **Database Locking**: SQLite locks the database file when the server is running
2. **Migration Timing**: We ran the migration while the server was running
3. **Server Cache**: The running server had the old schema cached in memory

## Prevention

**ALWAYS** stop the backend server before running database migrations!

```bash
# WRONG ❌
# Server running → Run migration → Columns not added

# CORRECT ✅
# Stop server → Run migration → Start server → Columns added
```

---

## Verification Commands

### Check if columns exist:
```bash
cd backend
python -c "import sqlite3; conn = sqlite3.connect('agrios_dev.db'); cursor = conn.cursor(); cursor.execute('PRAGMA table_info(iot_devices)'); print([row[1] for row in cursor.fetchall()])"
```

Should show: `['id', 'user_id', 'name', ..., 'status', 'last_telemetry']`

### Check device count:
```bash
cd backend
python -c "import sqlite3; conn = sqlite3.connect('agrios_dev.db'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM iot_devices'); print(f'Devices: {cursor.fetchone()[0]}')"
```

Should show: `Devices: 11`

---

## Quick Reference

| File | Purpose |
|------|---------|
| `fix_iot_database.bat` | Automated fix (stops server, migrates, restarts) |
| `direct_sql_migration.py` | Manual SQL migration (server must be stopped) |
| `migrate_iot_devices.py` | SQLAlchemy migration (server must be stopped) |
| `seed_iot_devices.py` | Add demo devices |
| `verify_smart_monitor.py` | Verify setup |
| `test_iot_models.py` | Test model loading |

---

## Expected Result

After fixing, you should see:

```
INFO: 192.168.1.124:xxxxx - "GET /api/v1/iot/devices HTTP/1.1" 200 OK
```

Instead of:

```
ERROR: column iot_devices.status does not exist
INFO: 192.168.1.124:xxxxx - "GET /api/v1/iot/devices HTTP/1.1" 500 Internal Server Error
```

---

## Still Having Issues?

1. **Delete the database and start fresh**:
   ```bash
   cd backend
   # Stop server first!
   del agrios_dev.db
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   # Server will create new DB with correct schema
   python seed_iot_devices.py
   ```

2. **Check database location**:
   ```bash
   cd backend
   dir agrios_dev.db
   ```

3. **Verify server is using correct database**:
   - Check `backend/app/core/config.py`
   - Look for `DATABASE_URL` setting
   - Should be: `sqlite:///./agrios_dev.db`

---

*Last Updated: 2026-02-03 00:47 IST*  
*Status: CRITICAL FIX REQUIRED*
