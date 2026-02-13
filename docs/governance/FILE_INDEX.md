# FILE INDEX — Agri-OS

> **Document Type:** Complete File Registry
> **Last Updated:** 2026-02-06
> **Purpose:** Every file in the workspace with its purpose, ownership, risk level, and criticality

---

## Risk Level Legend

| Level | Meaning | Change Protocol |
|---|---|---|
| **CRITICAL** | System will break if modified incorrectly | Requires Epic + Approval + Rollback Plan |
| **HIGH** | Significant feature impact | Requires CHANGELOG entry + Testing |
| **MEDIUM** | Moderate impact, recoverable | Requires CHANGELOG entry |
| **LOW** | Minimal impact | Standard commit message sufficient |
| **INFO** | Documentation/config only | No special protocol |

## Ownership Legend

| Code | Meaning |
|---|---|
| **H** | Human-authored |
| **AI** | AI-agent-authored |
| **S** | Shared (Human + AI) |

---

## 1. Root Directory

| File | Purpose | Risk | Owner | Criticality |
|---|---|---|---|---|
| `.gitignore` | Git ignore rules | LOW | H | Config |
| `docker-compose.yml` | Local dev stack (backend, frontend, db, redis, search) | CRITICAL | H | Infrastructure |
| `render.yaml` | Render.com deployment config | CRITICAL | H | Infrastructure |
| `package.json` | Root workspace package config | LOW | H | Config |
| `package-lock.json` | Root dependency lock | LOW | H | Config |
| `README.md` | Project README | INFO | H | Documentation |
| `start.bat` | Windows start script (dev) | LOW | H | Tooling |
| `start_dev.bat` | Windows dev start script | LOW | H | Tooling |
| `stop.bat` | Windows stop script | LOW | H | Tooling |
| `restart_backend.bat` | Backend restart helper | LOW | H | Tooling |
| `deploy-to-github.bat` | GitHub deployment helper | MEDIUM | H | Tooling |
| `Cmd.txt` | Command reference notes | INFO | H | Documentation |
| `dummy.txt` | Placeholder file | INFO | H | None |
| `nul` | Accidental null file | INFO | H | None |

### Root Documentation Files

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `AGRI_OS_ROADMAP.md` | High-level project roadmap | INFO | H |
| `AUTH_SYSTEM.md` | Authentication system documentation | INFO | S |
| `FIX_DATABASE_COLUMNS.md` | DB column fix instructions | INFO | AI |
| `FIX_FRONTEND_BUILD.md` | Frontend build fix guide | INFO | AI |
| `FIX_SUMMARY.md` | Summary of applied fixes | INFO | AI |
| `LIVESTOCK_FIX_README.md` | Livestock module fix notes | INFO | AI |
| `LOCALIZATION_PROGRESS.md` | Translation completion tracker | INFO | S |
| `MULTI_USER_FIX.md` | Multi-user data isolation fix | INFO | AI |
| `SMART_MONITOR_*.md` | Smart Monitor feature docs (6 files) | INFO | AI |
| `START_SERVER_CORRECTLY.md` | Server startup instructions | INFO | AI |
| `USER_MANUAL.md` | End-user manual | INFO | S |

### Root Scripts (Non-source)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `create_vertex_key.bat` | GCP Vertex AI key creation | MEDIUM | H |
| `create_vertex_key_fixed.bat` | Fixed version of above | MEDIUM | H |
| `diagnose_service_account.bat` | GCP service account diagnostics | LOW | H |
| `fix_iot_database.bat` | IoT DB schema fix | MEDIUM | AI |
| `install_gcloud.bat` | Google Cloud SDK installer | LOW | H |
| `setup_vertex_ai.bat` | Vertex AI setup | MEDIUM | H |
| `list_models.py` | List available AI models | LOW | H |
| `test_gemini.py` | Test Gemini API connection | LOW | H |

---

## 2. Backend — Core (`backend/app/core/`)

