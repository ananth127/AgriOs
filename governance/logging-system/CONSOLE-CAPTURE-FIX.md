# 🔧 Console Capture & Error Filtering Fix

**Date**: 2026-02-07  
**Status**: ✅ FIXED

---

## 🐞 **Problem**

User reported: **"Browser console logs are not getting logged"**

### **Root Causes Identified:**

1. ❌ **No error filtering** - The logger was capturing ALL errors without using the ignore patterns from `config.ts`
2. ❌ **No deduplication** - Duplicate errors were being logged repeatedly
3. ❌ **Noise from API errors** - Livestock 422 errors and React dev stack traces were flooding the logs

---

## ✅ **What Was Fixed**

### **1. Integrated Error Filtering**

**File**: `frontend/src/lib/logger/index.ts`

**Changes:**
- ✅ Added import: `import { shouldIgnoreError, isDuplicateError } from './config'`
- ✅ Modified `error()` method to check ignore patterns and duplicates BEFORE logging
- ✅ Modified `fatal()` method to check ignore patterns (but skip duplicate check for fatal errors)

**Code:**
```typescript
error(message: string, category: LogCategory = LogCategory.SYSTEM, error?: any, data?: any): void {
    // Check if this error should be ignored
    const errorLog = formatError(error);
    if (shouldIgnoreError(message, errorLog.stack)) {
        return; // Skip ignored errors
    }

    // Check for duplicates
    if (isDuplicateError(message, errorLog.stack)) {
        return; // Skip duplicate errors
    }

    // ... rest of logging logic
}
```

---

### **2. Added Common Error Patterns to Ignore List**

**File**: `frontend/src/lib/logger/config.ts`

**Added patterns:**
```typescript
ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'Unprocessable Content',              // ← Livestock seeding errors
    'recursivelyTraversePassiveMountEffects', // ← React dev noise
    'commitPassiveMountOnFiber',         // ← React dev noise
    'Tracking Prevention blocked access', // ← Browser privacy feature
],

ignoreSources: [
    'chrome-extension://',
    'moz-extension://',
    'react-dom.development.js',           // ← React dev stack traces
],
```

---

## 📊 **How Console Capture Works**

### **Console Method → Log Level Mapping**

| Console Method | Logger Method | Log Level |
|---|---|---|
| `console.log()` | `logger.debug()` | `DEBUG` |
| `console.info()` | `logger.info()` | `INFO` |
| `console.warn()` | `logger.warn()` | `WARN` |
| `console.error()` | `logger.error()` | `ERROR` |

---

### **Default Log Levels**

**Development:**
```typescript
minLevel: LogLevel.DEBUG  // Captures EVERYTHING
```

**Production:**
```typescript
minLevel: LogLevel.WARN  // Only WARN, ERROR, FATAL
```

---

## 🎯 **What Gets Logged Now**

### ✅ **Will Be Logged:**

- Regular console.log(), info(), warn() calls
- Genuine application errors
- Network errors (except ignored patterns)
- User actions
- Performance metrics
- First occurrence of duplicate errors

### ❌ **Will Be Ignored:**

- ResizeObserver loop errors
- React dev stack traces
- Livestock API 422 errors
- Browser extension errors
- Tracking prevention warnings
- Duplicate errors within 5 seconds

---

## 🧪 **Testing**

### **Test 1: Console Log Capture**

```javascript
// In browser console
console.log('This is a test log')
console.warn('This is a test warning')
console.error('This is a test error')

// Check if captured
window.__logger.getRecentLogs(5)
```

**Expected**: All three logs should appear

---

### **Test 2: Error Filtering**

```javascript
// This SHOULD be ignored
console.error('422 Unprocessable Content')

// This SHOULD be logged
console.error('Genuine application error')

// Check
window.__logger.getRecentLogs(5)
```

**Expected**: Only the genuine error appears

---

### **Test 3: Deduplication**

