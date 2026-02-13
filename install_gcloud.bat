@echo off
echo ============================================================
echo Google Cloud SDK Installation Guide for Agri-OS
echo ============================================================
echo.
echo STEP 1: Download Google Cloud SDK
echo ------------------------------------------------------------
echo Opening Google Cloud SDK installer page...
start https://cloud.google.com/sdk/docs/install
echo.
echo Please:
echo 1. Download "GoogleCloudSDKInstaller.exe" (Windows)
echo 2. Run the installer
echo 3. Check "Run 'gcloud init'" at the end
echo 4. Come back here after installation completes
echo.
pause
echo.
echo ============================================================
echo STEP 2: Initialize and Login
echo ============================================================
echo After installation, run these commands:
echo.
echo   gcloud init
echo   gcloud auth application-default login
echo.
echo Then follow the Render deployment guide in:
echo   docs\RENDER_DEPLOYMENT.md
echo.
pause
