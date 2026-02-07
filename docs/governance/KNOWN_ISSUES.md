# KNOWN ISSUES — Agri-OS

> **Document Type:** Bug Tracker, Limitations, Technical Debt
> **Last Updated:** 2026-02-06
> **Status:** ACTIVE

---

## Severity Legend

| Level | Meaning |
|---|---|
| **P0** | Production-breaking, immediate action required |
| **P1** | Major functionality broken, high priority |
| **P2** | Feature degraded but workaround exists |
| **P3** | Minor issue, low priority |
| **P4** | Enhancement / tech debt, backlog |

---

## Open Issues

### ISS-001: Secrets Committed to Git History

| Field | Value |
|---|---|
| **Severity** | P0 |
| **Category** | Security |
| **Description** | Database credentials, API keys, and GCP service account keys are in git history |
| **Affected Files** | `docker-compose.yml`, `vertex-key.json`, `backend/vertex-key.json` |
| **Cross-Reference** | RISK-001 |
| **Workaround** | Rotate credentials, use .env.enc for runtime |
| **Permanent Fix** | Purge git history with BFG Repo Cleaner, add to .gitignore |
| **Status** | OPEN |

---

### ISS-002: /fix-db Endpoint Unauthenticated

| Field | Value |
|---|---|
| **Severity** | P1 |
| **Category** | Security |
| **Description** | GET `/fix-db` runs ALTER TABLE statements without any authentication. Also runs at startup. |
| **Affected Files** | `backend/main.py:116-225` |
| **Cross-Reference** | RISK-009 |
| **Workaround** | Render deployment is not publicly indexed; endpoint is obscure |
| **Permanent Fix** | Add auth dependency or remove endpoint entirely |
| **Status** | OPEN |

---

### ISS-003: Debug/Financial Error Endpoint Exposed

| Field | Value |
|---|---|
| **Severity** | P2 |
| **Category** | Security |
| **Description** | GET `/debug-financials-error` returns stack traces and internal service state |
| **Affected Files** | `backend/main.py:227-236` |
| **Workaround** | Only returns data for farm_id=1 |
| **Permanent Fix** | Remove debug endpoint from production |
| **Status** | OPEN |

---

### ISS-004: Consent Router Imported Twice

| Field | Value |
|---|---|
| **Severity** | P3 |
| **Category** | Code Quality |
| **Description** | `consent_router` is imported twice in `main.py` (lines 89 and 91) |
| **Affected Files** | `backend/main.py:89-92` |
| **Impact** | No runtime impact (Python handles duplicate imports) but indicates copy-paste error |
| **Fix** | Remove duplicate import line |
| **Status** | OPEN |

---

### ISS-005: Incomplete Data Isolation Across Modules

| Field | Value |
|---|---|
| **Severity** | P1 |
| **Category** | Security / Data Integrity |
| **Description** | Multi-user isolation is enforced in `farm_management` but may be incomplete in `crops`, `marketplace`, `diagnosis`, and `livestock` modules |
| **Cross-Reference** | RISK-008, MULTI_USER_FIX.md |
| **Workaround** | Farm management module is the most critical and is protected |
| **Permanent Fix** | Audit all endpoints, add `get_current_user` + ownership checks everywhere |
| **Status** | OPEN |

---

### ISS-006: Render Cold Start Latency

| Field | Value |
|---|---|
| **Severity** | P2 |
| **Category** | Performance |
| **Description** | Free-tier Render instances spin down after inactivity. First request takes ~30 seconds. |
| **Cross-Reference** | RISK-007 |
| **Workaround** | `ServerWakeupIndicator` component shows loading state during cold start |
| **Permanent Fix** | Upgrade to paid Render tier or use keep-alive pings |
| **Status** | OPEN (Mitigated) |

---

### ISS-007: PostGIS Features Unavailable in SQLite Dev Mode

| Field | Value |
|---|---|
| **Severity** | P3 |
| **Category** | Dev Experience |
| **Description** | When using SQLite fallback, geometry columns are stored as Strings instead of PostGIS types. Spatial queries don't work. |
| **Affected Files** | `backend/app/core/db_compat.py`, all models with `get_geo_column()` |
| **Workaround** | Use Docker Compose with PostGIS for full feature testing |
| **Permanent Fix** | Document clearly, or add SpatiaLite support |
| **Status** | OPEN (By Design) |

---

### ISS-008: 30+ Orphaned Scripts in Backend Root

