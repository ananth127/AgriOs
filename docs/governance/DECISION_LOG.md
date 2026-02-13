# DECISION LOG — Agri-OS

> **Document Type:** Architectural & Process Decisions
> **Last Updated:** 2026-02-06
> **Purpose:** Record all significant decisions with context, alternatives considered, and rationale

---

## Decision Entry Format

Each entry records:
- **What** was decided
- **Why** it was decided (rationale)
- **What else** was considered (alternatives)
- **What it affects** (files, modules, risks)
- **Who** decided and **when**

---

## DEC-001: Monorepo Structure (Backend + Frontend)

| Field | Value |
|---|---|
| **Date** | 2025-12 (Initial) |
| **Decision** | Keep backend (FastAPI) and frontend (Next.js) in a single repository |
| **Rationale** | Simplifies development for a small team. Single CI/CD pipeline. Shared documentation. Easy to deploy together. |
| **Alternatives** | Separate repos (more complex CI/CD, harder to keep in sync) |
| **Affected** | Entire project structure |
| **Decided By** | Human Developer |
| **Status** | Active |

---

## DEC-002: FastAPI over Django/Express

| Field | Value |
|---|---|
| **Date** | 2025-12 (Initial) |
| **Decision** | Use FastAPI (Python) for the backend API |
| **Rationale** | Async support, automatic OpenAPI docs, Pydantic validation, Python ecosystem for AI/ML integration, strong typing |
| **Alternatives** | Django REST (heavier, more opinionated), Express.js (JS ecosystem, less Python AI integration), Flask (less structured) |
| **Affected** | `backend/` |
| **Decided By** | Human Developer |
| **Status** | Active |

---

## DEC-003: Next.js 14 App Router

| Field | Value |
|---|---|
| **Date** | 2025-12 (Initial) |
| **Decision** | Use Next.js 14 with App Router for the frontend |
| **Rationale** | Server-side rendering, file-based routing, React ecosystem, good i18n support (next-intl), PWA support |
| **Alternatives** | React Native (mobile-first but harder web), Remix (less mature), plain React SPA (no SSR) |
| **Affected** | `frontend/` |
| **Decided By** | Human Developer |
| **Status** | Active |

---

## DEC-004: SQLite Fallback for Development

| Field | Value |
|---|---|
| **Date** | 2026-01 |
| **Decision** | Default to SQLite for local development, PostgreSQL for production |
| **Rationale** | Eliminates need for local PostgreSQL installation. Developers can start immediately. Production uses Supabase PostgreSQL. |
| **Trade-offs** | PostGIS features (geometry) don't work in SQLite. `db_compat.py` provides compatibility layer using String columns. |
| **Affected** | `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/core/db_compat.py` |
| **Decided By** | Human Developer |
| **Status** | Active |

---

## DEC-005: JWT in localStorage (Not httpOnly Cookie)

| Field | Value |
|---|---|
| **Date** | 2026-01 |
| **Decision** | Store JWT tokens in localStorage on the frontend |
| **Rationale** | Simpler implementation for MVP. Works with the current API architecture (Bearer token in headers). No need for cookie domain configuration. |
| **Trade-offs** | Vulnerable to XSS attacks (see RISK-004). httpOnly cookies would be more secure. |
| **Alternatives** | httpOnly cookie (more secure but requires CORS cookie config and CSRF protection), sessionStorage (lost on tab close) |
| **Affected** | `frontend/src/lib/auth-context.tsx`, `frontend/src/lib/api.ts` |
| **Risk** | RISK-004 |
| **Decided By** | Human Developer |
| **Status** | Active (Accepted Risk) |

---

## DEC-006: In-Memory API Cache (Not React Query)

| Field | Value |
|---|---|
| **Date** | 2026-01 |
| **Decision** | Use custom in-memory cache (Map) in `api.ts` with 5-minute TTL, clear-on-mutation strategy |
| **Rationale** | Simple, lightweight, no additional dependency needed. React Query is installed but not fully utilized. |
| **Trade-offs** | No stale-while-revalidate, no background refetching, no query invalidation granularity. Full cache clear on any mutation. |
| **Alternatives** | Full React Query integration (more powerful but more complex), SWR (simpler), no cache (more API calls) |
| **Affected** | `frontend/src/lib/api.ts` |
| **Decided By** | Human Developer + AI |
| **Status** | Active |

---

## DEC-007: create_all() Instead of Alembic

| Field | Value |
|---|---|
| **Date** | 2026-01 |
| **Decision** | Use SQLAlchemy `create_all()` at startup instead of Alembic migrations |
| **Rationale** | Fastest path during rapid prototyping. Works for adding new tables. Combined with manual ALTER TABLE scripts for column additions. |
| **Trade-offs** | Cannot rename/drop columns, no migration history, no rollback capability, schema drift between environments. See RISK-003. |
| **Alternatives** | Alembic (proper migrations but setup overhead), Django-style auto-migrations (not available in SQLAlchemy) |
| **Affected** | `backend/main.py`, all model files |
| **Risk** | RISK-003 |
| **Decided By** | Human Developer |
| **Status** | Active (Technical Debt) |

