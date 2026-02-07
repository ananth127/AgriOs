# Testing Checklist - Phase 5

**Date:** 2026-02-06  
**Purpose:** Verify all fixes are working correctly  
**Estimated Time:** 15-20 minutes

---

## 🧪 PRE-FLIGHT CHECKS

### ✅ Step 0: Review What Was Fixed

Quick review:
- [x] Database confusion resolved (ISS-007)
- [x] IoT columns verified present (ISS-001)
- [x] Livestock tables verified present (ISS-004)
- [x] Security: .enva protected
- [x] Archive directory protected

---

## 📋 TESTING PROCEDURES

### Test 1: Security Check ⚡ CRITICAL

**Command:**
```bash
git log --all --full-history -- "*/.enva"
```

**What it checks:** Whether production credentials were ever committed to git

**Expected Result:** ✅ No output (empty)

**If you see output:** 🚨 CRITICAL
- [ ] Note the commit hash(es)
- [ ] Contact me immediately for credential rotation procedure

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 2: Frontend Build ⚡ HIGH PRIORITY

**Command:**
```cmd
cd frontend
npm run build
```

**What it checks:** TypeScript errors (ISS-002)

**Expected Result:** ✅ Build completes successfully

**Common Issues:**
- If PowerShell blocks: Use Command Prompt instead
- If module errors: Run `npm install` first

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 3: Backend Startup

**Command:**
```cmd
cd backend
uvicorn app.main:app --reload
```

**What it checks:** Backend starts without database errors

**Expected Result:** ✅ Server starts on port 8000

**Watch for:**
- Database connection messages
- Any SQLAlchemy errors
- Table/column errors

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 4: Frontend Startup

**Command:**
```cmd
cd frontend
npm run dev
```

**What it checks:** Frontend starts without errors

**Expected Result:** ✅ Server starts on port 3000

**Watch for:**
- Module errors
- Environment variable warnings
- Build errors

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 5: Smart Monitor Page (ISS-001 Verification)

**URL:** http://localhost:3000/en/smart-monitor

**What it checks:** IoT devices table columns

**Expected Result:** ✅ Page loads, shows IoT devices

**Watch for:**
- Network tab: No 500 errors on /api/v1/iot/devices
- Console: No "column does not exist" errors
- Page: Devices list displays

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 6: Livestock Page (ISS-004 Verification)

**URL:** http://localhost:3000/en/livestock

**What it checks:** Livestock tables exist

**Expected Result:** ✅ Page loads, shows livestock sections

**Watch for:**
- Network tab: No 422 errors on /api/v1/livestock/*
- Console: No table missing errors
- Page: Sections display correctly

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 7: Farm Management Page

**URL:** http://localhost:3000/en/farm-management

**What it checks:** General functionality

**Expected Result:** ✅ Page loads, shows farm assets

**Watch for:**
- Any console errors
- Network errors
- Page rendering issues

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 8: IoT Device Update (ISS-003 Verification)

**Location:** Smart Monitor page

**What it checks:** Device status toggle works

**Steps:**
1. Go to Smart Monitor
2. Find an IoT device
3. Try to toggle its status or update settings

**Expected Result:** ✅ Update succeeds without errors

**Watch for:**
- Network tab: PUT request succeeds
- Console: No errors
- UI: Status updates

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Notes:**
_________________________________

---

### Test 9: Multi-User Isolation (ISS-005 Verification) [OPTIONAL]

**What it checks:** Users can't see each other's data

**Steps:**
1. Login as User A
2. Create a farm asset
3. Logout
4. Create/login as User B
5. Check if User B can see User A's asset

**Expected Result:** ✅ User B cannot see User A's data

**Watch for:**
- Console: 403 Forbidden errors (good!)
- Assets: Only User B's data visible
- Network: Ownership checks working

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED / [ ] NOT APPLICABLE

**Notes:**
_________________________________

---

### Test 10: Browser Console Review

**Location:** All pages

**What it checks:** No unexpected errors

**Steps:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Navigate through main pages
4. Note any errors

**Expected Result:** ✅ No critical errors (warnings OK)

**Status:** [ ] PASS / [ ] FAIL / [ ] SKIPPED

**Errors Found:**
_________________________________

---

## 📊 RESULTS SUMMARY

### Tests Run:
- Total: ___ / 10
- Passed: ___
- Failed: ___
- Skipped: ___

### Issues Found:
[ ] None - All tests passed! ✅
[ ] Some issues - Details below
[ ] Critical issues - Need immediate attention

### Issue Details (if any):
_________________________________
_________________________________
_________________________________

---

## ⏭️ NEXT STEPS BASED ON RESULTS

### ✅ If All Tests Pass:
1. Celebrate! 🎉
2. Move to Phase 7: Prevention Measures
3. Document best practices
4. Close issue tracker

### ⚠️ If Some Tests Fail:
1. Note which tests failed
2. Copy error messages
3. Share with me for Phase 6 investigation
4. We'll debug systematically

### 🚨 If Critical Security Issue:
1. Stop immediately
2. Share git log output
3. Prepare for credential rotation
4. Update production environment

---

## 📝 REPORTING RESULTS

**After completing tests, share:**

1. **Overall status:** All pass / Some fail / Major issues
2. **Failed test numbers:** (e.g., Test 2, Test 5)
3. **Error messages:** Copy from console/terminal
4. **Screenshots:** If helpful

**Post in chat:**
```
Test Results:
- Passed: X/10
- Failed: Y/10
- Issues: [Brief description]
```

---

## 💡 TIPS

### Windows Command Prompt vs PowerShell:
- Use **Command Prompt** for npm commands if PowerShell blocks
- Use **PowerShell** for git commands

### If Build Hangs:
- Ctrl+C to cancel
- Try `npm install` first
- Check for Node.js version (should be 18+)

### If Server Won't Start:
- Check if another instance is running
- Verify port 8000 (backend) and 3000 (frontend) are free
- Review terminal output for specific errors

---

**Remember:** The goal is to verify fixes, not to fix new issues during testing.  
Just note what works and what doesn't - we'll handle any issues in Phase 6.

---

*Good luck with testing! 🚀*
