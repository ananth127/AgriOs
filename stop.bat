@echo off
echo ==========================================
echo       Stopping Agri-OS Servers
echo ==========================================

echo Killing Node.js processes (Frontend)...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo - Frontend stopped.
) else (
    echo - No Frontend process found.
)

echo.
echo Killing Python processes (Backend)...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo - Backend stopped.
) else (
    echo - No Backend process found.
)

echo.
echo ==========================================
echo All servers stopped.
echo ==========================================
pause
