@echo off
echo ============================================================
echo Diagnosing Service Account Issue
echo ============================================================
echo.
echo Step 1: Check current project
gcloud config get-value project
echo.
echo Step 2: List all service accounts in current project
gcloud iam service-accounts list
echo.
echo ============================================================
echo If you see agri-os-vertex listed above, continue below.
echo If NOT, the service account was created in a different project.
echo ============================================================
pause
echo.
echo Step 3: Try creating the key WITHOUT setting permissions
echo (We can add permissions via Console later)
echo.
gcloud iam service-accounts keys create vertex-key.json --iam-account=agri-os-vertex@gen-lang-client-0704576579.iam.gserviceaccount.com
echo.
if exist vertex-key.json (
    echo ============================================================
    echo SUCCESS! Key created: vertex-key.json
    echo ============================================================
    echo.
    echo Now add permissions via Google Cloud Console:
    echo 1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=gen-lang-client-0704576579
    echo 2. Find: agri-os-vertex
    echo 3. Click "Permissions" tab
    echo 4. Grant role: "Vertex AI User"
    echo.
) else (
    echo ============================================================
    echo ALTERNATIVE SOLUTION: Use Gemini API Instead
    echo ============================================================
    echo.
    echo It seems there are permission issues with Vertex AI.
    echo.
    echo EASIER OPTION: Use Gemini API Key
    echo 1. Go to: https://aistudio.google.com/app/apikey
    echo 2. Create an API Key
    echo 3. Add to Render.com as: GEMINI_API_KEY
    echo.
    echo This will work immediately without service accounts!
    echo.
)
pause
