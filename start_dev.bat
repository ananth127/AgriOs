@echo off
echo ==========================================
echo       Starting Agri-OS Local Environment
echo ==========================================


:: 0. Check and Setup Environment
echo Checking environment setup...

:: Check Backend Configuration
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo Creating backend .env from example...
        copy "backend\.env.example" "backend\.env" >nul
    ) else (
        echo WARNING: backend\.env.example not found. Skipping .env creation.
    )
)

:: Check Backend Dependencies
echo Checking Backend dependencies...
pushd backend
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo Dependencies missing. Installing Backend requirements...
    pip install -r requirements.txt
) else (
    echo Backend dependencies appear to be installed.
)
popd

:: Check Frontend Configuration
if not exist "frontend\.env.local" (
    if exist "frontend\.env.local.example" (
        echo Creating frontend .env.local from example...
        copy "frontend\.env.local.example" "frontend\.env.local" >nul
    ) else (
        echo WARNING: frontend\.env.local.example not found. Skipping .env.local creation.
    )
)

:: Check Frontend Dependencies
echo Checking Frontend dependencies...
if not exist "frontend\node_modules" (
    echo node_modules not found. Installing Frontend dependencies...
    pushd frontend
    call npm install
    popd
) else (
    echo Frontend dependencies appear to be installed.
)

echo.
echo Environment check complete. Starting services...
echo.

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
start "Agri-OS Frontend" cmd /k "cd frontend && title Frontend (Next.js) && set HOST=0.0.0.0 && set NEXT_PUBLIC_API_URL=http://%IP%:8000/api/v1 && npm run dev -- -p 3000"

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
