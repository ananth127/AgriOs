# CHANGELOG — Agri-OS

> **Document Type:** Chronological Change Tracking
> **Last Updated:** 2026-02-06
> **Format:** Reverse chronological (newest first)

---

## [Unreleased] — agrios_dev branch

### Security Hardening — 2026-02-07

**Fixed 55 endpoint violations (48% of all API endpoints)**

#### New Files
- `backend/app/core/ownership.py` — Shared ownership verification utility (`verify_farm_ownership`, `require_admin`)

#### CRITICAL Fixes (28 endpoints)
- `backend/app/modules/crops/router.py` — Added auth + farm ownership to all 4 endpoints
- `backend/app/modules/livestock/router.py` — Added auth + multi-depth ownership chains to all 24 endpoints (animal, housing, smart devices, feed plans, telemetry, alerts)

#### HIGH Fixes (20 endpoints)
- `backend/app/modules/marketplace/router.py` — Replaced mock `get_current_user_id()→1` with real JWT auth; added seller ownership checks on PUT/DELETE
- `backend/app/modules/diagnosis/models.py` — Added `user_id` column to DiagnosisLog
- `backend/app/modules/diagnosis/router.py` — Added auth to predict + history endpoints
- `backend/app/modules/diagnosis/service.py` — Filter history by user_id, store user_id on diagnosis
- `backend/app/modules/supply_chain/models.py` — Added `user_id` column to ProductBatch
- `backend/app/modules/supply_chain/router.py` — Added auth to batch creation/listing; kept GET /batches/{id} public (QR tracking)
- `backend/app/modules/supply_chain/service.py` — Accept/filter by user_id
- `backend/app/modules/consent/router.py` — Added real auth; admin-only policy creation; replaced hardcoded user_id=1
- `backend/app/modules/sync/router.py` — Added auth to both pull/push endpoints
- `backend/app/modules/farm_management/routers.py` — Fixed timeline (no auth → auth + crop cycle ownership check); removed hardcoded farm_id=1 defaults; added ownership check to labor application accept

#### MEDIUM Fixes (7 endpoints)
- `backend/app/modules/farms/router.py` — Added auth + zone→farm→owner check to PUT /zones/{zone_id}
- `backend/app/modules/registry/router.py` — Added admin-only auth to POST /
- `backend/app/modules/knowledge_graph/router.py` — Added admin-only auth to POST /regulatory/sync
- `backend/app/modules/voice_search/router.py` — Added auth to POST /query
- `backend/app/modules/drone/router.py` — Added auth to POST /analyze
- `backend/main.py` — Removed unauthenticated `/fix-db` and `/debug-financials-error` endpoints; converted to internal startup migration function

#### Database Migrations
- Added `user_id INTEGER` column to `diagnosis_logs` table (nullable for backward compat)
- Added `user_id INTEGER` column to `supply_chain_batches` table (nullable for backward compat)
- Migrations run automatically at startup via `_run_schema_migrations()`

### Modified (Uncommitted)
- `backend/app/core/database.py` — Connection pool configuration changes
- `backend/app/modules/farm_management/routers.py` — User farm ID endpoint + ownership enforcement
- `backend/app/modules/farm_management/schemas.py` — Schema updates for farm management
- `backend/app/modules/farms/router.py` — Farm router modifications
- `backend/app/modules/iot/router.py` — IoT router modifications
- `frontend/src/app/[locale]/devices/page.tsx` — Device page updates
- `frontend/src/app/[locale]/farm-management/page.tsx` — Dynamic farm ID loading
- `frontend/src/app/[locale]/smart-monitor/page.tsx` — Smart monitor updates
- `frontend/src/components/AppShell.tsx` — Shell layout changes
- `frontend/src/components/crops/CropAnalyticsDashboard.tsx` — Crop analytics updates
- `frontend/src/components/farm-management/AddAssetModal.tsx` — Asset modal changes
- `frontend/src/components/farm-management/IoTControl.tsx` — IoT control updates
- `frontend/src/components/farm-management/MachineryManager.tsx` — Removed auto-creation logic
- `frontend/src/components/iot/DeviceControlModal.tsx` — Device control changes
- `frontend/src/lib/api.ts` — Added getUserFarmId method