| File | Purpose | Risk | Owner | Criticality |
|---|---|---|---|---|
| `__init__.py` | Package init | LOW | H | Boilerplate |
| `config.py` | Settings (DB URL, JWT, API keys) | CRITICAL | H | Configuration |
| `database.py` | SQLAlchemy engine, session, Base | CRITICAL | S | Infrastructure |
| `db_compat.py` | SQLite/PostGIS compatibility layer | HIGH | S | Infrastructure |
| `huggingface_service.py` | HuggingFace AI API integration | MEDIUM | H | AI Service |
| `i18n.py` | Backend internationalization | MEDIUM | H | Localization |
| `telemetry.py` | OpenTelemetry configuration | LOW | H | Observability |

---

## 3. Backend — Common (`backend/app/common/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `constants.py` | Shared constants | LOW | H |
| `enums.py` | Shared enumerations | LOW | H |
| `sms.py` | Twilio SMS integration | MEDIUM | H |

---

## 4. Backend — Modules (`backend/app/modules/`)

### 4.1 Auth Module (`auth/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `models.py` | User model (email, password, role, location) | CRITICAL | H |
| `router.py` | /register, /login, /me endpoints | CRITICAL | H |
| `schemas.py` | Pydantic schemas for auth | HIGH | H |
| `service.py` | User CRUD, authentication logic | CRITICAL | H |
| `dependencies.py` | get_current_user dependency | CRITICAL | H |
| `utils.py` | JWT token creation/verification | CRITICAL | H |

### 4.2 Farms Module (`farms/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `models.py` | FarmTable, ZoneTable (with PostGIS geometry) | CRITICAL | H |
| `router.py` | Farm CRUD + zone endpoints | HIGH | S |
| `schemas.py` | Farm Pydantic schemas | MEDIUM | H |
| `service.py` | Farm business logic | HIGH | H |
| `user_farm_service.py` | Auto-create user farms, ownership enforcement | HIGH | AI |

### 4.3 IoT Module (`iot/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `models.py` | IoTDevice, IoTCommand models | HIGH | S |
| `router.py` | Device CRUD, command dispatch | HIGH | S |
| `schemas.py` | IoT Pydantic schemas | MEDIUM | S |
| `service.py` | IoT business logic | HIGH | S |

### 4.4 Farm Management Module (`farm_management/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `__init__.py` | Package init | LOW | H |
| `models.py` | FarmLoan, FarmInventory, FarmAsset, FarmActivity, CropHarvestLog, LaborJob, LaborApplication, FarmFinancial | CRITICAL | H |
| `routers.py` | All farm management endpoints | HIGH | S |
| `schemas.py` | Pydantic schemas for farm mgmt | MEDIUM | S |
| `services.py` | Business logic for all farm operations | HIGH | H |

### 4.5 Livestock Module (`livestock/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `models.py` | Animal, LivestockProduction, Housing, FeedPlan, HealthLog | HIGH | H |
| `smart_models.py` | MonitoringDevice, MonitoringAlert, TelemetryReading, SmartDeviceLog | HIGH | S |
| `router.py` | Livestock CRUD + smart monitoring endpoints | HIGH | S |
| `schemas.py` | Livestock Pydantic schemas | MEDIUM | S |
| `service.py` | Livestock business logic | HIGH | H |
| `smart_service.py` | Smart monitoring business logic | HIGH | S |

### 4.6 Crops Module (`crops/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `models.py` | CropCycle model | HIGH | H |
| `router.py` | Crop CRUD endpoints | MEDIUM | H |
| `schemas.py` | Crop Pydantic schemas | MEDIUM | H |
| `service.py` | Crop business logic | MEDIUM | H |

### 4.7 Marketplace Module (`marketplace/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `models.py` | ServiceProvider, ServiceListing, ProductListing, CommercialProduct, Order | HIGH | H |
| `router.py` | Marketplace endpoints | HIGH | H |
| `schemas.py` | Marketplace Pydantic schemas | MEDIUM | H |
| `service.py` | Marketplace business logic | HIGH | H |

