# Comprehensive Logging System - Documentation

## 🎯 Overview

This logging system captures **ALL** errors, warnings, and application events to enable AI-powered debugging and root cause analysis.

### Features ✨

- ✅ **Automatic Error Capture**: All console errors, warnings, and unhandled exceptions
- ✅ **Network Request Logging**: Every API call with request/response details
- ✅ **User Action Tracking**: Clicks, navigation, form submissions
- ✅ **Performance Metrics**: Page load times, API latency, render performance
- ✅ **React Error Boundaries**: Component-level error catching
- ✅ **Offline Support**: IndexedDB storage with automatic sync
- ✅ **Privacy First**: Automatic sanitization of sensitive data
- ✅ **AI-Friendly**: Structured JSON logs optimized for AI analysis

---

## 📦 Installation Complete

The following files have been created:

### Frontend (`frontend/src/lib/logger/`)
- `types.ts` - TypeScript definitions
- `utils.ts` - Utility functions
- `storage.ts` - IndexedDB persistence
- `index.ts` - Core logger implementation
- `ErrorBoundary.tsx` - React error boundary
- `networkInterceptor.ts` - Fetch API interceptor
- `useLogger.tsx` - React hooks for initialization

### Backend (`backend/app/modules/logging/`)
- `routers.py` - FastAPI logging endpoints

---

## 🚀 Quick Start

### Step 1: Register Backend Route

Add the logging router to your FastAPI main app:

```python
# backend/app/main.py

from app.modules.logging import routers as logging_router

# Add this with your other routers
app.include_router(logging_router.router, prefix="/api/v1")
```

### Step 2: Initialize Logger in Frontend

**Option A: Using Hook (Recommended for Next.js App Router)**

```typescript
// app/layout.tsx or app/[locale]/layout.tsx

import { LoggerProvider } from '@/lib/logger/useLogger';
import ErrorBoundary from '@/lib/logger/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ErrorBoundary boundaryName="RootLayout">
          <LoggerProvider>
            {children}
          </LoggerProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Option B: Using Pages Router**

```typescript
// pages/_app.tsx