---

## DEC-008: 10-Language Internationalization

| Field | Value |
|---|---|
| **Date** | 2026-02 |
| **Decision** | Support 10 Indian languages via next-intl with URL-based locale routing |
| **Rationale** | Target audience is Indian farmers. Vernacular language support is critical for adoption (see Blueprint Section 8.2). |
| **Languages** | English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Gujarati, Punjabi |
| **Implementation** | `[locale]/` route prefix, JSON translation files, LanguageSwitcher component |
| **Affected** | `frontend/src/middleware.ts`, `frontend/src/i18n/`, `frontend/src/messages/`, all pages |
| **Decided By** | Human Developer |
| **Status** | Active |

---

## DEC-009: Multi-User Isolation via Farm Ownership

| Field | Value |
|---|---|
| **Date** | 2026-02-04 |
| **Decision** | Implement data isolation by auto-creating a farm per user and enforcing `farm.owner_id == current_user.id` on all operations |
| **Rationale** | The farm entity is the natural data boundary. Each user owns exactly one primary farm. All sub-entities (crops, livestock, assets, etc.) are linked via farm_id. |
| **Trade-offs** | Users cannot collaborate on shared farms (future feature). Single-farm assumption limits enterprise use. |
| **Alternatives** | Role-based access with shared farms (more complex), tenant-based isolation (overkill for MVP) |
| **Affected** | See MULTI_USER_FIX.md |
| **Risk** | RISK-008 (incomplete enforcement in some modules) |
| **Decided By** | AI Agent (validated by Human Developer) |
| **Status** | Active |

---

## DEC-010: Encrypted .env for Secrets

| Field | Value |
|---|---|
| **Date** | 2026-01 |
| **Decision** | Use `cryptography` library to encrypt `.env` file as `.env.enc` for secure storage |
| **Rationale** | Allows committing encrypted config to repo without exposing secrets. Decrypted at runtime using `ENV_PASSWORD`. |
| **Implementation** | `backend/encrypt_env.py` encrypts, `backend/load_env.py` decrypts at startup |
| **Trade-offs** | Password must be provided separately. If password is leaked, all secrets are compromised. |
| **Alternatives** | Vault/SSM (enterprise-grade but complex), plain .env with .gitignore (risk of accidental commit) |
| **Affected** | `backend/.env.enc`, `backend/load_env.py`, `backend/encrypt_env.py` |
| **Decided By** | Human Developer |
| **Status** | Active |

---

## DEC-011: WatermelonDB for Offline-First

| Field | Value |
|---|---|
| **Date** | 2026-01 |
| **Decision** | Use WatermelonDB with LokiJS adapter for offline data persistence |
| **Rationale** | Aligns with Blueprint (Section 3.1). Farmers need offline access. WatermelonDB supports React, has sync protocol, is reactive. |
| **Trade-offs** | LokiJS adapter is less performant than native SQLite. Full sync logic is complex. Currently basic implementation. |
| **Affected** | `frontend/src/db/`, `frontend/package.json` |
| **Decided By** | Human Developer |
| **Status** | Active (Partially Implemented) |

---

## DEC-012: Render Free Tier for Backend

| Field | Value |
|---|---|
| **Date** | 2026-01 |
| **Decision** | Deploy backend on Render.com free tier |
| **Rationale** | Zero cost for MVP/demo phase. Auto-deploy from GitHub. Supports Python. |
| **Trade-offs** | 512MB RAM, cold starts (30s), no persistent disk, spins down after inactivity. See RISK-007. |
| **Mitigation** | Removed heavy AI libs (torch, ultralytics). Added ServerWakeupIndicator. |
| **Alternatives** | Railway (similar), AWS EC2 (more control, more cost), Fly.io (better cold starts) |
| **Decided By** | Human Developer |
| **Status** | Active |

---

## DEC-013: Governance Documentation System

| Field | Value |
|---|---|
| **Date** | 2026-02-06 |
| **Decision** | Establish strict governance documentation system under `docs/governance/` |
| **Rationale** | Project has grown complex (20+ modules, 200+ files). Need single source of truth for developers and AI agents. Track risks, decisions, and changes systematically. |
| **Artifacts** | WORKSPACE_OVERVIEW, FILE_INDEX, ARCHITECTURE, WORKFLOW, CHANGELOG, RISK_ANALYSIS, DECISION_LOG, KNOWN_ISSUES, agents/, epics/ |
| **Affected** | All future development work |
| **Decided By** | Human Developer + AI Agent |
| **Status** | Active |
