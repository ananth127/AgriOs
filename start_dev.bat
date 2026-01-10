@echo off
echo ==========================================
echo       Starting Agri-OS Local Environment
echo ==========================================

:: 1. Start Backend in a new window
echo Starting Backend Server...
start "Agri-OS Backend" cmd /k "cd backend && title Backend (FastAPI) && uvicorn main:app --reload"

:: 2. Start Frontend in a new window
echo Starting Frontend Server...
start "Agri-OS Frontend" cmd /k "cd frontend && title Frontend (Next.js) && npm run dev"

echo.
echo ==========================================
echo Servers are launching in separate windows!
echo.
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000/docs
echo.
echo Keep this window open or close it, the servers
echo are running in the pop-up windows.
echo ==========================================
pause
