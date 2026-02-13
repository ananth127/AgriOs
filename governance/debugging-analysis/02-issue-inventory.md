# Phase 2: Issue Inventory & Categorization (PRELIMINARY)

**Date:** 2026-02-06  
**Status:** Preliminary - Based on Code Exploration  
**Note:** This will be refined once user provides real-time error information

---

## 📊 ISSUE MATRIX

| ID | Page/Module | Issue Type | Severity | Status | Users Affected |
|----|-------------|------------|----------|--------|----------------|
| **ISS-001** | Smart Monitor / IoT | Database Schema | 🔴 CRITICAL | ⚠️ Uncertain | All |
| **ISS-002** | Build Process | TypeScript Errors | 🟠 HIGH | ✅ Fixed? | Developers |
| **ISS-003** | Smart Monitor | Missing API | 🟠 HIGH | ✅ Fixed? | All |
| **ISS-004** | Livestock | Database Schema | 🔴 CRITICAL | ✅ Fixed? | All |
| **ISS-005** | All Pages | Security/Auth | 🔴 CRITICAL | ✅ Fixed? | All Users |
| **ISS-006** | Global | Error Handling | 🟡 MEDIUM | 🔍 To Verify | All |
| **ISS-007** | Backend | Database Confusion | 🟠 HIGH | 🔍 To Verify | All |
| **ISS-008** | Frontend | Env Variables | 🟠 HIGH | 🔍 To Verify | All |
| **ISS-009** | Backend | Schema Consistency | 🟡 MEDIUM | 🔍 To Verify | All |
| **ISS-010** | Global | TODOs / Tech Debt | 🟢 LOW | 📝 Tracked | N/A |

---

## 🔴 CRITICAL ISSUES (System Breaking)

### ISS-001: IoT Devices Missing Database Columns
**Module:** Smart Monitor, IoT Devices  
**Doc Reference:** `FIX_DATABASE_COLUMNS.md`

**WHAT BREAKS:**
- Smart Monitor page fails to load
- API endpoint `/api/v1/iot/devices` returns 500 error
- Cannot view or manage IoT devices

**ERROR MESSAGE:**
```
ERROR: column iot_devices.status does not exist
INFO: "GET /api/v1/iot/devices HTTP/1.1" 500 Internal Server Error
```

**ROOT CAUSE:**
- Database migration ran while server was running
- SQLite file locking prevented column addition
- Server cached old schema in memory

**KNOWN FIX:** 
- Run `fix_iot_database.bat` with server stopped
- OR manually run `direct_sql_migration.py`
- OR delete database and reseed

**STATUS:** ⚠️ **UNCERTAIN** - Fix documented but unclear if applied to current database

**VERIFICATION NEEDED:**
```bash
cd backend
python -c "import sqlite3; conn = sqlite3.connect('agrios_dev.db'); cursor = conn.cursor(); cursor.execute('PRAGMA table_info(iot_devices)'); print([row[1] for row in cursor.fetchall()])"
```
Should include: `status` and `last_telemetry`

---

### ISS-004: Livestock Module Missing Tables
**Module:** Livestock Management  
**Doc Reference:** `LIVESTOCK_FIX_README.md`

**WHAT BREAKS:**
- Livestock page fails to load
- 422 Unprocessable Content error
- Cannot view feed plans, housing, health logs

**ERROR MESSAGE:**
```
GET http://[IP]:8000/api/v1/livestock/feed-plans
422 Unprocessable Content
```

**ROOT CAUSE:**
Missing database tables:
- `livestock_housing`
- `livestock_feed_plans`
- `livestock_production`
- `livestock_health_logs`
- Missing column: `livestock.housing_id`

**KNOWN FIX:**
- Run `fix_livestock_schema.py`
- Added table creation
- Added error handling to return `[]` instead of crashing

**STATUS:** ✅ **SHOULD BE FIXED** - But needs verification

**VERIFICATION NEEDED:**
```bash
cd backend
python check_livestock.py
```

---

### ISS-005: Multi-User Data Leakage (SECURITY)
**Module:** All data modules (farms, livestock, assets, crops)  
**Doc Reference:** `MULTI_USER_FIX.md`

**WHAT BREAKS:**
- User A can see User B's farm data
- Privacy violation
- Data integrity issues
- Potential data loss

**ROOT CAUSE:**
- Frontend used hardcoded `farm_id=1`
- No ownership checks on backend
- Auto-creation logic put data in wrong farms

**KNOWN FIX:**
- Added user_farm_service.py
- New endpoint: `/api/v1/farm-management/user-farm-id`
- Strict ownership enforcement:
  - Writes: Return 403 Forbidden
  - Reads: Return empty [] 
- Frontend now dynamically fetches user's farm ID
- Database cleanup script: `fix_user_farms.py`

**STATUS:** ✅ **SHOULD BE FIXED** - But needs live testing with multiple users