### 4.8 Diagnosis Module (`diagnosis/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `__init__.py` | Package init | LOW | H |
| `models.py` | DiagnosisLog (AI results, drift monitoring) | HIGH | H |
| `router.py` | Image upload + diagnosis endpoint | HIGH | H |
| `schemas.py` | Diagnosis Pydantic schemas | MEDIUM | H |
| `service.py` | AI inference service (mock/real) | HIGH | H |

### 4.9 Knowledge Graph Module (`knowledge_graph/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `__init__.py` | Package init | LOW | H |
| `models.py` | KGCrop, KGPest, KGChemical + association tables | HIGH | H |
| `regulatory.py` | CIBRC/EPA compliance logic | HIGH | H |
| `router.py` | Library/search endpoints | MEDIUM | H |
| `service.py` | Knowledge graph queries | MEDIUM | H |

### 4.10 Supply Chain Module (`supply_chain/`)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `models.py` | ProductBatch, SupplyChainEvent | MEDIUM | H |
| `router.py` | Batch tracking endpoints | MEDIUM | H |
| `schemas.py` | Supply chain Pydantic schemas | MEDIUM | H |
| `service.py` | Supply chain business logic | MEDIUM | H |

### 4.11 Other Modules

| Module | Files | Purpose | Risk | Owner |
|---|---|---|---|---|
| `consent/` | models, router, schemas | GDPR/DPDP consent management | HIGH | H |
| `dashboard/` | router, schemas, service | Aggregated dashboard API | MEDIUM | H |
| `drone/` | router, schemas, service | Drone imagery analysis | MEDIUM | H |
| `prophet/` | router, schemas, service | Price/yield prediction | MEDIUM | H |
| `registry/` | models, router, schemas, service | Universal entity registry | HIGH | H |
| `voice_search/` | router, schemas, service, service_free | Multilingual voice search | MEDIUM | H |
| `weather/` | router, service | Weather advisory API | LOW | H |
| `sync/` | router | Offline data sync API | MEDIUM | H |
| `ufsi/` | router | Universal Farm Service Interface | LOW | H |

### 4.12 Models-Only Modules (No Routers Yet)

| Module | Purpose | Risk | Status |
|---|---|---|---|
| `fintech/` | Financial services models | MEDIUM | Planned |
| `inventory/` | Inventory models | LOW | Merged into farm_management |
| `labor/` | Labor models | LOW | Merged into farm_management |
| `machinery/` | Machinery models + parser | MEDIUM | Partially active |
| `market_access/` | Market access models | LOW | Planned |
| `retailer/` | Retailer management models | MEDIUM | Planned |
| `traceability/` | Traceability models | LOW | Planned |

---

## 5. Backend — Entry Point & Scripts

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `main.py` | FastAPI app initialization, router mounting, startup DB fixes | CRITICAL | S |
| `requirements.txt` | Python dependencies | HIGH | S |
| `Dockerfile` | Backend container image | HIGH | H |
| `.env` | Environment variables (secrets) | CRITICAL | H |
| `.env.enc` | Encrypted environment file | CRITICAL | H |
| `.env.example` | Example env template | INFO | H |
| `start.bat` | Windows startup script | LOW | H |
| `load_env.py` | Encrypted .env loader | HIGH | H |
| `encrypt_env.py` | .env encryption utility | HIGH | H |
| `init_db.py` | Database initialization | MEDIUM | H |
| `seed.py` | Database seeding | MEDIUM | H |

