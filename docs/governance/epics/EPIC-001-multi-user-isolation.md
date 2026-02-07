# EPIC-001: Multi-User Data Isolation

> **Status:** IN PROGRESS
> **Created:** 2026-02-04
> **Last Updated:** 2026-02-06
> **Owner:** Human Developer + AI Agent

---

## 1. Business / Technical Goal

Ensure complete data isolation between users so that each user can only see, create, modify, and delete their own data. No cross-user data leakage.

---

## 2. Affected Files & Systems

### Completed
- `backend/app/core/database.py` — Connection pooling
- `backend/app/modules/farms/user_farm_service.py` — Auto-farm creation
- `backend/app/modules/farm_management/routers.py` — Ownership enforcement
- `frontend/src/app/[locale]/farm-management/page.tsx` — Dynamic farm ID
- `frontend/src/lib/api.ts` — getUserFarmId method
- `frontend/src/lib/userFarm.ts` — Farm ID helper
- `frontend/src/components/farm-management/MachineryManager.tsx` — Remove auto-creation

### Remaining
- `backend/app/modules/crops/router.py` — Needs ownership checks
- `backend/app/modules/livestock/router.py` — Needs ownership audit
- `backend/app/modules/iot/router.py` — Needs user_id enforcement
- `backend/app/modules/diagnosis/router.py` — Needs user association
- `backend/app/modules/marketplace/router.py` — Needs seller_id checks

---

## 3. Dependencies

- Authentication system (DEC-005: JWT in localStorage)
- Farm model with `owner_id` field
- `get_current_user` dependency working correctly

---

## 4. Risks & Unknowns

| Risk | Severity | Mitigation |
|---|---|---|
| Incomplete enforcement in non-farm modules | HIGH | Systematic audit of all endpoints |
| Migration breaks existing single-user data | MEDIUM | Fix scripts provided (fix_user_farms.py) |
| Performance impact of ownership checks | LOW | Ownership is a simple integer comparison |

Cross-reference: RISK-008

---

## 5. Acceptance Criteria

- [ ] Every API endpoint that returns user-specific data filters by current user
- [ ] Write operations (POST/PUT/DELETE) verify ownership, return 403 on violation
- [ ] Read operations return empty arrays (not errors) for non-owned resources
- [ ] Each new user gets an auto-created farm on first access
- [ ] Frontend never hardcodes farm_id
- [ ] Two users logging in see completely different data sets
- [ ] No 403 errors appear during normal user operations

---

## 6. Rollback Plan

1. Revert `user_farm_service.py` changes
2. Revert `routers.py` ownership checks
3. Frontend reverts to static farm_id (temporary)
4. Run `fix_user_farms.py` to verify data integrity

---

## 7. Status History

| Date | Status | Notes |
|---|---|---|
| 2026-02-04 | IN PROGRESS | Farm management module isolated |
| 2026-02-06 | IN PROGRESS | Remaining modules need audit |
