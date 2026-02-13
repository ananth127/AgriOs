# 🚀 Quick Setup Guide - Logging System

## ✅ Step 1: Register Backend Route

Edit `backend/app/main.py` and add:

```python
# Add this import at the top
from app.modules.logging import router as logging_router

# Add this with your other router registrations (around line 30-40)
app.include_router(logging_router, prefix"/v1")
```

## ✅ Step 2: Update Frontend Layout

**For App Router (Next.js 13+):**

Edit `frontend/src/app/[locale]/layout.tsx`:

```typescript
import ErrorBoundary from '@/lib/logger/ErrorBoundary';
import { LoggerProvider } from '@/lib/logger/useLogger';

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary boundaryName="RootLayout">
      <LoggerProvider>
        {children}
      </LoggerProvider>
    </ErrorBoundary>
  );
}
```

## ✅ Step 3: Test It!

### Test 1: Create an error

```typescript
// In any React component
import logger from '@/lib/logger';
import { LogCategory } from '@/lib/logger/types';

// Inside a function or useEffect
logger.error('Test error', LogCategory.SYSTEM, new Error('This is a test'));
```

### Test 2: Check the logs

Open browser console:
```javascript
// Get recent logs
const logger = (await import('@/lib/logger')).default;
const logs = await logger.getRecentLogs();
console.log('Recent logs:', logs);

// Get stats
const stats = logger.getStats();
console.log('Stats:', stats);
```

### Test 3: Check backend logs

Look in `backend/logs/` directory:
- `frontend-YYYY-MM-DD.jsonl` - All logs
- `errors-YYYY-MM-DD.jsonl` - Errors only

### Test 4: Test API endpoint

```bash
# Get stats
curl http://localhost:8000/api/v1/logs/stats

# Get recent logs
curl http://localhost:8000/api/v1/logs/recent?limit=10
```

## ✅ Step 4: Replace Existing Error Logs (Optional)

Find and replace console.error with logger.error:

```typescript
// Before
console.error('Failed to fetch data', error);

// After
import logger from '@/lib/logger';
import { LogCategory } from '@/lib/logger/types';

logger.error('Failed to fetch data', LogCategory.NETWORK, error);
```

## 🎯 Quick Test Script

Run this in your browser console after setup:

```javascript
(async () => {
  const { default: logger } = await import('/src/lib/logger/index.ts');
  const { LogCategory } = await import('/src/lib/logger/types.ts');
  
  // Test different log levels
  logger.debug('Debug test', LogCategory.SYSTEM);
  logger.info('Info test', LogCategory.SYSTEM);
  logger.warn('Warning test', LogCategory.SYSTEM);
  logger.error('Error test', LogCategory.SYSTEM, new Error('Test error'));
  
  // Check stats
  console.log('Logger stats:', logger.getStats());
  
  // Get recent logs
  const logs = await logger.getRecentLogs(10);
  console.log('Recent logs:', logs);
})();
```

## ❗ Common Issues

### Backend route not found (404)

**Fix:** Make sure you added the router import and registration in `main.py`

### Logs not showing in backend

**Fix:** Check that `backend/logs/` directory exists (it's created automatically)

### Network interception not working

**Fix:** Make sure `LoggerProvider` is in your root layout and wraps your app

### TypeScript errors

**Fix:** Run `npm install` to ensure all dependencies are installed

## 🎉 Done!

Your logging system is now active and capturing:
- ✅ All console errors
- ✅ Network requests
- ✅ Unhandled errors
- ✅ React component errors

Check the logs and start debugging with AI! 🤖
