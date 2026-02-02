@echo off
echo ============================================================
echo COMPLETE FIX FOR IOT DEVICES DATABASE
echo ============================================================
echo.

echo [STEP 1] Stopping backend server...
echo Please STOP the backend server now (Ctrl+C in its terminal)
echo.
pause
echo.

echo [STEP 2] Running database migration...
cd backend
python migrate_iot_devices.py
if %ERRORLEVEL% NEQ 0 (
    echo Migration failed! Please check the error above.
    pause
    exit /b 1
)
echo.

echo [STEP 3] Seeding demo data...
python seed_iot_devices.py
if %ERRORLEVEL% NEQ 0 (
    echo Seeding failed! Please check the error above.
    pause
    exit /b 1
)
echo.

echo [STEP 4] Verifying setup...
python verify_smart_monitor.py
echo.

echo [STEP 5] Starting backend server...
start "backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo.

echo ============================================================
echo SETUP COMPLETE!
echo.
echo Backend server is starting in a new window.
echo Wait 5-10 seconds for it to fully start, then:
echo.
echo 1. Open: http://localhost:3000/en/smart-monitor
echo 2. You should see 11 real IoT devices!
echo ============================================================
echo.
pause