### Added (Untracked)
- `MULTI_USER_FIX.md` — Multi-user data isolation documentation
- `backend/app/modules/farms/user_farm_service.py` — User farm auto-creation service
- `backend/check_iot.py` — IoT verification script
- `backend/find_ownership_issues.py` — Ownership diagnostics
- `backend/fix_ownership.py` — Ownership fix script
- `backend/fix_user_farms.py` — User-farm relationship fixer
- `backend/get_users.py` — User listing utility
- `backend/inspect_db_tables.py` — Database inspection utility
- `backend/inspect_farm_ownership.py` — Farm ownership inspector
- `backend/migrate_assets.py` — Asset migration script
- `frontend/src/lib/userFarm.ts` — User farm helper
- `docs/governance/` — Complete governance documentation system

---

## 2026-02-04 — `b2a2b6b` Update Agri-OS application

### Changed
- General application update
- Multiple module refinements

---

## 2026-02-04 — `5bc1ba3` feat: Server Wakeup Indicator

### Added
- `frontend/src/components/ServerWakeupIndicator.tsx` — Cold-start indicator component
- Integrated into `GlobalProviders.tsx`

### Purpose
Render free-tier backend has cold starts (~30s). This component shows a spinner/message while the backend wakes up.

---

## 2026-02-04 — `6f49daf` feat: Core Modules + Multi-language

### Added
- Farm Management module (loans, inventory, assets, labor, financials)
- Livestock module (animals, housing, feed plans, health logs)
- Crops module (crop cycles, analytics)
- Multi-language support (10 Indian languages: en, hi, kn, ta, te, ml, mr, bn, gu, pa)
- New pages: farm-management, livestock, crops with full UI

### Changed
- Major frontend restructuring for localized routing

---

## 2026-02-03 — `1c4abff` feat: Smart Monitor + IoT Management

### Added
- Smart Monitor feature (livestock shelter monitoring)
- IoT device management (register, control, commands)
- Smart monitoring models (MonitoringDevice, MonitoringAlert, TelemetryReading)
- DeviceControlModal, CriticalAlertModal, OfflineCommandBuilder
- ValveSwitch, SignalIndicator components
- Smart Shelter Dashboard

### Changed
- Livestock module extended with smart monitoring support
- IoT module stabilized with command dispatch

---

## 2026-02-01 — `f2357c5` IoT devices updated

### Changed
- IoT device models refined
- Device control UI improvements

---

## 2026-02-01 — `4d27a62` fixed build failure

### Fixed
- Frontend build failure resolved

---

## 2026-02-01 — `f8d7bf1` updated theme and farms

### Changed
- Theme system updates (dark/light mode)
- Farm management improvements

---

## 2026-01-31 — `4f376b0` SEO and Preview updated

### Changed
- OpenGraph image generation (`opengraph-image.tsx`)
- SEO metadata improvements
- `robots.ts` and `sitemap.ts` added

---

## 2026-01-30 — `f01c770` Update Agri-OS application

### Changed
- General application refinements

---

## 2026-01-29 — `2e347a8` updates on livestocks

### Changed
- Livestock module improvements
- Animal registration and management updates

---

## 2026-01-21 — `af34a35` Calculator, Offline DB, Features

### Added
- Farm calculator page (`/calculator`)
- WatermelonDB offline database integration
- LokiJS adapter for WatermelonDB
- Offline data models (Farmer, Log)
- Sync API (`/api/v1/sync`)

### Changed
- Multiple feature refinements

---

## 2026-01-11 — `ee34025` through `dfa5709` (Multiple Versions)

### Added
- Vertex AI integration
- Google Cloud configuration
- Multiple iterative releases (V_11_1_12, V_new)

---

## 2026-01-07 — `3e92685` through `4ccb75e`

### Changed
- Application updates and refinements

---

## 2026-01-06 — `34fea88` through `535e99a` (V3)

### Added
- Supply chain module
- Marketplace enhancements
- Knowledge graph module

---

## Pre-2026-01-06 — V1/V2

### Foundation
- Initial project setup
- FastAPI backend with authentication
- Next.js frontend with basic routing
- Core modules: auth, farms, registry, marketplace
- Docker Compose configuration
- Render deployment setup
- Diagnosis module (Crop Doctor)
- Voice search integration
- Weather advisory
- Drone analytics
- Prophet predictions

---

## Change Type Legend

| Tag | Meaning |
|---|---|
| **Added** | New files, features, or capabilities |
| **Changed** | Modifications to existing functionality |
| **Fixed** | Bug fixes |
| **Removed** | Deleted files or features |
| **Security** | Security-related changes |
| **[HOTFIX]** | Emergency production fix |
| **[BREAKING]** | Backward-incompatible change |
