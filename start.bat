@echo off
echo ==========================================
echo       Starting Agri-OS Local Environment
echo ==========================================

:: 1. Detect Local IP Address
echo Detecting Local IP (192.168.x.x)...
set IP=127.0.0.1
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /R "IPv4.*192\.168\."') do (
    set IP=%%i
    goto :ipfound
)

:ipfound
set IP=%IP:~1%
echo Detected Local IP: %IP%

:: 2. Start Backend in a new window
echo Starting Backend Server...
start "Agri-OS Backend" cmd /k "cd backend && title Backend (FastAPI) && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 3. Start Frontend in a new window
echo Starting Frontend Server...
echo Setting NEXT_PUBLIC_API_URL=http://%IP%:8000/api/v1
:: Note: Use "set VAR=VAL" syntax with && immediately after to avoid trailing spaces
start "Agri-OS Frontend" cmd /k "cd frontend && title Frontend (Next.js) && set HOST=0.0.0.0 && set NEXT_PUBLIC_API_URL=http://%IP%:8000/api/v1&& npm run dev -- -p 3000"

echo.
echo ==========================================
echo Servers are launching in separate windows!
echo.
echo - Frontend: http://localhost:3000 (and http://%IP%:3000)
echo - Backend:  http://localhost:8000/docs
echo.
echo Keep this window open or close it, the servers
echo are running in the pop-up windows.
echo ==========================================
pause
