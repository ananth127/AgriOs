@echo off
echo ===================================================
echo Agri-OS Google Cloud / Vertex AI Setup
echo ===================================================
echo.
echo You requested to switch to Vertex AI (Gcloud SDK).
echo This involves 3 main steps.
echo.
echo STEP 1: Install Google Cloud SDK
echo ---------------------------------------------------
echo Python libraries are being installed now...
pip install google-cloud-aiplatform
echo.
echo STEP 2: Authenticate with Google
echo ---------------------------------------------------
echo The window will pop up asking you to login.
echo Please login with the Google Account that has "Gemini Advanced".
echo.
echo Press any key to start 'gcloud init' (Follow on-screen instructions)...
pause
cmd /c gcloud init
echo.
echo Press any key to authorize your credentials to be used by python...
pause
cmd /c gcloud auth application-default login
echo.
echo STEP 3: Configure Agri-OS
echo ---------------------------------------------------
echo We need your Project ID from the previous step.
set /p project_id="Enter your Google Cloud Project ID (e.g. agri-os-12345): "
echo.
echo Updating .env file...
echo GOOGLE_CLOUD_PROJECT=%project_id%>> backend\.env
echo GOOGLE_CLOUD_LOCATION=us-central1>> backend\.env
echo.
echo ===================================================
echo SETUP COMPLETE!
echo You can now restart the backend to use Vertex AI.
echo ===================================================
pause
