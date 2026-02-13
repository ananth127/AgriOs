# EPIC-004: Testing Infrastructure

> **Status:** PROPOSED
> **Created:** 2026-02-06
> **Last Updated:** 2026-02-06
> **Owner:** Human Developer

---

## 1. Business / Technical Goal

Establish automated testing for both backend (pytest) and frontend (Jest/Vitest) to enable confident deployments and prevent regressions.

---

## 2. Affected Files & Systems

| Task | Files |
|---|---|
| Backend: Setup pytest | `backend/requirements.txt`, `backend/pytest.ini`, `backend/tests/` |
| Backend: Auth endpoint tests | `backend/tests/test_auth.py` |
| Backend: Farm management tests | `backend/tests/test_farm_management.py` |
| Backend: IoT endpoint tests | `backend/tests/test_iot.py` |
| Frontend: Setup Vitest | `frontend/package.json`, `frontend/vitest.config.ts` |
| Frontend: API client tests | `frontend/src/lib/__tests__/api.test.ts` |
| Frontend: Auth context tests | `frontend/src/lib/__tests__/auth-context.test.tsx` |
| CI Pipeline | GitHub Actions workflow |

---

## 3. Dependencies

- Test database configuration (SQLite for tests)
- Mock/fixture data

---

## 4. Risks & Unknowns

| Risk | Severity | Mitigation |
|---|---|---|
| Test setup delays feature development | LOW | Start with critical paths only |
| Tests may expose unknown bugs | MEDIUM | Document in KNOWN_ISSUES.md |

---

## 5. Acceptance Criteria

- [ ] `pytest` runs backend tests successfully
- [ ] Auth endpoints have full test coverage (register, login, me)
- [ ] Farm management CRUD has test coverage
- [ ] `npm test` runs frontend tests successfully
- [ ] API client has test coverage
- [ ] CI pipeline runs tests on every push
- [ ] Test failures block deployment

---

## 6. Rollback Plan

Not applicable — testing is additive and non-destructive.

---

## 7. Status History

| Date | Status | Notes |
|---|---|---|
| 2026-02-06 | PROPOSED | Created from RISK-005 |