import logger from '@/lib/logger';
import ErrorBoundary from '@/lib/logger/ErrorBoundary';
import { interceptNetworkRequests } from '@/lib/logger/networkInterceptor';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize network interception
    interceptNetworkRequests();

    //Log app initialization
    logger.info('App initialized', 'system' as any);
  }, []);

  return (
    <ErrorBoundary boundaryName="App">
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
```

---

## 📖 Usage Examples

### 1. Manual Logging

```typescript
import logger from '@/lib/logger';
import { LogCategory } from '@/lib/logger/types';

// Info logging
logger.info('User logged in successfully', LogCategory.AUTH, {
  userId: user.id,
  method: 'email'
});

// Warning
logger.warn('API rate limit approaching', LogCategory.NETWORK, {
  remaining: 10,
  limit: 100
});

// Error logging
try {
  await riskyOperation();
} catch (error) {
  logger.error(
    'Failed to process payment',
    LogCategory.SYSTEM,
    error,
    { orderId: '12345', amount: 99.99 }
  );
}

// Fatal error
logger.fatal(
  'Database connection lost',
  LogCategory.DATABASE,
  error,
  { host: 'db.example.com' }
);
```

### 2. Network Logging (Automatic)

```typescript
// Network requests are automatically logged!
// Just use fetch as normal:

const response = await fetch('/api/v1/farms');
// ✅ Logged automatically with:
// - Request method, URL, headers, body
// - Response status, body, duration
// - Any errors
```

### 3. User Action Logging

```typescript
import logger from '@/lib/logger';

function MyButton() {
  const handleClick = (e: React.MouseEvent) => {
    logger.logUserAction({
      action: 'click',
      target: 'Add Farm Button',
      targetId: e.currentTarget.id,
      targetClass: e.currentTarget.className,
      metadata: {
        farmCount: farms.length
      }
    });
    
    // Your logic here
  };

  return <button onClick={handleClick}>Add Farm</button>;
}
```

### 4. Performance Logging

```typescript
import logger from '@/lib/logger';

// Measure operation performance
const startTime = Date.now();

await loadDashboardData();

logger.logPerformance({
  metric: 'dashboard_load',
  duration: Date.now() - startTime,
  details: {
    itemsLoaded: data.length,
    cacheHit: false
  }
});
```

### 5. Error Boundaries

```typescript
// Wrap sensitive components
import ErrorBoundary from '@/lib/logger/ErrorBoundary';

function DashboardPage() {
  return (
    <ErrorBoundary 
      boundaryName="Dashboard"
      fallback={<div>Dashboard temporarily unavailable</div>}
    >
      <ComplexDashboard />
    </ErrorBoundary>
  );
}
```

---

## 🔧 Configuration

### Environment-Specific Settings

```typescript
// Development: Verbose logging
const logger = getLogger({
  minLevel: LogLevel.DEBUG,
  environment: 'development',
  useRemoteStorage: false, // Store locally only
});

// Production: Errors and warnings only
const logger = getLogger({
  minLevel: LogLevel.WARN,
  environment: 'production',
  useRemoteStorage: true,
  batchInterval: 60000, // Upload every minute
});
```

### Privacy Configuration

```typescript
const logger = getLogger({
  sanitizeSensitiveData: true,
  excludeKeys: ['password', 'ssn', 'creditCard'],
  excludeHeaders: ['authorization', 'cookie'],
});
```

---

## 📊 Viewing Logs

### Frontend (Browser Console)

```typescript
// Get statistics
const stats = logger.getStats();
console.log(stats);

// Get recent logs
const logs = await logger.getRecentLogs(100);
console.log(logs);

// Get only errors
const errors = await logger.getLogsByLevel(LogLevel.ERROR);
console.log(errors);

// Clear all logs
await logger.clearLogs();
```

### Backend API

```bash
# Get log statistics
GET http://localhost:8000/api/v1/logs/stats

# Get recent logs
GET http://localhost:8000/api/v1/logs/recent?limit=100&level=error

# Clear old logs (older than 7 days)
DELETE http://localhost:8000/api/v1/logs/clear?days_old=7
```

### Log Files

Backend stores logs in `backend/logs/`:
- `frontend-YYYY-MM-DD.jsonl` - All logs
- `errors-YYYY-MM-DD.jsonl` - Errors only (for quick access)

Each line is a complete JSON log entry.

---

## 🤖 AI-Powered Debugging

The logs are structured for AI analysis. Example prompts:

```
Analyze the error logs from today and identify:
1. Most common errors
2. Patterns in failures
3. Suggested fixes

Use the logs in backend/logs/errors-2026-02-06.jsonl
```

Send log files to AI assistants for:
- Root cause analysis
- Bug pattern detection
- Performance optimization suggestions
- User experience insights

---

## 📈 Log Structure

Each log entry contains:

```json
{
  "id": "1707260257000-abc123",
  "level": "error",
  "category": "network",
  "message": "API request failed: GET /api/v1/farms",
  "context": {
    "userId": "user-123",
    "sessionId": "session-456",
    "url": "http://localhost:3000/en/farms",
    "route": "/en/farms",
    "deviceType": "desktop",
    "browser": "Chrome",
    "os": "Windows",
    "timestamp": "2026-02-06T23:30:00.000Z"
  },
  "networkLog": {
    "method": "GET",
    "url": "/api/v1/farms",
    "status": 500,
    "duration": 1234,
    "error": "Internal Server Error"
  }
}
```

---

## 🎨 Best Practices

### 1. Use Appropriate Log Levels

- **DEBUG**: Detailed development info
- **INFO**: General informational messages
- **WARN**: Warnings that don't break functionality
- **ERROR**: Errors that need attention
- **FATAL**: Critical failures

### 2. Add Context

```typescript
// ❌ Bad
logger.error('Failed');

// ✅ Good
logger.error(
  'Failed to create farm asset',
  LogCategory.SYSTEM,
  error,
  {
    farmId: 123,
    assetType: 'valve',
    userId: currentUser.id
  }
);
```

### 3. Don't Log Sensitive Data

```typescript
// ❌ Bad - Logs password
logger.info('User login attempt', LogCategory.AUTH, {
  email: user.email,
  password: user.password // NO!
});

// ✅ Good - Password excluded
logger.info('User login attempt', LogCategory.AUTH, {
  email: user.email,
  success: true
});
```

### 4. Use Error Boundaries Strategically

Wrap major sections, not every component:

```typescript
<ErrorBoundary boundaryName="Dashboard">
  {/* Entire dashboard */}
</ErrorBoundary>

<ErrorBoundary boundaryName="CropAnalytics">
  {/* Complex feature */}
</ErrorBoundary>
```

### 5. Monitor Performance Impact

Logging has minimal overhead, but:
- Batch uploads reduce network calls
- IndexedDB is async and non-blocking
- Sanitization adds slight processing time

---

## 🔍 Troubleshooting

### Logs not uploading to backend?

1. Check backend endpoint: `/api/v1/logs`
2. Verify `NEXT_PUBLIC_API_URL` environment variable
3. Check network tab for failed requests
4. Logs are stored locally even if upload fails

### IndexedDB not working?

- Check browser compatibility
- Verify user hasn't disabled IndexedDB
- Logs will still work (memory-only mode)

### Too many logs?

```typescript
// Adjust configuration
const logger = getLogger({
  minLevel: LogLevel.WARN, // Only warnings and errors
  batchInterval: 120000, // Upload less frequently
  maxLogsInStorage: 500, // Limit storage
});
```

---

## ✅ Next Steps

1. **Test the system**: Create an error and check if it's logged
2. **View logs**: Check `backend/logs/` directory
3. **Customize**: Adjust configuration for your needs
4. **Add to existing code**: Replace console.error with logger.error
5. **Monitor**: Check log stats regularly

---

## 🎯 Integration Checklist

- [ ] Backend route registered in `main.py`
- [ ] Logger initialized in `_app.tsx` or `layout.tsx`
- [ ] Error boundary added to root layout
- [ ] Network interceptor enabled
- [ ] Test error logging works
- [ ] Test network logging works
- [ ] Verify logs stored in `backend/logs/`
- [ ] Test log API endpoints
- [ ] Review privacy settings
- [ ] Deploy to production

---

**You now have enterprise-grade logging! 🎉**

For questions or issues, check the code comments or log files for debugging.
