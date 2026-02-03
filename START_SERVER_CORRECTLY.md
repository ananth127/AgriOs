# Quick Fix - Start Backend Server Correctly

## The Error
```
ERROR: Error loading ASGI app. Could not import module "app.main".
```

## Problem
You're running the uvicorn command from the **wrong directory**.

## ✅ CORRECT Way to Start Server

### Option 1: Navigate to backend folder first
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option 2: Use the start script
```bash
cd backend
start.bat
```

### Option 3: From project root
```bash
cd E:\MY_PROJECT\AgriOs\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Current Directory Check

Make sure you're in the `backend` folder:
```bash
pwd  # Should show: E:\MY_PROJECT\AgriOs\backend
dir  # Should show: app folder, main.py, etc.
```

## After Server Starts

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Then open: `http://localhost:3000/en/smart-monitor`

---

*Quick fix guide - 2026-02-03*