| Field | Value |
|---|---|
| **Severity** | P3 |
| **Category** | Code Quality / Maintainability |
| **Description** | `backend/` root contains 30+ Python scripts for DB fixes, migrations, debugging, and seeding with no documentation of current relevance |
| **Cross-Reference** | RISK-010 |
| **Affected Files** | `backend/fix_*.py`, `backend/migrate_*.py`, `backend/check_*.py`, `backend/debug_*.py`, `backend/seed_*.py`, etc. |
| **Fix** | Audit scripts, archive/delete obsolete ones, move needed ones to `backend/scripts/` |
| **Status** | OPEN |

---

### ISS-009: No Backend Health Check Endpoint

| Field | Value |
|---|---|
| **Severity** | P2 |
| **Category** | Operations |
| **Description** | Render uses `/docs` as health check. A proper `/health` endpoint that checks DB connectivity would be more reliable. |
| **Affected Files** | `backend/main.py`, `render.yaml` |
| **Fix** | Add `GET /health` endpoint that verifies DB connection |
| **Status** | OPEN |

---

### ISS-010: Accidental Files in Repository

| Field | Value |
|---|---|
| **Severity** | P4 |
| **Category** | Code Quality |
| **Description** | Files that shouldn't be in the repository: `nul`, `dummy.txt`, `backend/.enva`, `agrios_dev.db` |
| **Fix** | Remove files, update `.gitignore` |
| **Status** | OPEN |

---

### ISS-011: Frontend React Query Underutilized

| Field | Value |
|---|---|
| **Severity** | P4 |
| **Category** | Tech Debt |
| **Description** | `@tanstack/react-query` is installed but the custom in-memory cache in `api.ts` is used instead. This misses out on stale-while-revalidate, background refetching, and proper query invalidation. |
| **Affected Files** | `frontend/src/lib/api.ts`, `frontend/package.json` |
| **Cross-Reference** | DEC-006 |
| **Fix** | Either fully integrate React Query or remove the dependency |
| **Status** | OPEN |

---

### ISS-012: TensorFlow.js Dependencies

| Field | Value |
|---|---|
| **Severity** | P3 |
| **Category** | Performance |
| **Description** | `@tensorflow/tfjs` and `@tensorflow/tfjs-tflite` are in frontend dependencies for edge AI inference but significantly increase bundle size |
| **Affected Files** | `frontend/package.json` |
| **Fix** | Lazy-load TensorFlow only on Crop Doctor page. Consider dynamic import. |
| **Status** | OPEN |

---

### ISS-013: Deprecated SQLAlchemy Declarative Base

| Field | Value |
|---|---|
| **Severity** | P4 |
| **Category** | Tech Debt |
| **Description** | Using `declarative_base()` from `sqlalchemy.ext.declarative` which is deprecated in SQLAlchemy 2.0+ |
| **Affected Files** | `backend/app/core/database.py:26` |
| **Fix** | Migrate to `from sqlalchemy.orm import DeclarativeBase` |
| **Status** | OPEN |

---

### ISS-014: Missing Error Boundaries in Frontend

| Field | Value |
|---|---|
| **Severity** | P3 |
| **Category** | UX |
| **Description** | Frontend has `error.tsx` but individual feature pages lack granular error boundaries. A single API failure can blank the entire page. |
| **Workaround** | Global error page catches unhandled errors |
| **Fix** | Add per-feature error boundaries with retry capabilities |
| **Status** | OPEN |

---

## Resolved Issues

### ISS-R001: Multi-User Data Leak in Farm Management

| Field | Value |
|---|---|
| **Resolved** | 2026-02-04 |
| **Description** | All users saw farm_id=1 data due to hardcoded farm ID |
| **Resolution** | Dynamic farm ID, ownership enforcement, auto-farm creation |
| **See** | MULTI_USER_FIX.md |

### ISS-R002: Database Connection Pool Exhaustion

| Field | Value |
|---|---|
| **Resolved** | 2026-02-04 |
| **Description** | "max clients reached" errors in PostgreSQL |
| **Resolution** | Connection pool configuration (pool_size=5, max_overflow=10) |

### ISS-R003: Frontend Build Failure

| Field | Value |
|---|---|
| **Resolved** | 2026-02-01 |
| **Description** | Next.js build failed |
| **Resolution** | Fixed in commit `4d27a62` |
| **See** | FIX_FRONTEND_BUILD.md |

---

## Technical Debt Summary

| Category | Count | Highest Severity |
|---|---|---|
| Security | 3 | P0 |
| Data Integrity | 1 | P1 |
| Code Quality | 3 | P3 |
| Performance | 2 | P2 |
| Operations | 1 | P2 |
| Tech Debt | 3 | P4 |
| **Total Open** | **14** | **P0** |