**VERIFICATION NEEDED:**
1. Create/login as User A → Create farm asset
2. Logout
3. Create/login as User B → Should NOT see User A's assets
4. Check browser console for 403 errors (shouldn't have any)

---

## 🟠 HIGH PRIORITY (Major Impact)

### ISS-002: Frontend Build TypeScript Errors
**Module:** Build Process  
**Doc Reference:** `FIX_SUMMARY.md`

**WHAT BREAKS:**
- `npm run build` fails
- Cannot deploy to production
- Development may work but production broken

**FILES AFFECTED:**
1. `LoanManager.tsx` - Type assertion issue
2. `InventoryManager.tsx` - Unknown type casting
3. `LaborManager.tsx` - Unknown type casting
4. `SmartShelterDashboard.tsx` - useEffect dependency
5. `PurchaseModal.tsx` - Next.js Image warning

**STATUS:** ✅ **SHOULD BE FIXED**

**VERIFICATION NEEDED:**
```bash
cd frontend
npm run build
```
Should complete without TypeScript errors.

---

### ISS-003: Missing IoT Update API Endpoint
**Module:** Smart Monitor  
**Doc Reference:** `FIX_FRONTEND_BUILD.md`

**WHAT BREAKS:**
- Cannot update IoT device settings
- Status toggle doesn't work
- Frontend has no way to call update endpoint

**ROOT CAUSE:**
- `api.iot.update()` method missing from `src/lib/api.ts`
- Backend missing `PUT /devices/{device_id}` endpoint

**KNOWN FIX:**
- Added `update` method to frontend API client
- Added `update_device` service function
- Added PUT endpoint to router
- Added `status` field to `IoTDeviceUpdate` schema

**STATUS:** ✅ **SHOULD BE FIXED**

**VERIFICATION NEEDED:**
1. Go to Smart Monitor
2. Toggle a device status
3. Should update without errors

---

### ISS-007: Database File Confusion
**Module:** Backend Database  
**Symptoms:** Unclear which database is being used

**DISCOVERY:**
Two `agrios_dev.db` files exist:
- `backend/agrios_dev.db` (487 KB)
- `agrios_dev.db` (root, 28 KB)

**SIZE DISCREPANCY:** 459 KB difference suggests different data!

**POSSIBLE ISSUES:**
1. Server using wrong database file
2. Migrations applied to wrong file
3. Data exists in one but not the other
4. Confusion about which to backup/restore

**SYMPTOMS:**
- Fix scripts may modify wrong database
- "Schrodinger's data" - exists in one file but not active one
- Hard to debug when looking at wrong database

**ROOT CAUSE HYPOTHESIS:**
- Initial setup created DB in root
- Later setup created DB in backend/
- Config may point to different files in different contexts

**VERIFICATION NEEDED:**
1. Check `backend/app/core/config.py` → What's the DATABASE_URL?
2. Check `.env` file → Any DATABASE_URL override?
3. Run backend with logging → Which file is opened?
4. Compare schemas of both files
5. Compare row counts of both files

**RECOMMENDED FIX:**
1. Determine which file is "truth"
2. Delete or rename the unused one
3. Update all scripts to use consistent path
4. Add `.gitignore` rule for database files

---

### ISS-008: Frontend Environment Variables Missing
**Module:** Frontend Configuration  
**Symptoms:** `.env.local` file is suspiciously small

**DISCOVERY:**
- `.env.local` = 48 bytes (actual config)
- `.env.local.example` = 521 bytes (example)

**SIZE RATIO:** Actual is only 9% of example size!

**LIKELY ISSUE:**
Most environment variables are missing from actual `.env.local`.

**POSSIBLE SYMPTOMS:**
- API calls fail (missing API_URL)
- Features disabled (missing feature flags)
- Analytics not working (missing GA4 key)
- Maps not loading (missing map API key)

**VERIFICATION NEEDED:**
1. Compare `.env.local` vs `.env.local.example`
2. Check for runtime errors related to undefined env vars
3. Browser console: Check for missing config warnings

**RECOMMENDED FIX:**
1. Review `.env.local.example`
2. Populate missing variables in `.env.local`
3. OR run encryption script if using encrypted env

---

## 🟡 MEDIUM PRIORITY (Noticeable Problems)

### ISS-006: Poor Error User Experience
**Module:** All frontend pages  
**Symptoms:** Many silent failures

**DISCOVERY:**
100+ `console.error()` calls found across frontend.

**COMMON PATTERNS:**
- "Failed to fetch X"
- "Failed to update Y"
- "Delete failed"
- Generic error logging without user feedback

**USER IMPACT:**
- Actions fail silently
- Users don't know what went wrong
- No recovery guidance
- Poor UX

**EXAMPLES:**
```typescript
// UserManager.tsx
.catch(error => {
    console.error("Failed to fetch data", error);
    // No user notification!
});

// CropAnalyticsDashboard.tsx
catch (error) {
    console.error("Failed to update valve status", error);
    // User clicked toggle, nothing happens!
}
```

**ROOT CAUSE:**
- Quick development without UX polish
- Missing toast/notification system integration
- Error boundaries not comprehensive

**RECOMMENDED FIX:**
1. Add global toast notification system
2. Replace console.error with user-visible errors
3. Add error recovery suggestions
4. Implement proper error boundaries

**PRIORITY:** Medium (functional but poor UX)

---

### ISS-009: Database Schema Consistency Concerns
**Module:** Backend Database  
**Symptoms:** Many manual fix/migration scripts

**DISCOVERY:**
25+ database scripts found:
- 10 × `fix_*.py`
- 5 × `migrate_*.py`
- 6 × `check_*.py`
- 6 × `debug_*.py`

**CONCERN:**
This suggests a history of:
- Schema mismatches
- Manual interventions
- Inconsistent state
- Migration failures

**POSSIBLE ISSUES:**
- Development vs production schema differences
- Local vs deployed database inconsistencies
- Hard to onboard new developers
- Risk of data corruption

**ROOT CAUSE HYPOTHESIS:**
- No formal migration system (e.g., Alembic)
- Manual schema changes
- SQLAlchemy metadata not source of truth
- Fast iteration without migration discipline

**RECOMMENDED FIX:**
1. Implement Alembic for migrations
2. Create baseline migration from current prod schema
3. Retire all manual fix scripts
4. Document migration process
5. Add schema validation on startup

**PRIORITY:** Medium (technical debt, future risk)

---

## 🟢 LOW PRIORITY (Minor Issues)

### ISS-010: Technical Debt (TODOs)
**Module:** Various  
**Count:** 4 TODO comments found

**LIST:**
1. `DiagnosisUploader.tsx:91` - Get real location
2. `iot/service.py:77` - Implement MQTT/SMS command processor
3. `farm_management/routers.py:327` - Add nested ownership check
4. `farm_management/routers.py:350` - Enforce marketplace ownership

**PRIORITY:** Low (future enhancements)

---

## 📊 PATTERN ANALYSIS

### Pattern 1: Database-Related Issues (Most Common)
**Issues:** ISS-001, ISS-004, ISS-007, ISS-009

**Common Thread:**
- Database schema inconsistencies
- Migration timing issues
- SQLite locking problems
- Multiple database files

**ROOT CAUSE:**
- Lack of formal migration system
- Running migrations while server active
- Poor database path management

**SOLUTION CLUSTER:**
1. Implement Alembic migrations
2. Standardize database location
3. Add pre-migration validation
4. Document migration process

---

### Pattern 2: "Fixed But Uncertain" Status
**Issues:** ISS-001, ISS-002, ISS-003, ISS-004, ISS-005

**Common Thread:**
All have fix documentation but unclear if:
- Fix was actually applied
- Fix is still effective
- Database still has changes
- Code changes are deployed

**SOLUTION:**
Need systematic verification of all claimed fixes before proceeding.

---

### Pattern 3: User Experience Gaps
**Issues:** ISS-006, ISS-008

**Common Thread:**
- Poor error messaging
- Silent failures
- Missing configuration
- No user guidance

**ROOT CAUSE:**
- Fast iteration prioritizing features over UX
- Missing notification/toast system
- Incomplete error handling

**SOLUTION:**
- Add comprehensive error handling layer
- Implement toast notifications
- User-friendly error messages
- Error recovery guidance

---

## 🎯 RECOMMENDED PRIORITIZATION

### Immediate (Do First):
1. **Verify all "Fixed" items** (ISS-001 through ISS-005)
   - Run verification scripts
   - Check database schema
   - Test in live application
   - Confirm fixes are active

2. **Resolve Database Confusion** (ISS-007)
   - Determine which DB is active
   - Consolidate to single source
   - Update all scripts

3. **Check Environment Variables** (ISS-008)
   - Populate missing vars
   - Test critical features (API calls, maps, etc.)

### Short-term (Next):
4. **Improve Error UX** (ISS-006)
   - Add toast system
   - Replace console.error with notifications

5. **Test Multi-User Isolation** (ISS-005 verification)
   - Create test users
   - Verify data isolation
   - Check for 403 errors

### Long-term (Technical Debt):
6. **Implement Formal Migrations** (ISS-009)
   - Set up Alembic
   - Create baseline
   - Retire manual scripts

7. **Address TODOs** (ISS-010)
   - Prioritize by business value
   - Schedule implementation

---

## ⏭️ NEXT PHASE: ROOT CAUSE HYPOTHESES

Once user provides current state information, we will:

1. **Verify Each "Fixed" Issue**
   - Test in running application
   - Check database state
   - Confirm no regression

2. **For Any Broken Issues:**
   - Form hypotheses about why fix didn't work
   - Design diagnostic experiments
   - Systematic investigation

3. **For New Issues User Reports:**
   - Add to inventory
   - Categorize by severity
   - Form hypotheses
   - Investigate systematically

---

*Awaiting user input to transition to Phase 3 (Hypothesis Formation)*
