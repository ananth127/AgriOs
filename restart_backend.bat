@echo off
echo ============================================================
echo Restarting AgriOS Backend Server
echo ============================================================
echo.

echo [1/3] Stopping existing backend processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq backend*" 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Starting backend server...
cd backend
start "backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [3/3] Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ============================================================
echo Backend server restarted!
echo Server running at: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ============================================================
echo.
pause
