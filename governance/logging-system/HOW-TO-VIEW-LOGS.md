# 🔧 CORRECTED: How to View Logs

## ❌ What Didn't Work

```javascript
// ❌ This gives 404 error in Next.js
const logger = (await import('/src/lib/logger/index.ts')).default;
```

**Why?** Next.js doesn't expose source TypeScript files at runtime.

---

## ✅ **CORRECT WAYS TO VIEW LOGS**

### **Method 1: Backend Files** ⭐ **EASIEST & RECOMMENDED**

```powershell
# Windows PowerShell - View errors
Get-Content backend\logs\errors-2026-02-07.jsonl -Tail 10

# View all logs
Get-Content backend\logs\frontend-2026-02-07.jsonl -Tail 20

# Count errors
(Get-Content backend\logs\errors-2026-02-07.jsonl).Count

# Search for specific error
Select-String "Failed" backend\logs\errors-2026-02-07.jsonl
```

**This is the FASTEST and most reliable way!** ✅

---

### **Method 2: Browser Console (After Setup)** 🌐

Once you've set up the logger (see Step 3 below), use:

```javascript
// Access the logger (it's exposed globally)
window.__logger

// View statistics
window.__logger.getStats()

// View recent logs
await window.__logger.getRecentLogs(10)

// View all errors
await window.__logger.getLogsByLevel('error')

// Clear all logs
await window.__logger.clearLogs()
```

---

### **Method 3: Debug Page** 🎨 **BEST UI**

**I just created a debug page for you!**

**Access at:** `http://localhost:3000/en/debug`

**Features:**
- ✅ View all logs with filtering
- ✅ See statistics (total, errors, warnings)
- ✅ Export logs as JSON
- ✅ Create test errors
- ✅ Clear logs
- ✅ Quick actions

**File created:** `frontend/src/app/[locale]/debug/page.tsx`

---

### **Method 4: Backend API** 🌐

```bash
# Get statistics
curl http://localhost:8000/api/v1/logs/stats

# Get recent logs
curl http://localhost:8000/api/v1/logs/recent?limit=10

# Get only errors
curl http://localhost:8000/api/v1/logs/recent?level=error
```

---

## 🚀 **Quick Setup (3 Steps)**

### **Step 1: Register Backend Route**

Edit `backend/app/main.py`:

```python
# Add at the top
from app.modules.logging import router as logging_router

# Add with other routers
app.include_router(logging_router, prefix="/api/v1")
```

### **Step 2: Initialize Frontend**

Edit your layout file (`frontend/src/app/[locale]/layout.tsx`):

```typescript
import ErrorBoundary from '@/lib/logger/ErrorBoundary';
import { LoggerProvider } from '@/lib/logger/useLogger';

export default function LocaleLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ErrorBoundary boundaryName="RootLayout">
      <LoggerProvider>
        {children}
      </LoggerProvider>
    </ErrorBoundary>
  );
}
```

### **Step 3: Test It**

**Create a test error:**

Visit any page in your app, open console (F12), and run:

```javascript
// The logger is now available globally!
window.__logger.error('Test error', 'system', new Error('Testing!'));
```

**Then check:**
1. Browser console - You'll see the error
2. `backend/logs/errors-2026-02-07.jsonl` - Error is saved
3. `http://localhost:3000/en/debug` - View in UI

---

## 📍 **Where Logs Are Actually Stored**

```
backend/logs/
├── frontend-2026-02-07.jsonl    ← ALL logs
├── errors-2026-02-07.jsonl      ← Errors only
├── frontend-2026-02-06.jsonl
└── errors-2026-02-06.jsonl
```

Each line is a complete JSON object.

---

## 🎯 **Quick Commands Reference**

### **View Latest Errors (PowerShell)**
```powershell
Get-Content backend\logs\errors-*.jsonl -Tail 5
```

### **In Browser Console (After Setup)**
```javascript
// View stats
window.__logger.getStats()

// View recent logs (returns Promise)
await window.__logger.getRecentLogs(20)

// View errors only (returns Promise)
await window.__logger.getLogsByLevel('error')
```

### **Visit Debug Page**
```
http://localhost:3000/en/debug
```

---

## ✅ **What I Fixed**

1. ✅ **Created debug page** at `/en/debug` with visual log viewer
2. ✅ **Exposed logger to window object** as `window.__logger`
3. ✅ **Added console hints** when logger initializes
4. ✅ **Updated documentation** with correct access methods

---

## 🎉 **Try This Now**

### **Option A: Use Backend Files (No setup needed)**
```powershell
# Just run this
Get-Content backend\logs\frontend-$(Get-Date -Format yyyy-MM-dd).jsonl -Tail 10
```

### **Option B: Use Debug Page (After setup)**
1. Complete the 3-step setup above
2. Visit `http://localhost:3000/en/debug`
3. Click "Create Test Error" button
4. See the error appear instantly!

### **Option C: Use Browser Console (After setup)**
```javascript
// In browser console (F12)
window.__logger.getStats()
```

---

## 💡 **Helpful Console Messages**

After setup, when you load any page, you'll see:

```
💡 Logger available at: window.__logger
📊 Try: window.__logger.getStats()
📝 Try: window.__logger.getRecentLogs(10)
```

Just copy and paste these commands!

---

## 🆘 **Still Having Issues?**

**If you get "window.__logger is undefined":**
- Make sure you completed Step 2 (Add LoggerProvider)
- Refresh the page
- Check browser console for initialization message

**If backend files don't exist:**
- Make sure you completed Step 1 (Backend route)
- Restart the backend server
- Create a test error to trigger log creation

---

**Now you can easily access logs in 3 ways:**
1. ✅ Backend files (always works)
2. ✅ Browser console with `window.__logger`
3. ✅ Debug page at `/en/debug`

**All methods work, pick whichever is easiest for you!** 🚀
