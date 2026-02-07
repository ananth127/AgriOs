# RISK ANALYSIS — Agri-OS

> **Document Type:** Risk Registry & Mitigation Tracker
> **Last Updated:** 2026-02-06
> **Status:** ACTIVE

---

## Risk Severity Matrix

| Likelihood \ Impact | Low | Medium | High | Critical |
|---|---|---|---|---|
| **High** | MEDIUM | HIGH | CRITICAL | CRITICAL |
| **Medium** | LOW | MEDIUM | HIGH | CRITICAL |
| **Low** | LOW | LOW | MEDIUM | HIGH |

---

## Active Risks

### RISK-001: Hardcoded Secrets in Source Control

| Field | Value |
|---|---|
| **ID** | RISK-001 |
| **Description** | Credentials, API keys, and database passwords are committed to the repository in plaintext |
| **Root Cause** | `docker-compose.yml` contains Supabase DB URL with password and Gemini API key. `vertex-key.json` (GCP service account key) exists in root and backend. `backend/app/core/config.py` has a default JWT secret key. |
| **Impact** | Unauthorized database access, API abuse, account compromise |
| **Likelihood** | High |
| **Severity** | **CRITICAL** |
| **Affected Files** | `docker-compose.yml`, `vertex-key.json`, `backend/vertex-key.json`, `backend/app/core/config.py:37` |
| **Affected Epics** | All |
| **Affected Agents** | All |
| **Mitigation** | 1. Rotate all exposed credentials immediately. 2. Move secrets to environment variables. 3. Add `vertex-key.json` and `*.db` to `.gitignore`. 4. Use git-filter-branch or BFG to purge history. 5. Use encrypted .env (already partially implemented). |
| **Owner** | Human Developer |
| **Status** | **OPEN — REQUIRES IMMEDIATE ACTION** |

---

### RISK-002: CORS Wildcard in Production

| Field | Value |
|---|---|
| **ID** | RISK-002 |
| **Description** | Backend CORS is configured with `allow_origins=["*"]`, allowing any domain to make authenticated API requests |
| **Root Cause** | `main.py:40` sets `allow_origins=["*"]` for development convenience |
| **Impact** | Cross-site request forgery, unauthorized API access from malicious websites |
| **Likelihood** | Medium |
| **Severity** | **HIGH** |
| **Affected Files** | `backend/main.py:38-44` |
| **Mitigation** | Restrict `allow_origins` to actual frontend domains (Vercel URL, localhost) in production. Use environment-based CORS config. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-003: No Database Migration System

| Field | Value |
|---|---|
| **ID** | RISK-003 |
| **Description** | No formal migration tool (Alembic) is used. Schema changes rely on `create_all()` at startup and 30+ ad-hoc Python fix scripts |
| **Root Cause** | Rapid prototyping phase; migrations were done via direct SQL scripts |
| **Impact** | Data loss during schema changes, inconsistent schemas across environments, inability to rollback schema changes |
| **Likelihood** | High |
| **Severity** | **HIGH** |
| **Affected Files** | `backend/main.py:32` (create_all), `backend/main.py:117-225` (/fix-db endpoint), 30+ `backend/*.py` scripts |
| **Mitigation** | 1. Integrate Alembic for migration management. 2. Convert existing fix scripts to proper migrations. 3. Remove /fix-db endpoint from production. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-004: JWT Token in localStorage

| Field | Value |
|---|---|
| **ID** | RISK-004 |
| **Description** | Authentication tokens stored in `localStorage`, vulnerable to XSS attacks |
| **Root Cause** | `frontend/src/lib/auth-context.tsx` stores `access_token` in localStorage |
| **Impact** | Token theft via cross-site scripting, session hijacking |
| **Likelihood** | Medium |
| **Severity** | **HIGH** |
| **Affected Files** | `frontend/src/lib/auth-context.tsx`, `frontend/src/lib/api.ts` |
| **Mitigation** | Consider httpOnly cookies for token storage. If localStorage is kept, ensure strict CSP headers and XSS protection. |
| **Owner** | Human Developer |
| **Status** | OPEN (Accepted Risk for MVP) |

---

### RISK-005: No Automated Tests

| Field | Value |
|---|---|
| **ID** | RISK-005 |
| **Description** | No automated test suite exists. Backend has ad-hoc test scripts but no pytest/unittest structure. Frontend has no tests. |
| **Root Cause** | Rapid development phase prioritized features over testing |
| **Impact** | Regressions undetected, manual testing burden, low confidence in deployments |
| **Likelihood** | High |
| **Severity** | **HIGH** |
| **Affected Files** | Entire codebase |
| **Mitigation** | 1. Add pytest for backend (start with auth + critical endpoints). 2. Add Jest/Vitest for frontend (start with api.ts + auth-context). 3. Add CI pipeline for test execution. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-006: Database Files in Repository

| Field | Value |
|---|---|
| **ID** | RISK-006 |
| **Description** | SQLite database files (`agrios_dev.db`) are tracked in git at both root and backend levels |
| **Root Cause** | Not added to `.gitignore` during initial setup |
| **Impact** | Repository bloat, potential data leaks, merge conflicts on binary files |
| **Likelihood** | Medium |
| **Severity** | **MEDIUM** |
| **Affected Files** | `agrios_dev.db`, `backend/agrios_dev.db` |
| **Mitigation** | Add `*.db` to `.gitignore`. Remove tracked files with `git rm --cached`. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-007: Single-Point-of-Failure Backend

