# 🚀 Agri-OS Deployment Quick Start

## ⚡ Quick Deployment Steps

### 1️⃣ Push to GitHub (5 minutes)
```bash
# Option A: Use the automated script
deploy-to-github.bat

# Option B: Manual commands
git init
git remote add origin https://github.com/ananth127/AgriOs.git
git add .
git commit -m "Initial deployment"
git branch -M main
git push -u origin main
```

### 2️⃣ Set Up Database - Supabase (10 minutes)
1. Go to https://app.supabase.com
2. Create new project: `agri-os-db`
3. Enable PostGIS: Database → Extensions → Enable `postgis`
4. Copy connection string: Settings → Database → URI
5. Save for later: `postgresql://postgres.[ref]:[password]@...`

### 3️⃣ Deploy Backend - Render (15 minutes)
1. Go to https://dashboard.render.com
2. New → Web Service
3. Connect GitHub repo: `ananth127/AgriOs`
4. Configure:
   - Name: `agri-os-backend`
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add Environment Variables:
   - `DATABASE_URL` = Your Supabase connection string
   - `OPENAI_API_KEY` = Your OpenAI key (if using AI features)
6. Deploy!
7. Save URL: `https://agri-os-backend.onrender.com`

### 4️⃣ Deploy Frontend - Vercel (10 minutes)
1. Go to https://vercel.com/dashboard
2. New Project → Import from GitHub
3. Select: `ananth127/AgriOs`
4. Configure:
   - Root Directory: `frontend`
   - Framework: Next.js (auto-detected)
5. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://agri-os-backend.onrender.com/api/v1`
6. Deploy!
7. Your app is live: `https://agri-os.vercel.app`

### 5️⃣ Seed Database (5 minutes)
```bash
# Set environment variable
set DATABASE_URL=your-supabase-connection-string

# Run seed script
cd backend
python seed.py
```

### 6️⃣ Test Your Deployment ✅
- Backend API Docs: `https://agri-os-backend.onrender.com/docs`
- Frontend App: `https://agri-os.vercel.app`

---

## 📋 Pre-Deployment Checklist

- [ ] Code is working locally
- [ ] `.gitignore` file created
- [ ] Sensitive data removed from code (API keys, passwords)
- [ ] GitHub repository created
- [ ] Supabase account created
- [ ] Render account created
- [ ] Vercel account created

---

## 🔑 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| GitHub Repo | https://github.com/ananth127/AgriOs | Source code |
| Supabase | https://app.supabase.com | Database |
| Render | https://dashboard.render.com | Backend hosting |
| Vercel | https://vercel.com/dashboard | Frontend hosting |

---

## 🆘 Quick Troubleshooting

### Backend won't start?
- Check Render logs
- Verify DATABASE_URL is correct
- Ensure PostGIS is enabled in Supabase

### Frontend API errors?
- Verify `NEXT_PUBLIC_API_URL` in Vercel
- Check CORS is enabled in backend (already done ✅)
- Wait for Render backend to wake up (free tier sleeps)

### Database connection fails?
- Verify Supabase connection string format
- Check password is correct
- Ensure PostGIS extension is enabled

---

## 📚 Full Documentation

For detailed step-by-step instructions, see:
- **DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **README_DEPLOY.md** - Production deployment notes
- **README.md** - Project overview

---

## 🎯 Total Time: ~45 minutes

You'll have your Agri-OS application live on the internet! 🌾🚀

---

## 💡 Pro Tips

1. **Free Tier Limitations:**
   - Render free tier sleeps after 15 min inactivity
   - First request may take 30-60 seconds to wake up
   - Upgrade to paid for always-on service

2. **Environment Variables:**
   - Never commit `.env` files to GitHub
   - Always use platform environment variable settings
   - Use `NEXT_PUBLIC_` prefix for client-side Next.js variables

3. **Continuous Deployment:**
   - Both Vercel and Render auto-deploy on git push
   - Just push to GitHub and wait for automatic deployment
   - Check deployment logs if something fails

4. **Custom Domain:**
   - Add custom domain in Vercel settings
   - Update DNS records as instructed
   - SSL certificate is automatic

---

**Ready to deploy?** Run `deploy-to-github.bat` to get started! 🚀
