@echo off
echo ============================================================
echo Creating Vertex AI Key for Project: agri-os
echo ============================================================
echo.
echo Step 1: Adding IAM permissions (correct project)
gcloud projects add-iam-policy-binding agri-os --member="serviceAccount:agri-os-vertex@agri-os.iam.gserviceaccount.com" --role="roles/aiplatform.user"
echo.
echo Step 2: Creating JSON key
gcloud iam service-accounts keys create vertex-key.json --iam-account=agri-os-vertex@agri-os.iam.gserviceaccount.com
echo.
if exist vertex-key.json (
    echo ============================================================
    echo SUCCESS! File created: vertex-key.json
    echo ============================================================
    echo.
    echo For Render.com, add these Environment Variables:
    echo.
    echo   GOOGLE_CLOUD_PROJECT=agri-os
    echo   GOOGLE_CLOUD_LOCATION=us-central1
    echo   GOOGLE_APPLICATION_CREDENTIALS_JSON=[paste entire vertex-key.json content]
    echo.
    echo Opening vertex-key.json...
    notepad vertex-key.json
) else (
    echo ERROR: Failed to create key file.
    echo.
    echo Please check permissions or use Gemini API instead:
    echo   https://aistudio.google.com/app/apikey
)
echo.
pause
