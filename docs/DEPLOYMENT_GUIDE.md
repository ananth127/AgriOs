# Agri-OS Deployment Guide

This guide details how to deploy Agri-OS (Backend + Frontend) to a production environment using **Supabase** (Database) and **Render** (Hosting).

## 1. Database Setup (Supabase)

Agri-OS requires a PostgreSQL database with **PostGIS** extension enabled for geospatial features (Farm mapping).

1.  **Create Project**: Go to [database.new](https://database.new) and create a new project.
2.  **Get Credentials**: Note down your `DB_HOST`, `DB_USER`, `DB_PASSWORD`.
3.  **Connection String**: Construct your URL: `postgresql://user:password@host:5432/postgres`
4.  **Enable Extensions**:
    *   Go to **Database** -> **Extensions**.
    *   Enable `postgis`.
5.  **Storage (Optional)**:
    *   Create a bucket named `agri-os-media` for storing user uploads/drone images.

## 2. Backend Deployment (Render)

We use **Render** to host the FastAPI backend.

1.  **Create Web Service**:
    *   Connect your GitHub repository.
    *   Select `/backend` as the Root Directory.
    *   Runtime: **Python 3**.
    *   Build Command: `pip install -r requirements.txt`
    *   Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
2.  **Environment Variables**:
    *   Add `DATABASE_URL`: (Your Supabase connection string)
    *   Add `SECRET_KEY`: (Generate a secure random string)
    *   Add `OPENAI_API_KEY` (Optional, for AI features)

## 3. Frontend Deployment (Vercel)

The Next.js frontend is optimized for **Vercel**.

1.  **Import Project**:
    *   Connect GitHub repo.
    *   Select `/frontend` as Root Directory.
2.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: The URL of your deployed Backend (e.g., `https://agri-os-backend.onrender.com/api/v1`)
3.  **Deploy**: Click Deploy.

## 4. Local Development (Docker)

To run the entire stack locally:

```bash
docker-compose up --build
```

This spins up:
*   Frontend: http://localhost:3000
*   Backend: http://localhost:8000
*   PostGIS DB: localhost:5432
*   Redis: localhost:6379
*   MeiliSearch: localhost:7700
```
