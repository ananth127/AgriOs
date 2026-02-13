@echo off
echo ==========================================
echo   Restarting Backend Server
echo ==========================================

echo Stopping any running backend processes...
taskkill /F /FI "WINDOWTITLE eq Agri-OS Backend*" 2>nul

echo.
echo Starting Backend Server with venv...
cd backend
call venv\Scripts\activate.bat
echo.
echo Backend is starting on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