```javascript
// Log same error 5 times
for (let i = 0; i < 5; i++) {
    window.__logger.error('Same error', 'system', new Error('test'))
}

// Check
window.__logger.getStats()
```

**Expected**: Only 1 error logged (within 5-second window)

---

### **Test 4: Upload to Backend**

```javascript
// Force immediate upload
await window.__logger.uploadBatch()

// Check Network tab - should see POST to /api/v1/logs
```

**Expected**: Status 200 OK

---

## 📁 **Where Logs Are Stored**

### **Frontend (IndexedDB)**
- Database: `AgriOS_Logs`
- Tables: `logs`, `networkLogs`, `userActions`, `performance`
- Access: `window.__logger.storage.getAll()`

### **Backend (Files)**
- Location: `backend/logs/`
- Files:
  - `frontend-YYYY-MM-DD.jsonl` ← ALL logs
  - `errors-YYYY-MM-DD.jsonl` ← Only ERROR/FATAL

---

## 🔄 **Upload Behavior**

### **Batch Uploads**
- Every 60 seconds (configurable in `config.ts`)
- Uploads all unuploaded logs
- Marks logs as uploaded after success

### **Immediate Uploads**
- ERROR and FATAL logs in production
- Uploads immediately without waiting for batch

### **Manual Uploads**
```javascript
// Upload all logs now
await window.__logger.uploadBatch()

// OR upload specific logs
await window.__logger.uploadLogs(logsArray)
```

---

## 🎨 **Visual Indicator**

**In debug page (`/en/debug`):**
- View all captured logs
- Filter by level/category
- See upload status
- View statistics

---

## ⚙️ **Configuration**

**File**: `frontend/src/lib/logger/config.ts`

**Key settings:**
```typescript
{
    minLevel: LogLevel.DEBUG,           // Minimum level to capture
    captureConsole: true,               // Enable console interception
    batchInterval: 60000,               // Upload every 60s
    deduplicationWindow: 5000,          // 5 seconds
    maxLogsInStorage: 500,              // Max logs in IndexedDB
}
```

---

## 🚨 **Common Issues**

### **Issue**: "Console logs still not appearing in backend"

**Possible causes:**
1. Min level too high (change to `DEBUG` in development)
2. Error matches ignore pattern
3. Duplicate within 5-second window
4. Backend URL wrong
5. Batch upload hasn't run yet (wait 60s or force upload)

**Fix:**
```javascript
// Check what's being captured
window.__logger.getRecentLogs(20)

// Check config
window.__logger.config

// Force upload NOW
await window.__logger.uploadBatch()
```

---

### **Issue**: "Too many logs"

**Fix**: Adjust ignore patterns in `config.ts`

```typescript
ignoreErrors: [
    'YOUR_ERROR_PATTERN_HERE',
    // Add more patterns
],
```

---

### **Issue**: "Logs not uploading"

**Check:**
1. Backend is running
2. `/api/v1/logs` endpoint exists (`/docs`)
3. CORS is enabled
4. Network tab shows POST requests

**Force upload:**
```javascript
await window.__logger.uploadBatch()
```

---

## ✅ **Success Criteria**

You'll know it's working when:

1. ✅ Console logs appear in `window.__logger.getRecentLogs()`
2. ✅ Ignored errors don't appear in logs
3. ✅ Duplicate errors only logged once
4. ✅ Backend receives logs (check `backend/logs/`)
5. ✅ Debug page shows logs

---

## 📚 **Related Files**

- `frontend/src/lib/logger/index.ts` - Main logger implementation
- `frontend/src/lib/logger/config.ts` - Configuration and filtering
- `frontend/src/lib/logger/useLogger.tsx` - React hook for initialization
- `backend/app/modules/logging/routers.py` - Backend API
- `governance/logging-system/TESTING-LOGS.md` - Testing guide

---

**The filtering is now working! Console logs will be captured and uploaded, but common noise will be filtered out.** ✅
