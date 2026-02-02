# Smart Monitor - Complete Setup & Troubleshooting Guide

## Quick Start (Fresh Setup)

### Step 1: Run Migration
```bash
cd backend
python migrate_iot_devices.py
```

### Step 2: Seed Demo Data
```bash
python seed_iot_devices.py
```

### Step 3: Restart Backend Server
**CRITICAL**: The backend server MUST be restarted after model changes!

#### Option A: Using the restart script (Windows)
```bash
cd ..
restart_backend.bat
```

#### Option B: Manual restart
1. Stop the current backend server (Ctrl+C in its terminal)
2. Restart it:
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Verify Setup
Open your browser and navigate to:
- Smart Monitor: `http://localhost:3000/en/smart-monitor`
- API Docs: `http://localhost:8000/docs`
- Test endpoint directly: `http://localhost:8000/api/v1/iot/devices`

---

## Common Issues & Solutions

### Issue 1: "column iot_devices.status does not exist"

**Cause**: Backend server is using old model definition (cached before migration)

**Solution**:
1. Verify columns exist:
   ```bash
   cd backend
   python migrate_iot_devices.py
   ```
2. **RESTART the backend server** (this is mandatory!)
3. Clear browser cache and refresh

### Issue 2: CORS Error

**Cause**: Frontend is trying to access backend from different origin

**Solution**: Check `backend/app/core/config.py` has correct CORS settings:
```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your IP if accessing from network
    "http://192.168.1.*:3000"
]
```

### Issue 3: Empty Device List

**Cause**: No devices seeded in database

**Solution**:
```bash
cd backend
python seed_iot_devices.py
```

### Issue 4: 500 Internal Server Error

**Causes**:
1. Database schema mismatch
2. Backend server not restarted after migration
3. Missing dependencies

**Solutions**:
1. Check backend logs for detailed error
2. Restart backend server
3. Verify all dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Issue 5: Frontend Shows "Failed to fetch"

**Causes**:
1. Backend server not running
2. Wrong API URL
3. Network/firewall blocking request

**Solutions**:
1. Verify backend is running: `http://localhost:8000/docs`
2. Check `frontend/src/lib/api.ts` has correct `API_BASE_URL`
3. Check firewall settings

---

## Architecture Overview

### Backend Flow
```
1. IoT Device Model (models.py)
   ↓
2. Database Table (iot_devices)
   ↓
3. Pydantic Schemas (schemas.py)
   ↓
4. Service Layer (service.py)
   ↓
5. API Router (router.py)
   ↓
6. FastAPI Endpoint (/api/v1/iot/devices)
```

### Frontend Flow
```
1. Smart Monitor Page (page.tsx)
   ↓
2. API Client (api.ts)
   ↓
3. Fetch from Backend
   ↓
4. Transform Data
   ↓
5. Render UI Components
```

### Data Flow
```
Database (SQLite/PostgreSQL)
    ↓
IoTDevice Model (status, last_telemetry, etc.)
    ↓
API Response (JSON)
    ↓
Frontend Transformation
    ↓
UI Display (Spotlight, Feed List, Filters)
```

---

## Database Schema

### iot_devices Table
```sql
CREATE TABLE iot_devices (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    hardware_id VARCHAR UNIQUE NOT NULL,
    phone_number VARCHAR,
    location_lat FLOAT,
    location_lng FLOAT,
    is_online BOOLEAN DEFAULT FALSE,
    status VARCHAR DEFAULT 'IDLE',           -- NEW
    last_telemetry TEXT/JSONB DEFAULT '{}',  -- NEW
    last_heartbeat DATETIME,
    secret_key VARCHAR NOT NULL,
    config JSON DEFAULT '{}',
    asset_type VARCHAR DEFAULT 'Device',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Telemetry Data Structure
```json
{
  "battery": 85,
  "signal": 5,
  "value": "45%",
  "videoUrl": "https://...",
  "alert": "High Humidity",
  "activity": "Plowing Field C",
  "operator": "Ramesh K.",
  "fuel": 65,
  "speed": "12 km/h",
  "subType": "CAMERA"
}
```

---

## API Endpoints

### GET /api/v1/iot/devices
Returns all devices for the authenticated user.

**Response**:
```json
[
  {
    "id": 1,
    "name": "Shelter A - Main Camera",
    "asset_type": "LIVESTOCK",
    "status": "ACTIVE",
    "is_online": true,
    "last_telemetry": {
      "subType": "CAMERA",
      "videoUrl": "https://...",
      "battery": 95,
      "signal": 5
    },
    ...
  }
]
```

### POST /api/v1/iot/devices
Register a new IoT device.

### POST /api/v1/iot/devices/{id}/command
Send a command to a device.

---

## Testing Checklist

- [ ] Backend server is running (`http://localhost:8000/docs` loads)
- [ ] Migration completed successfully
- [ ] Backend server was restarted after migration
- [ ] Seed data was added (11 devices)
- [ ] API endpoint returns data (`/api/v1/iot/devices`)
- [ ] Frontend can fetch data (no CORS errors)
- [ ] Smart Monitor page loads (`/smart-monitor`)
- [ ] Devices are displayed in the UI
- [ ] Filtering works (ALL, LIVESTOCK, CROP, etc.)
- [ ] Spotlight rotates through devices
- [ ] Auto-refresh works (every 10 seconds)

---

## Development Workflow

### Adding New Device Types
1. Update seed script with new device data
2. Run seed script
3. Devices appear immediately (no migration needed)

### Modifying Telemetry Structure
1. Update seed script with new telemetry fields
2. Update frontend to display new fields
3. No backend changes needed (JSON is flexible)

### Adding New Columns to IoT Model
1. Update `models.py`
2. Update `schemas.py`
3. Create migration script
4. Run migration
5. **RESTART backend server**
6. Update frontend if needed

---

## Performance Optimization

### Backend
- Database indexes on `user_id`, `asset_type`, `status`
- Connection pooling for database
- Caching for frequently accessed data

### Frontend
- Auto-refresh interval: 10 seconds (adjustable)
- Lazy loading for large device lists
- Memoization for filtered/sorted data

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own devices
3. **Secret Keys**: Device secret keys are hashed and never exposed
4. **CORS**: Restricted to allowed origins only
5. **Input Validation**: Pydantic schemas validate all inputs

---

## Next Steps

### Immediate
1. Test the complete flow end-to-end
2. Verify all device types display correctly
3. Test filtering and spotlight rotation

### Short Term
1. Add real-time updates via WebSockets
2. Implement device command functionality
3. Add historical telemetry charts

### Long Term
1. Connect real IoT hardware
2. Implement alert management system
3. Add custom dashboard builder
4. Mobile app integration

---

## Support

If you encounter issues not covered here:
1. Check backend logs for detailed errors
2. Check browser console for frontend errors
3. Verify database state with SQL queries
4. Review the SMART_MONITOR_README.md for architecture details
