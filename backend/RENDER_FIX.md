# Render Deployment Guide

## 🚨 CRITICAL: Fix "No open ports detected"

Your Render Web Service is likely using the default start command (`uvicorn main:app`), which fails because it binds to `127.0.0.1` (localhost). Render requires binding to `0.0.0.0`.

### Solution

1.  Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2.  Click on your **agri-os-backend** service.
3.  Click on **Settings** in the left sidebar.
4.  Scroll down to the **Start Command** field.
5.  **Change the Start Command to:**

    ```bash
    python main.py
    ```

    *Why?* The `main.py` file has been updated to automatically detect the `PORT` environment variable and bind to `0.0.0.0`.

6.  Click **Save Changes**.

### Alternative Command (if python main.py fails)

If for some reason `python main.py` does not work, use this explicit command:

```bash
uvicorn main:app --host 0.0.0.0 --port 10000
```

### Verification

Check the **Logs** tab. You should see:
> `Starting uvicorn on 0.0.0.0:10000...`

If you see `Running 'uvicorn main:app'`, the setting has **not** been updated correctly.
