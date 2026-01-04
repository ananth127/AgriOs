# 🌐 Complete Agri-OS Online Deployment Guide

This guide provides step-by-step instructions to deploy your Agri-OS application online using GitHub and cloud hosting platforms.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
6. [Alternative Deployment Options](#alternative-deployment-options)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- ✅ A GitHub account ([Sign up here](https://github.com/join))
- ✅ Git installed on your computer
- ✅ Your Agri-OS project ready locally
- ✅ A Vercel account ([Sign up here](https://vercel.com/signup))
- ✅ A Render account ([Sign up here](https://render.com/register))
- ✅ A Supabase account ([Sign up here](https://supabase.com))

---

## 🔧 GitHub Repository Setup

### Step 1: Initialize Git Repository (if not already done)

```bash
# Navigate to your project root
cd "d:\Programs\Android Studio\Settings\Farming\Agri-OS"

# Initialize git (if not already initialized)
git init

# Create .gitignore file
```

### Step 2: Create `.gitignore` File

Create a `.gitignore` file in your project root with the following content:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
*.egg-info/
dist/
build/

# Node.js
node_modules/
.next/
out/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment Variables
.env
.env.local
.env.production
.env.*.local
backend/.env

# Database
*.db
*.sqlite
*.sqlite3
sql_app.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
```

### Step 3: Add Remote Repository

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/ananth127/AgriOs.git

# If remote already exists, update it
git remote set-url origin https://github.com/ananth127/AgriOs.git
```

### Step 4: Commit and Push Your Code

```bash
# Stage all files
git add .

# Commit changes
git commit -m "Initial commit: Agri-OS complete application"

# Push to GitHub (main branch)
git branch -M main
git push -u origin main
```

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `agri-os-db`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** (wait 2-3 minutes)

### Step 2: Enable PostGIS Extension

1. In your Supabase project, go to **Database** → **Extensions**
2. Search for `postgis`
3. Click **Enable** on the PostGIS extension

### Step 3: Get Database Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Copy the **URI** (Transaction pooler recommended):
   ```
   postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password
5. **Save this connection string** - you'll need it for backend deployment

---

## 🚀 Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

Create a `render.yaml` file in your project root:

```yaml
services:
  - type: web
    name: agri-os-backend
    env: python
    region: oregon
    plan: free
    branch: main
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port 10000"
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: PYTHON_VERSION
        value: 3.10.0
```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** (if not connected)
   - Select `ananth127/AgriOs` repository
4. Configure the service:
   - **Name**: `agri-os-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
   - **Plan**: Free (or choose paid for better performance)

### Step 3: Add Environment Variables

In Render service settings, add these environment variables:

1. **DATABASE_URL**:
   - Value: Your Supabase connection string from earlier
   
2. **OPENAI_API_KEY** (if using AI features):
   - Value: Your OpenAI API key (get from [OpenAI](https://platform.openai.com/api-keys))

3. **PYTHON_VERSION**:
   - Value: `3.10.0`

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://agri-os-backend.onrender.com`
4. **Save this URL** - you'll need it for frontend configuration
5. Test the API: Visit `https://agri-os-backend.onrender.com/docs`

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Configuration

Create a `vercel.json` file in the `frontend` directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository:
   - Click **"Import Git Repository"**
   - Select `ananth127/AgriOs`
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

5. Add Environment Variables:
   - Click **"Environment Variables"**
   - Add: `NEXT_PUBLIC_API_URL`
   - Value: `https://agri-os-backend.onrender.com/api/v1`
   - (Replace with your actual Render backend URL)

6. Click **"Deploy"**
7. Wait for deployment (3-5 minutes)
8. You'll get a URL like: `https://agri-os.vercel.app`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts and set environment variables when asked
```

### Step 3: Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain (e.g., `agri-os.com`)
3. Follow DNS configuration instructions

---

## 🔄 Alternative Deployment Options

### Option 1: Deploy Both on Render

**Frontend on Render:**
```yaml
services:
  - type: web
    name: agri-os-frontend
    env: node
    buildCommand: "cd frontend && npm install && npm run build"
    startCommand: "cd frontend && npm start"
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://agri-os-backend.onrender.com/api/v1
```

### Option 2: Deploy on Railway

1. Go to [Railway](https://railway.app/)
2. Create new project from GitHub repo
3. Add services for both frontend and backend
4. Configure environment variables
5. Deploy

### Option 3: Self-Hosted with Docker

If you have a VPS (DigitalOcean, AWS EC2, etc.):

```bash
# SSH into your server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/ananth127/AgriOs.git
cd AgriOs

# Create .env file with your configurations
nano backend/.env

# Run with Docker Compose
docker-compose up -d --build
```

---

## ⚙️ Post-Deployment Configuration

### Step 1: Seed Production Database

After backend is deployed, seed your database:

```bash
# Set environment variable locally
export DATABASE_URL="your-supabase-connection-string"

# Or on Windows:
set DATABASE_URL=your-supabase-connection-string

# Run seed script
cd backend
python seed.py
```

### Step 2: Test Your Deployment

1. **Backend API**: Visit `https://agri-os-backend.onrender.com/docs`
   - Test API endpoints
   - Verify database connection

2. **Frontend**: Visit `https://agri-os.vercel.app`
   - Test all pages
   - Verify API integration
   - Test multi-language support

### Step 3: Set Up Continuous Deployment

Both Vercel and Render automatically deploy when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature X"
git push origin main

# Vercel and Render will automatically rebuild and deploy
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend fails to start
- ✅ Check environment variables are set correctly
- ✅ Verify DATABASE_URL is correct
- ✅ Check Render logs: Dashboard → Service → Logs

**Problem**: Database connection errors
- ✅ Verify PostGIS is enabled in Supabase
- ✅ Check connection string format
- ✅ Ensure IP whitelist allows Render IPs (Supabase auto-allows)

### Frontend Issues

**Problem**: API calls fail (CORS errors)
- ✅ Add CORS middleware in backend `main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agri-os.vercel.app"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Problem**: Environment variables not working
- ✅ Ensure `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Redeploy after adding environment variables

### General Issues

**Problem**: Slow performance on free tier
- ✅ Upgrade to paid plans for better performance
- ✅ Render free tier sleeps after inactivity (first request may be slow)

---

## 📊 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Supabase database created and PostGIS enabled
- [ ] Backend deployed on Render
- [ ] Backend environment variables configured
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variables configured
- [ ] Database seeded with initial data
- [ ] API endpoints tested
- [ ] Frontend tested and working
- [ ] CORS configured properly
- [ ] Custom domain configured (optional)

---

## 🎉 Success!

Your Agri-OS application is now live! 

- **Frontend**: `https://agri-os.vercel.app`
- **Backend API**: `https://agri-os-backend.onrender.com`
- **API Docs**: `https://agri-os-backend.onrender.com/docs`

### Next Steps:
1. Monitor application performance
2. Set up error tracking (Sentry)
3. Configure analytics (Google Analytics)
4. Set up automated backups for database
5. Implement CI/CD testing

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Need Help?** 
- Check the logs in Vercel/Render dashboards
- Review error messages carefully
- Consult platform-specific documentation
- Test locally first before deploying changes

Good luck with your deployment! 🚀🌾
