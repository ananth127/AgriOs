# EPIC-003: Database Migration System

> **Status:** PROPOSED
> **Created:** 2026-02-06
> **Last Updated:** 2026-02-06
> **Owner:** Human Developer

---

## 1. Business / Technical Goal

Replace the current `create_all()` + ad-hoc fix scripts approach with a proper database migration system (Alembic). Enable safe, reversible schema changes with full migration history.

---

## 2. Affected Files & Systems

| Task | Files |
|---|---|
| Install and configure Alembic | `backend/requirements.txt`, `backend/alembic.ini`, `backend/alembic/` |
| Generate initial migration | All model files |
| Convert fix scripts to migrations | `backend/fix_*.py`, `backend/migrate_*.py` |
| Remove /fix-db endpoint | `backend/main.py` |
| Remove startup create_all() | `backend/main.py:32` |
| Clean up orphaned scripts | `backend/*.py` (30+ files) |

---

## 3. Dependencies

- PostgreSQL database access (for migration testing)
- Complete audit of current schema vs models

---

## 4. Risks & Unknowns

| Risk | Severity | Mitigation |
|---|---|---|
| Initial migration may not match existing production schema | HIGH | Dump current prod schema, compare with model definitions |
| Alembic autogenerate may miss custom types (PostGIS) | MEDIUM | Manual review of generated migrations |
| Removing create_all() breaks fresh dev setup | LOW | Alembic `upgrade head` replaces it |

---

## 5. Acceptance Criteria

- [ ] Alembic configured and initial migration generated
- [ ] `alembic upgrade head` creates all tables from scratch
- [ ] `alembic downgrade -1` safely rolls back last migration
- [ ] `/fix-db` endpoint removed
- [ ] Startup `create_all()` removed
- [ ] All still-needed fix scripts converted to migrations
- [ ] Obsolete scripts moved to `backend/scripts/archived/` or deleted
- [ ] README updated with migration instructions

---

## 6. Rollback Plan

1. Keep `create_all()` as fallback (behind feature flag) during transition
2. Keep fix scripts until migrations are verified
3. Test on dev database before production

---

## 7. Status History

| Date | Status | Notes |
|---|---|---|
| 2026-02-06 | PROPOSED | Created from RISK-003 and ISS-008 |
