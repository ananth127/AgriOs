# ⚡ Logger Quick Reference Card

## 🚀 3-Step Setup

```python
# 1. Backend (main.py)
from app.modules.logging import router as logging_router
app.include_router(logging_router, prefix="/api/v1")
```

```typescript
// 2. Frontend (layout.tsx)
import ErrorBoundary from '@/lib/logger/ErrorBoundary';
import { LoggerProvider } from '@/lib/logger/useLogger';

<ErrorBoundary><LoggerProvider>{children}</LoggerProvider></ErrorBoundary>
```

```typescript
// 3. Test it!
import logger from '@/lib/logger';
logger.error('Test error', 'system' as any, new Error('Test'));
```

---

## 📝 Common Usage

### Log Levels
```typescript
logger.debug('Debug message', category);
logger.info('Info message', category);
logger.warn('Warning message', category);
logger.error('Error message', category, error, data);
logger.fatal('Fatal error', category, error, data);
```

### Categories
```typescript
import { LogCategory } from '@/lib/logger/types';

LogCategory.SYSTEM        // System errors
LogCategory.NETWORK       // API/Network issues
LogCategory.USER_ACTION   // User interactions
LogCategory.STATE_CHANGE  // State updates
LogCategory.PERFORMANCE   // Performance metrics
LogCategory.AUTH          // Authentication
LogCategory.DATABASE      // Database operations
LogCategory.RENDER        // React rendering
```

### Error Logging
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error(
    'Operation failed',
    LogCategory.SYSTEM,
    error,
    { operationId: '123', userId: 'user-456' }
  );
}
```

### Network (Auto-Logged)
```typescript
// Just use fetch - it's automatic!
await fetch('/api/endpoint');
// ✅ Logged automatically
```

### User Actions
```typescript
logger.logUserAction({
  action: 'click',
  target: 'Save Button',
  targetId: 'save-btn',
  metadata: { formValid: true }
});
```

### Performance
```typescript
const start = Date.now();
await operation();
logger.logPerformance({
  metric: 'operation_duration',
  duration: Date.now() - start
});
```

---

## 🔍 View Logs

### Browser Console
```javascript
const logger = (await import('@/lib/logger')).default;

// Get stats
logger.getStats();

// Recent logs
await logger.getRecentLogs(100);

// Errors only
await logger.getLogsByLevel('error');

// Clear all
await logger.clearLogs();
```

### Backend API
```bash
# Stats
curl http://localhost:8000/api/v1/logs/stats

# Recent logs
curl http://localhost:8000/api/v1/logs/recent?limit=10&level=error

# Clear old logs
curl -X DELETE http://localhost:8000/api/v1/logs/clear?days_old=7
```

### Log Files
```bash
# View today's logs
cat backend/logs/frontend-2026-02-06.jsonl

# View today's errors
cat backend/logs/errors-2026-02-06.jsonl

# Count errors
wc -l backend/logs/errors-*.jsonl
```

---

## 🎨 UI Components

### Error Boundary
```typescript
<ErrorBoundary 
  boundaryName="MyComponent"
  fallback={<ErrorMessage />}
>
  <MyComponent />
</ErrorBoundary>
```

### Log Viewer
```typescript
// Create a debug page
import LogViewer from '@/lib/logger/LogViewer';

export default function DebugPage() {
  return <LogViewer />;
}
```

---

## ⚙️ Configuration

```typescript
import { getLogger } from '@/lib/logger';
import { LogLevel, LogCategory } from '@/lib/logger/types';

const logger = getLogger({
  // Log level
  minLevel: LogLevel.INFO,
  
  // Categories to capture
  enabledCategories: [
    LogCategory.ERROR,
    LogCategory.NETWORK,
  ],
  
  // Storage
  useLocalStorage: true,
  useRemoteStorage: true,
  remoteEndpoint: '/api/v1/logs',
  
  // Batching
  batchSize: 50,
  batchInterval: 30000, // 30s
  
  // Privacy
  sanitizeSensitiveData: true,
  excludeKeys: ['password', 'token'],
  
  // Limits
  maxLogsInMemory: 100,
  maxLogsInStorage: 1000,
  
  // Environment
  environment: 'production',
  enableInProduction: true,
});
```

---

## 📊 What Gets Logged

Every log includes:
- ✅ Unique ID
- ✅ Log level & category
- ✅ Message
- ✅ User ID (if logged in)
- ✅ Session ID
- ✅ URL & route
- ✅ Device type
- ✅ Browser & OS
- ✅ Timestamp
- ✅ Time in session
- ✅ Custom metadata

Network logs include:
- ✅ Method & URL
- ✅ Request body
- ✅ Response status
- ✅ Response body
- ✅ Duration
- ✅ Errors

---

## 🛠️ Troubleshooting

**Logs not uploading?**
- Check `NEXT_PUBLIC_API_URL` env variable
- Verify backend route is registered
- Check network tab for failed requests

**IndexedDB not working?**
- Check browser compatibility
- Logs will still work (memory-only)

**Too many logs?**
- Increase `minLevel` to WARN or ERROR
- Reduce enabled categories
- Increase `batchInterval`

---

## 🤖 AI Debugging

### Example workflow:
1. Error occurs → Logged automatically
2. Check `backend/logs/errors-YYYY-MM-DD.jsonl`
3. Send to AI:
   ```
   Analyze these errors and suggest fixes:
   [paste log entries]
   ```
4. AI provides:
   - Root cause analysis
   - Patterns detected
   - Suggested fixes
   - Prevention strategies

---

## 📁 Files Created

### Frontend
- `frontend/src/lib/logger/types.ts`
- `frontend/src/lib/logger/utils.ts`
- `frontend/src/lib/logger/storage.ts`
- `frontend/src/lib/logger/index.ts`
- `frontend/src/lib/logger/ErrorBoundary.tsx`
- `frontend/src/lib/logger/networkInterceptor.ts`
- `frontend/src/lib/logger/useLogger.tsx`
- `frontend/src/lib/logger/LogViewer.tsx`

### Backend
- `backend/app/modules/logging/routers.py`
- `backend/app/modules/logging/__init__.py`

### Docs
- `frontend/src/lib/logger/README.md`
- `frontend/src/lib/logger/SETUP.md`
- `governance/logging-system/IMPLEMENTATION-SUMMARY.md`
- `governance/logging-system/ARCHITECTURE.md`

---

## ✅ Quick Checklist

- [ ] Backend route registered
- [ ] Frontend initialized
- [ ] Test error logged
- [ ] Logs appear in backend/logs/
- [ ] Network logging works
- [ ] Error boundary tested
- [ ] Log viewer accessible
- [ ] Production config set

---

**Need help?** Check `README.md` for full documentation!