| Field | Value |
|---|---|
| **ID** | RISK-007 |
| **Description** | Backend runs on Render free tier (single instance, cold starts, 512MB RAM limit) |
| **Root Cause** | Cost optimization for MVP phase |
| **Impact** | 30-second cold starts, potential OOM crashes, no horizontal scaling |
| **Likelihood** | High |
| **Severity** | **MEDIUM** |
| **Affected Files** | `render.yaml` |
| **Mitigation** | 1. ServerWakeupIndicator (implemented). 2. Heavy AI libs removed from requirements. 3. Plan upgrade path to paid tier for production. |
| **Owner** | Human Developer |
| **Status** | OPEN (Mitigated) |

---

### RISK-008: Incomplete Multi-User Data Isolation

| Field | Value |
|---|---|
| **ID** | RISK-008 |
| **Description** | While farm_management enforces ownership, other modules (crops, marketplace, diagnosis) may not fully enforce user-level data isolation |
| **Root Cause** | Multi-user support was retrofitted after initial single-user design |
| **Impact** | Users might see or modify other users' data in non-farm-management modules |
| **Likelihood** | Medium |
| **Severity** | **HIGH** |
| **Affected Files** | `backend/app/modules/crops/router.py`, `backend/app/modules/marketplace/router.py`, `backend/app/modules/diagnosis/router.py` |
| **Related Epic** | EPIC-001 (Multi-User Isolation) |
| **Mitigation** | Audit all endpoints for ownership checks. Apply `get_current_user` dependency universally. Test with multiple user accounts. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-009: /fix-db Endpoint in Production

| Field | Value |
|---|---|
| **ID** | RISK-009 |
| **Description** | The `/fix-db` endpoint runs ALTER TABLE statements and is accessible without authentication |
| **Root Cause** | Added as a convenience endpoint for schema fixes, runs at startup too |
| **Impact** | Unauthenticated schema modification, potential DoS via repeated calls |
| **Likelihood** | Medium |
| **Severity** | **HIGH** |
| **Affected Files** | `backend/main.py:116-225` |
| **Mitigation** | 1. Add authentication requirement. 2. Remove from production entirely. 3. Replace with Alembic migrations. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-010: Stale Fix/Migration Scripts

| Field | Value |
|---|---|
| **ID** | RISK-010 |
| **Description** | 30+ Python scripts in `backend/` root for DB fixes, migrations, and debugging with no documentation of which are still needed |
| **Root Cause** | Rapid iteration; scripts created for one-time fixes but never cleaned up |
| **Impact** | Confusion about DB state, accidental re-running of destructive migrations |
| **Likelihood** | Medium |
| **Severity** | **MEDIUM** |
| **Affected Files** | `backend/fix_*.py`, `backend/migrate_*.py`, `backend/check_*.py`, `backend/debug_*.py`, etc. |
| **Mitigation** | 1. Audit all scripts. 2. Move still-needed ones to `backend/scripts/`. 3. Delete obsolete ones. 4. Document in CHANGELOG.md. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-011: No Rate Limiting

| Field | Value |
|---|---|
| **ID** | RISK-011 |
| **Description** | No rate limiting on any API endpoint including authentication |
| **Root Cause** | Not implemented during MVP development |
| **Impact** | Brute-force attacks on login, API abuse, resource exhaustion |
| **Likelihood** | Medium |
| **Severity** | **MEDIUM** |
| **Affected Files** | `backend/main.py`, all routers |
| **Mitigation** | Add FastAPI rate limiting middleware (e.g., `slowapi`). Priority: auth endpoints first. |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

### RISK-012: Missing Input Sanitization on File Uploads

| Field | Value |
|---|---|
| **ID** | RISK-012 |
| **Description** | Diagnosis image uploads may not validate file types, sizes, or content |
| **Root Cause** | Basic upload implementation for MVP |
| **Impact** | Malicious file upload, storage exhaustion, path traversal |
| **Likelihood** | Low |
| **Severity** | **MEDIUM** |
| **Affected Files** | `backend/app/modules/diagnosis/router.py`, `backend/static/uploads/` |
| **Mitigation** | Validate file extension, MIME type, and size. Use UUID filenames (already partially done). |
| **Owner** | Human Developer |
| **Status** | OPEN |

---

## Resolved Risks

### RISK-R001: Multi-User Data Leak (Farm Management)

| Field | Value |
|---|---|
| **Resolved Date** | 2026-02-04 |
| **Description** | All users saw farm_id=1 data. Hardcoded farm ID in frontend. |
| **Resolution** | Implemented dynamic farm ID lookup, ownership enforcement (403 on violations), auto-farm creation. See MULTI_USER_FIX.md. |
| **Affected Files** | See MULTI_USER_FIX.md |

### RISK-R002: Database Connection Pool Exhaustion

| Field | Value |
|---|---|
| **Resolved Date** | 2026-02-04 |
| **Description** | "max clients reached" errors on PostgreSQL |
| **Resolution** | Added connection pooling: pool_size=5, max_overflow=10, pool_timeout=30, pool_recycle=3600 |
| **Affected Files** | `backend/app/core/database.py` |

---

## Risk Review Schedule

| Review Type | Frequency | Next Due |
|---|---|---|
| Full Risk Audit | Monthly | 2026-03-06 |
| Security Review | Bi-weekly | 2026-02-20 |
| Dependency Audit | Monthly | 2026-03-06 |
| Secret Scan | Every commit | Continuous |
