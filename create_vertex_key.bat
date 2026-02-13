@echo off
echo Waiting for service account to propagate...
timeout /t 10 /nobreak
echo.
echo Retrying IAM policy binding...
gcloud projects add-iam-policy-binding gen-lang-client-0704576579 --member="serviceAccount:agri-os-vertex@gen-lang-client-0704576579.iam.gserviceaccount.com" --role="roles/aiplatform.user"
echo.
echo Creating JSON key...
gcloud iam service-accounts keys create vertex-key.json --iam-account=agri-os-vertex@gen-lang-client-0704576579.iam.gserviceaccount.com
echo.
echo ============================================================
echo SUCCESS! File created: vertex-key.json
echo ============================================================
echo.
echo Next Steps for Render.com:
echo.
echo 1. Open vertex-key.json in a text editor
echo 2. Copy the ENTIRE contents
echo 3. Go to Render.com Dashboard
echo 4. Add these Environment Variables:
echo    - GOOGLE_CLOUD_PROJECT = gen-lang-client-0704576579
echo    - GOOGLE_APPLICATION_CREDENTIALS_JSON = [paste JSON content]
echo    - GOOGLE_CLOUD_LOCATION = us-central1
echo.
pause