### Migration & Fix Scripts (Backend Root)

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `check_db.py` | Database health check | LOW | H |
| `check_iot.py` | IoT tables verification | LOW | AI |
| `check_iot_devices.py` | IoT device data check | LOW | H |
| `check_livestock.py` | Livestock tables check | LOW | H |
| `check_email_validator.py` | Email validator test | LOW | H |
| `create_livestock_tables.py` | Create livestock DB tables | MEDIUM | H |
| `create_smart_log_table.py` | Create smart device log table | MEDIUM | AI |
| `create_smart_tables.py` | Create smart monitoring tables | MEDIUM | AI |
| `debug_feed_plans.py` | Debug feed plan queries | LOW | H |
| `debug_financials.py` | Debug financial queries | LOW | H |
| `debug_imports.py` | Debug module imports | LOW | H |
| `debug_users_devices.py` | Debug user-device relationships | LOW | AI |
| `diagnose_and_fix.py` | Auto-diagnose and fix DB issues | MEDIUM | AI |
| `direct_sql_migration.py` | Direct SQL schema migration | HIGH | H |
| `enable_postgis.py` | Enable PostGIS extension | MEDIUM | H |
| `find_ownership_issues.py` | Find data ownership problems | LOW | AI |
| `fix_created_at.py` | Fix missing created_at columns | MEDIUM | H |
| `fix_db_schema.py` | General DB schema fixes | MEDIUM | H |
| `fix_iot_schema.py` | IoT-specific schema fixes | MEDIUM | AI |
| `fix_livestock_*.py` | Livestock schema fixes (3 files) | MEDIUM | AI |
| `fix_ownership.py` | Fix data ownership issues | MEDIUM | AI |
| `fix_prod_schema.py` | Production DB schema fixes | HIGH | H |
| `fix_real_env.py` | Fix environment configuration | MEDIUM | H |
| `fix_real_env_v2.py` | Fixed env configuration v2 | MEDIUM | H |
| `fix_user_farms.py` | Fix user-farm relationships | MEDIUM | AI |
| `force_fix_iot.py` | Force IoT schema corrections | MEDIUM | AI |
| `get_users.py` | List all users utility | LOW | AI |
| `init_iot_tables.py` | Initialize IoT tables | MEDIUM | H |
| `inspect_db_tables.py` | Inspect database table structure | LOW | AI |
| `inspect_farm_ownership.py` | Inspect farm ownership data | LOW | AI |
| `manual_fix_db.py` | Manual database corrections | MEDIUM | H |
| `migrate_assets.py` | Migrate farm assets | MEDIUM | AI |
| `migrate_iot_*.py` | IoT migration scripts (3 files) | MEDIUM | H |
| `seed_*.py` | Various seeding scripts (3 files) | MEDIUM | H |
| `test_*.py` | Test scripts (3 files) | LOW | H |
| `update_db.py` | Database update utility | MEDIUM | H |
| `verify_smart_monitor.py` | Verify smart monitor tables | LOW | AI |
| `vertex-key.json` | GCP Vertex AI service account key | CRITICAL | H |

---

## 6. Frontend — Core

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `package.json` | Dependencies and scripts | HIGH | S |
| `package-lock.json` | Dependency lock | LOW | Auto |
| `next.config.mjs` | Next.js configuration | HIGH | H |
| `tailwind.config.ts` | Tailwind CSS configuration | MEDIUM | H |
| `tsconfig.json` | TypeScript configuration | MEDIUM | H |
| `postcss.config.js` | PostCSS configuration | LOW | H |
| `.eslintrc.json` | ESLint configuration | LOW | H |
| `.swcrc` | SWC compiler config | LOW | H |
| `Dockerfile` | Frontend container image | HIGH | H |
| `.env.local` | Frontend environment variables | HIGH | H |
| `.env.local.example` | Example frontend env | INFO | H |
| `vercel.json` | Vercel deployment config | MEDIUM | H |
| `encrypt-env.js` | Frontend env encryption | MEDIUM | H |
| `load-env.js` | Frontend env loader | MEDIUM | H |
| `validate_json.js` | JSON translation validator | LOW | H |

### Middleware & Navigation

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `src/middleware.ts` | next-intl locale routing middleware | HIGH | H |
| `src/navigation.ts` | Internationalized navigation helpers | MEDIUM | H |

---

## 7. Frontend — App Pages (`src/app/[locale]/`)

