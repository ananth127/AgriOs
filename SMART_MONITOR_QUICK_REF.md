# Smart Monitor - Quick Reference Card

## 🚀 Quick Start

### Access the Smart Monitor
```
http://localhost:3000/en/smart-monitor
```

### View API Documentation
```
http://localhost:8000/docs
```

---

## 📊 What's Available

### Devices (11 total)
- **LIVESTOCK** (3): Cameras, Feeders
- **CROP** (3): Soil, Climate, Light Sensors
- **MACHINERY** (3): Tractor, Drone, Harvester
- **LABOR** (2): Team Trackers

### Features
- ✅ Real-time data from database
- ✅ Auto-refresh every 10 seconds
- ✅ Smart spotlight prioritization
- ✅ Multi-category filtering
- ✅ Deep linking support
- ✅ Rich telemetry display

---

## 🔧 Common Commands

### Verify Setup
```bash
cd backend
python verify_smart_monitor.py
```

### Test Models
```bash
cd backend
python test_iot_models.py
```

### Reseed Data
```bash
cd backend
python seed_iot_devices.py
```

### Restart Backend
```bash
# Stop server (Ctrl+C)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📁 Key Files

### Backend
- `app/modules/iot/models.py` - IoT device model
- `app/modules/iot/schemas.py` - API schemas
- `app/modules/iot/router.py` - API endpoints
- `app/modules/iot/service.py` - Business logic

### Frontend
- `frontend/src/app/[locale]/smart-monitor/page.tsx` - Main page
- `frontend/src/lib/api.ts` - API client

### Scripts
- `migrate_iot_devices.py` - Database migration
- `seed_iot_devices.py` - Demo data seeding
- `verify_smart_monitor.py` - Setup verification
- `test_iot_models.py` - Model testing

### Documentation
- `SMART_MONITOR_FINAL_FIX.md` - Complete guide (READ THIS FIRST)
- `SMART_MONITOR_COMPLETE.md` - Success summary
- `SMART_MONITOR_README.md` - Architecture
- `SMART_MONITOR_SETUP.md` - Troubleshooting

---

## 🎯 Status Indicators

### Device Status
- **ACTIVE** - Operating normally (Green)
- **ALERT** - Critical issue (Red)
- **WARNING** - Attention needed (Yellow)
- **IDLE** - Standby mode (Gray)
- **RUNNING** - Currently executing task (Blue)

### Connection Status
- **Online** - Connected and responding
- **Offline** - No recent heartbeat

---

## 🔍 Troubleshooting

### Issue: Empty device list
**Fix**: Run `python seed_iot_devices.py`

### Issue: 500 Internal Server Error
**Fix**: Restart backend server

### Issue: "Not authenticated"
**Fix**: Login to the application first

### Issue: CORS errors
**Fix**: Check backend CORS settings in `config.py`

---

## 📞 Quick Help

1. **Check verification**: `python verify_smart_monitor.py`
2. **Test models**: `python test_iot_models.py`
3. **View logs**: Check backend terminal output
4. **Read docs**: `SMART_MONITOR_FINAL_FIX.md`

---

## ✅ Current Status

- Database: ✅ Migrated & Seeded
- Backend: ✅ Running & Tested
- Frontend: ✅ Connected & Working
- API: ✅ Authenticated & Responding
- Models: ✅ Loading Without Errors

**System Status: FULLY OPERATIONAL** 🎉

---

*Quick Reference v1.0 | Last Updated: 2026-02-03*
