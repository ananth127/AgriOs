# 🚀 Agri-OS Deployment Guide

This guide covers the final steps to transition Agri-OS from a generic local dev environment to a production-grade Operating System.

## 1. Database Setup (Supabase / Production Postgres)

Agri-OS is designed to run on **PostgreSQL with PostGIS**.
While local development uses SQLite (via `db_compat.py`), production requires the real deal for Geospatial queries.

1.  **Create a Project** on [Supabase](https://supabase.com).
2.  **Enable PostGIS**:
    *   Go to `Database` -> `Extensions`.
    *   Enable `postgis`.
3.  **Get Connection String**:
    *   Copy the URI (Transaction pooler is recommended for serverless).
    *   Format: `postgresql://postgres.[ref]:[password]@[region].pooler.supabase.com:6543/postgres`

## 2. Backend Configuration

1.  **Environment Variables**:
    *   Update `backend/.env` (or set in your cloud provider):
        ```env
        DATABASE_URL="your-supabase-connection-string"
        OPENAI_API_KEY="sk-..." (For Prophet/Voice features)
        ```
2.  **Migrations**:
    *   Agri-OS uses SQLAlchemy. On the first run against a new DB, it will auto-create tables via `Base.metadata.create_all(bind=engine)`.
    *   *Recommendation*: Initialize Alembic for future migrations.
        ```bash
        cd backend
        alembic init alembic
        ```

## 3. Deployment Options

### Option A: Docker Compose (Self-Hosted)
Run the entire stack (Frontend + Backend + DB + Redis) on a VPS/Droplet.
```bash
docker-compose up --build -d
```

### Option B: Cloud PaaS (Render/Vercel)
*   **Frontend**: deploy `frontend` folder to **Vercel** or **Netlify**.
    *   Build Command: `npm run build`
    *   Output Dir: `.next`
    *   Env: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1`
*   **Backend**: deploy `backend` folder to **Render** or **Railway**.
    *   Build Command: `pip install -r requirements.txt`
    *   Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`

## 4. Universal Registry Seeding
Once deployed, seed the production database:
```bash
# Locally, pointing to prod DB
export DATABASE_URL="your-prod-url"
python backend/seed.py
```