| Page Route | File | Purpose | Risk |
|---|---|---|---|
| `/` | `page.tsx` | Home (Landing/Dashboard conditional) | HIGH |
| `/auth/login` | `auth/login/page.tsx` | Login page | HIGH |
| `/auth/signup` | `auth/signup/page.tsx` | Registration page | HIGH |
| `/calculator` | `calculator/page.tsx` | Farm calculator | LOW |
| `/community` | `community/page.tsx` | Community forum | MEDIUM |
| `/crop-doctor` | `crop-doctor/page.tsx` | AI disease diagnosis | HIGH |
| `/crops` | `crops/page.tsx` | Crop management | MEDIUM |
| `/devices` | `devices/page.tsx` | IoT device list | HIGH |
| `/devices/[id]` | `devices/[deviceId]/page.tsx` | Device detail | HIGH |
| `/devices/new` | `devices/new/page.tsx` | Add new device | MEDIUM |
| `/docs` | `docs/page.tsx` | Documentation | LOW |
| `/drone` | `drone/page.tsx` | Drone analytics | MEDIUM |
| `/farm-management` | `farm-management/page.tsx` | Full farm operations | HIGH |
| `/farms` | `farms/page.tsx` | Farm CRUD | HIGH |
| `/features` | `features/page.tsx` | Marketing page | LOW |
| `/library` | `library/page.tsx` | Knowledge graph browser | MEDIUM |
| `/livestock` | `livestock/page.tsx` | Livestock management | HIGH |
| `/marketplace` | `marketplace/page.tsx` | Marketplace | HIGH |
| `/smart-monitor` | `smart-monitor/page.tsx` | Smart shelter monitoring | HIGH |
| `/supply-chain` | `supply-chain/page.tsx` | Supply chain tracking | MEDIUM |
| `/use-cases` | `use-cases/page.tsx` | Marketing page | LOW |
| `/verify/[farmerId]/[animalId]` | `verify/[farmerId]/[animalId]/page.tsx` | QR verification | MEDIUM |

---

## 8. Frontend — Components (`src/components/`)

### Shell & Layout

| File | Purpose | Risk |
|---|---|---|
| `AppShell.tsx` | Main layout wrapper (sidebar/navbar conditional) | HIGH |
| `Sidebar.tsx` | Navigation sidebar | HIGH |
| `NavBar.tsx` | Top navigation bar | MEDIUM |
| `GlobalProviders.tsx` | Theme, Auth, Query providers | CRITICAL |
| `AuthGuard.tsx` | Route protection component | HIGH |
| `PublicHeader.tsx` | Public page header | LOW |
| `NavigationLoader.tsx` | Page transition loader | LOW |
| `ServerWakeupIndicator.tsx` | Backend cold-start indicator | LOW |
| `LanguageSwitcher.tsx` | Language toggle component | MEDIUM |
| `ThemeToggle.tsx` | Dark/light mode toggle | LOW |

### Feature Components

| Directory | Components | Purpose |
|---|---|---|
| `crops/` | CropAnalyticsDashboard, EditCropModal | Crop analytics & editing |
| `dashboard/` | FarmEcosystem, MarketplaceWidget, ProphetWidget, QrScannerModal, WeatherWidget | Home dashboard widgets |
| `diagnosis/` | DiagnosisUploader | Image upload for crop doctor |
| `farm-management/` | AddAssetModal, AddInventoryModal, CreateLaborJobModal, CreateLoanModal, CropTimeline, EditAssetModal, EditInventoryModal, FinancialDashboard, InventoryManager, IoTControl, LaborManager, LoanManager, LogActivityModal, MachineryManager | Full farm operations UI |
| `farms/` | CreateFarmModal | Farm creation dialog |
| `home/` | DashboardView, LandingView + sections | Homepage views |
| `iot/` | CriticalAlertModal, DeviceControlModal, OfflineCommandBuilder, QRScannerModal, SignalIndicator, ValveSwitch | IoT device control UI |
| `library/` | CropLibrary, LibraryBrowser | Knowledge graph browser |
| `livestock/` | AddFeedPlanModal, AddHealthLogModal, AddHousingModal, EditAnimalModal, LivestockCategoryDashboard, LivestockDetailModal, LivestockMainDashboard, LogProductionModal, QrPrintModal, RegisterAnimalModal, SellLivestockModal, SmartShelterDashboard | Livestock management UI |
| `marketplace/` | CreateJobModal, CreateListingModal, EditListingModal, PurchaseModal | Marketplace UI |
| `supply-chain/` | CreateBatchModal | Supply chain UI |
| `ui/` | Card, ContentLoader, Modal, QRScanner | Shared UI primitives |

