# 🧪 Testing the Logging System

## ❓ **Current Status**

✅ **Frontend**: Logs appear on `/en/debug` page  
❌ **Backend**: `backend/logs/` folder is empty

**This means:** Logs are being captured but NOT uploaded to backend.

---

## 🔍 **Why Aren't Logs Uploading?**

### **Possible Reasons:**

1. **Batch interval not reached** - Upload happens every 60 seconds
2. **Backend endpoint not reachable** - Network error
3. **CORS issue** - Backend blocking requests
4. **Endpoint URL wrong** - Pointing to wrong server

---

## ✅ **Step-by-Step Testing**

### **Test 1: Check If Backend Route Exists**

Visit: `http://192.168.1.106:8000/docs`

**Look for these endpoints:**
- ✅ `POST /api/v1/logs`
- ✅ `GET /api/v1/logs/stats`  
- ✅ `GET /api/v1/logs/recent`

**If you DON'T see them:** Backend didn't restart properly. Restart again.

---

### **Test 2: Manual Upload Test**

**In browser console (`F12`):**

```javascript
// 1. Create a test error
window.__logger.error('TEST: Manual upload test', 'system', new Error('Testing!'))

// 2. Force immediate upload (don't wait 60s)
window.__logger.uploadLogs(await window.__logger.storage.getAll())

// 3. Check if it worked
// Open Network tab, look for POST to /api/v1/logs
```

**Expected:**
- ✅ You see `POST http://192.168.1.106:8000/api/v1/logs` with status `200`
- ✅ Files appear in `backend/logs/`

**If it FAILS:**
- ❌ Status `404` → Backend route not registered
- ❌ Status `500` → Backend error (check terminal)
- ❌ Network error → Backend not running or wrong URL

---

### **Test 3: Check Current Endpoint URL**

```javascript
// In browser console
window.__logger.config.remoteEndpoint
```

**Should show:**
- Development: `http://192.168.1.106:8000/api/v1/logs`
- Or your `NEXT_PUBLIC_API_URL` + `/logs`

**If it's WRONG:**
Check your `.env` file:
```bash
NEXT_PUBLIC_API_URL=http://192.168.1.106:8000/api/v1
```

---

### **Test 4: Check Backend Logs**

**In backend terminal, you should see:**
```
INFO:     192.168.1.x:xxxxx - "POST /api/v1/logs HTTP/1.1" 200 OK
```

**If you DON'T see this:** Requests aren't reaching the backend.

---

### **Test 5: Direct cURL Test**

**Test the endpoint directly:**

```powershell
curl -X POST http://192.168.1.106:8000/api/v1/logs `
  -H "Content-Type: application/json" `
  -d '{\"logs\": [{\"id\":\"test-123\",\"level\":\"error\",\"category\":\"system\",\"message\":\"Direct test\",\"context\":{\"sessionId\":\"test\",\"userAgent\":\"test\",\"url\":\"test\",\"route\":\"/test\",\"screenWidth\":1920,\"screenHeight\":1080,\"deviceType\":\"desktop\",\"os\":\"Windows\",\"browser\":\"Chrome\",\"environment\":\"development\",\"timestamp\":\"2026-02-07T00:00:00Z\",\"timeInSession\":0},\"uploaded\":false,\"uploadAttempts\":0}]}'
```

**Expected:**
```json
{
  "success": true,
  "received": 1,
  "errors": 1,
  "message": "Successfully stored 1 logs"
}
```

**Then check:**
```powershell
Get-ChildItem backend\logs\
Get-Content backend\logs\errors-2026-02-07.jsonl
```

You should see your test log!

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: Backend Route Not Found (404)**

**Fix:**
```bash
# Restart backend
# In backend directory
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### **Issue 2: CORS Error**

**Error:** `Access to fetch blocked by CORS policy`

**Fix:** Backend `main.py` already has CORS enabled (`allow_origins=["*"]`)

If still blocked, check if backend is using a different port.

---

### **Issue 3: Wrong Endpoint URL**

**Fix:** Update `.env.local` in frontend:

```bash
NEXT_PUBLIC_API_URL=http://192.168.1.106:8000/api/v1
```

Then restart frontend: `npm run dev`

---

### **Issue 4: Network Not Reachable**

**Check:**
1. Backend is running: `http://192.168.1.106:8000/`
2. You can access it from browser
3. No firewall blocking

---

## 📊 **Expected Behavior**

### **Working System:**

1. User action → Error occurs
2. Logger captures it → Stores in IndexedDB
3. Every 60 seconds → Batch upload to backend
4. Backend stores → Files created in `backend/logs/`

### **File Structure:**

```
backend/logs/
├── frontend-2026-02-07.jsonl    ← ALL logs
├── errors-2026-02-07.jsonl      ← Only errors
├── frontend-2026-02-06.jsonl    ← Yesterday
└── errors-2026-02-06.jsonl
```

---

## 🎯 **Quick Diagnostic**

Run these commands in browser console:

```javascript
// 1. Check logger exists
window.__logger

// 2. Check stats
window.__logger.getStats()

// 3. Check recent logs
window.__logger.getRecentLogs(5)

// 4. Check endpoint
window.__logger.config.remoteEndpoint

// 5. Force upload NOW
window.__logger.uploadBatch()
```

**Watch Network tab while doing #5!**

---

## ✅ **Success Criteria**

You'll know it's working when:

1. ✅ `/docs` shows the logging endpoints
2. ✅ Manual upload shows `200 OK` in Network tab
3. ✅ Files appear in `backend/logs/`
4. ✅ Backend terminal shows POST requests
5. ✅ File contents are valid JSONL

---

**Next:** Run Test 1-5 above and report what happens!
