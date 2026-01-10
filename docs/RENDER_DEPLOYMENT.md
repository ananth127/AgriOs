# How to Deploy Agri-OS to Render.com with Vertex AI

## Prerequisites
1. A Google Cloud Project
2. Vertex AI API enabled
3. A Service Account with proper permissions

---

## Step 1: Create Service Account & Get JSON Key

### 1.1 Create Service Account
```bash
gcloud iam service-accounts create agri-os-vertex \
    --display-name="Agri-OS Vertex AI Service Account"
```

### 1.2 Grant Required Permissions
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:agri-os-vertex@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### 1.3 Create and Download JSON Key
```bash
gcloud iam service-accounts keys create vertex-key.json \
    --iam-account=agri-os-vertex@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

This creates a file called `vertex-key.json` in your current directory.

---

## Step 2: Configure Render.com

### 2.1 Environment Variables
Add these to your Render.com service:

```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste entire contents of vertex-key.json here>
```

**Important**: Paste the ENTIRE JSON content from `vertex-key.json` as a single-line string into the `GOOGLE_APPLICATION_CREDENTIALS_JSON` variable.

### 2.2 Build Command
```
pip install -r backend/requirements.txt
```

### 2.3 Start Command
```
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Step 3: Update render.yaml (Auto-deploy)

See the updated `render.yaml` file in the project root.

---

## Security Note
- **NEVER** commit `vertex-key.json` to Git
- It's already in `.gitignore`
- Only paste it into Render.com's environment variables dashboard

---

## Testing Locally with Service Account

If you want to test locally using the service account:

```bash
set GOOGLE_APPLICATION_CREDENTIALS=vertex-key.json
python backend/main.py
```