---

## 9. Frontend — Library & Hooks

| File | Purpose | Risk |
|---|---|---|
| `lib/api.ts` | Centralized API client with caching | CRITICAL |
| `lib/auth-context.tsx` | Authentication React context | CRITICAL |
| `lib/constants.ts` | API_BASE_URL constant | HIGH |
| `lib/userFarm.ts` | User farm ID resolution helper | HIGH |
| `lib/analytics.ts` | Google Analytics integration | LOW |
| `lib/utils.ts` | Shared utility functions | LOW |
| `hooks/useConnectionHealth.ts` | Backend connection health monitor | MEDIUM |
| `db/index.ts` | WatermelonDB initialization | MEDIUM |
| `db/schema.ts` | WatermelonDB schema definition | MEDIUM |
| `db/sync.ts` | Offline sync logic | MEDIUM |
| `db/models/Farmer.ts` | Offline farmer model | LOW |
| `db/models/Log.ts` | Offline log model | LOW |

---

## 10. Frontend — Internationalization

| File | Purpose | Languages |
|---|---|---|
| `i18n/config.ts` | Locale configuration | en, hi, kn, ta, te, ml, mr, bn, gu, pa |
| `i18n/request.ts` | Server-side locale request handler | — |
| `messages/en.json` | English translations | English |
| `messages/hi.json` | Hindi translations | Hindi |
| `messages/kn.json` | Kannada translations | Kannada |
| `messages/ta.json` | Tamil translations | Tamil |
| `messages/te.json` | Telugu translations | Telugu |
| `messages/ml.json` | Malayalam translations | Malayalam |
| `messages/mr.json` | Marathi translations | Marathi |
| `messages/bn.json` | Bengali translations | Bengali |
| `messages/gu.json` | Gujarati translations | Gujarati |
| `messages/pa.json` | Punjabi translations | Punjabi |
| `messages/sync-translations.js` | Translation sync utility | — |

---

## 11. Agent Artifacts

| File | Purpose | Risk | Owner |
|---|---|---|---|
| `.agent/workflows/implement_agri_os_blueprint.md` | Blueprint implementation tracker | INFO | AI |
| `.agent/workflows/add_iot_device.md` | IoT device addition workflow | INFO | AI |

---

## 12. Existing Documentation

| File | Purpose | Status |
|---|---|---|
| `docs/AGRI_OS_BLUEPRINT.md` | Comprehensive system vision & strategy | Active |
| `docs/DEPLOYMENT_GUIDE.md` | Deployment instructions | Active |
| `docs/GEMINI_SETUP_GUIDE.md` | Gemini AI setup guide | Active |
| `docs/IoT_Implementation_Plan.md` | IoT module implementation plan | Active |
| `docs/IoT_UI_Structure.md` | IoT UI component structure | Active |
| `docs/RENDER_DEPLOYMENT.md` | Render.com deployment guide | Active |
| `docs/VERTEX_AI_INTEGRATION.md` | Vertex AI integration guide | Active |

---

## 13. Compliance Violations (Current)

> Files that exist without proper governance documentation:

| Violation | Files | Severity |
|---|---|---|
| Secrets in source control | `vertex-key.json` (root + backend), `docker-compose.yml` (contains DB password + API key) | **CRITICAL** |
| Untracked migration scripts | 30+ `backend/*.py` scripts with no CHANGELOG entries | HIGH |
| Accidental files | `nul`, `dummy.txt`, `backend/.enva` | LOW |
| Database files in repo | `agrios_dev.db` (root + backend) | MEDIUM |
