# ARCHITECTURE — Agri-OS

> **Document Type:** System Design & Boundaries
> **Last Updated:** 2026-02-06
> **Status:** ACTIVE

---

## 1. System Architecture Overview

```
                        +--------------------------+
                        |      INTERNET / CDN      |
                        +-----+----------+---------+
                              |          |
                    +---------+--+  +----+---------+
                    |  Vercel    |  |  Render.com  |
                    |  Frontend  |  |  Backend API |
                    +-----+------+  +------+-------+
                          |                |
              +-----------+----+    +------+--------+
              |  Next.js 14   |    |  FastAPI       |
              |  App Router   |    |  Python 3.10   |
              |  TypeScript   |    |  SQLAlchemy    |
              +------+--------+    +------+---------+
                     |                    |
              +------+--------+    +------+---------+
              |  Client-Side  |    |  PostgreSQL    |
              |  WatermelonDB |    |  + PostGIS     |
              |  (Offline)    |    |  (Supabase)    |
              +---------------+    +----------------+
```

---

## 2. Backend Architecture

### 2.1 Application Layer

```
main.py (Entry Point)
  |
  +-- FastAPI App
  |     |-- CORS Middleware (allow_origins=["*"])
  |     |-- Static Files Mount (/static)
  |     |-- Startup Event (DB schema fixes)
  |     |
  |     +-- API Routers (all prefixed /api/v1/)
  |           |-- /auth          -> Auth Module
  |           |-- /registry      -> Registry Module
  |           |-- /farms         -> Farms Module
  |           |-- /prophet       -> Prophet Module
  |           |-- /drone         -> Drone Module
  |           |-- /marketplace   -> Marketplace Module
  |           |-- /voice-search  -> Voice Search Module
  |           |-- /crops         -> Crops Module
  |           |-- /livestock     -> Livestock Module
  |           |-- /supply-chain  -> Supply Chain Module
  |           |-- /farm-management -> Farm Management Module
  |           |-- /weather       -> Weather Module
  |           |-- /sync          -> Sync Module
  |           |-- /ufsi          -> UFSI Module
  |           |-- /consent       -> Consent Module
  |           |-- /diagnosis     -> Diagnosis Module
  |           |-- /library       -> Knowledge Graph Module
  |           |-- /iot           -> IoT Module
  |           |-- /dashboard     -> Dashboard Module
  |           |-- /fix-db        -> DB Fix Endpoint (!)
  |           |-- /debug-financials-error -> Debug Endpoint (!)
  |
  +-- Database Engine (SQLAlchemy)
        |-- PostgreSQL (Production)
        |-- SQLite (Dev Fallback)
```

### 2.2 Module Architecture Pattern

Each backend module follows a consistent pattern:

```
module/
  |-- __init__.py      # Package initialization
  |-- models.py        # SQLAlchemy ORM models (DB schema)
  |-- schemas.py       # Pydantic request/response schemas
  |-- router.py        # FastAPI router (endpoint definitions)
  |-- service.py       # Business logic layer
```

**Data Flow:**
```
HTTP Request -> Router -> Schema Validation -> Service -> ORM Model -> Database
HTTP Response <- Router <- Schema Serialization <- Service <- ORM Query <- Database
```

### 2.3 Database Schema (Entity Relationship)

```
users (1) ----< (N) farms
users (1) ----< (N) iot_devices

farms (1) ----< (N) zones
farms (1) ----< (N) crop_cycles
farms (1) ----< (N) livestock (via farm_id)
farms (1) ----< (N) farm_loans
farms (1) ----< (N) farm_inventory
farms (1) ----< (N) farm_assets
farms (1) ----< (N) farm_activities
farms (1) ----< (N) labor_jobs
farms (1) ----< (N) farm_financials

livestock (1) ----< (N) livestock_production
livestock (1) ----< (N) livestock_feed_plans
livestock (1) ----< (N) livestock_health_logs
livestock (N) >---- (1) livestock_housing

livestock_housing (1) ----< (N) livestock_monitoring_devices
livestock_monitoring_devices (1) ----< (N) livestock_monitoring_alerts
livestock_monitoring_devices (1) ----< (N) livestock_telemetry
livestock_monitoring_devices (1) ----< (N) livestock_smart_device_logs

crop_cycles (1) ----< (N) crop_harvest_logs
crop_cycles (1) ----< (N) farm_activities (via crop_cycle_id)

iot_devices (1) ----< (N) iot_commands

registry (standalone - universal entity registry)

kg_crops (N) >----< (N) kg_pests (via kg_pest_crop)
kg_pests (N) >----< (N) kg_chemicals (via kg_chemical_pest)

service_providers (1) ----< (N) service_listings
product_listings (1) ----< (N) marketplace_orders

supply_chain_batches (1) ----< (N) supply_chain_events

diagnosis_logs (standalone - AI diagnosis records)
```

### 2.4 Authentication Architecture

```
                    +-------------------+
                    |   Frontend        |
                    |   (localStorage)  |
                    +--------+----------+
                             |
                    Bearer Token (JWT)
                             |
                    +--------v----------+
                    |   FastAPI Router   |
                    +--------+----------+
                             |
                    Depends(get_current_user)
                             |
                    +--------v----------+
                    |   JWT Decode      |
                    |   (python-jose)   |
                    +--------+----------+
                             |
                    +--------v----------+
                    |   DB User Lookup  |
                    |   (by email)      |
                    +-------------------+
```

- **Algorithm:** HS256
- **Token Lifetime:** 7 days (`60 * 24 * 7` minutes)
- **Secret Key:** Configurable via `settings.SECRET_KEY`
- **Password Hashing:** bcrypt via passlib

### 2.5 Database Connection

| Setting | Value |
|---|---|
| Pool Size | 5 |
| Max Overflow | 10 |
| Pool Timeout | 30s |
| Pool Recycle | 3600s (1 hour) |
| Pre-Ping | Enabled |
| Dev Fallback | SQLite (`agrios_dev.db`) |

---

## 3. Frontend Architecture

### 3.1 Application Layer

```
Next.js 14 App Router
  |
  +-- middleware.ts (next-intl locale routing)
  |
  +-- src/app/[locale]/
  |     |-- layout.tsx (Root layout with GlobalProviders)
  |     |-- page.tsx (Home: Landing vs Dashboard)
  |     |-- auth/ (Login, Signup)
  |     |-- [feature]/ (Each feature has page.tsx + layout.tsx)
  |
  +-- src/components/
  |     |-- GlobalProviders.tsx (Theme + Auth + QueryClient)
  |     |-- AppShell.tsx (Sidebar + NavBar + Content)
  |     |-- AuthGuard.tsx (Route protection)
  |     |-- [feature]/ (Feature-specific components)
  |
  +-- src/lib/
  |     |-- api.ts (Centralized API client)
  |     |-- auth-context.tsx (Auth state management)
  |     |-- constants.ts (API_BASE_URL)
  |     |-- userFarm.ts (Farm ID resolution)
  |
  +-- src/db/ (WatermelonDB offline database)
  +-- src/i18n/ (Internationalization config)
  +-- src/messages/ (Translation files x10 languages)
```

### 3.2 State Management

| Concern | Solution |
|---|---|
| Authentication | React Context (`AuthProvider`) |
| Server State | TanStack React Query (implicit via api.ts caching) |
| API Caching | Custom in-memory cache in `api.ts` (5-min TTL) |
| Offline Data | WatermelonDB + LokiJS |
| Theme | next-themes (dark/light) |
| Locale | next-intl (URL-based: `/en/`, `/hi/`, etc.) |

### 3.3 API Client Architecture

```
api.ts
  |
  +-- fetchAPI<T>(endpoint, method, body, useCache)
  |     |-- Adds Bearer token from localStorage
  |     |-- 5-minute GET cache (in-memory Map)
  |     |-- Cache cleared on any mutation (POST/PUT/DELETE)
  |
  +-- api.registry.*     (CRUD)
  +-- api.farms.*        (CRUD)
  +-- api.crops.*        (CRUD)
  +-- api.livestock.*    (CRUD + smart monitoring)
  +-- api.iot.*          (device CRUD + commands)
  +-- api.marketplace.*  (listings, products, orders)
  +-- api.supplyChain.*  (batches, events)
  +-- api.farmManagement.* (loans, inventory, assets, labor, financials)
  +-- api.weather.*      (advisory)
  +-- api.voice.*        (voice queries)
  +-- api.sync.*         (offline sync)
```

### 3.4 Routing Architecture

```
/[locale]/                    # Home (Landing or Dashboard)
/[locale]/auth/login          # Authentication
/[locale]/auth/signup         # Registration
/[locale]/farms               # Farm CRUD
/[locale]/crops               # Crop management
/[locale]/livestock           # Livestock management
/[locale]/devices             # IoT devices
/[locale]/devices/[id]        # Device detail
/[locale]/devices/new         # New device
/[locale]/farm-management     # Full farm operations (tabbed)
/[locale]/smart-monitor       # Livestock smart shelter
/[locale]/marketplace         # P2P marketplace
/[locale]/supply-chain        # Supply chain tracking
/[locale]/crop-doctor         # AI disease diagnosis
/[locale]/library             # Knowledge graph browser
/[locale]/drone               # Drone analytics
/[locale]/calculator          # Farm calculator
/[locale]/community           # Community forum
/[locale]/docs                # Documentation
/[locale]/features            # Marketing (public)
/[locale]/use-cases           # Marketing (public)
/[locale]/verify/[fid]/[aid]  # QR verification (public)
```

### 3.5 Component Hierarchy

```
GlobalProviders
  |-- ThemeProvider (next-themes)
  |-- AuthProvider (auth-context)
  |-- QueryClientProvider (react-query)
  |-- ServerWakeupIndicator
  |
  +-- AppShell
        |-- Sidebar (authenticated only)
        |-- NavBar (authenticated only)
        |-- Main Content Area
              |-- Page Components
                    |-- Feature Components
                          |-- Modal Components
                          |-- UI Primitives (Card, Modal, ContentLoader)
```

---

## 4. Infrastructure Architecture

### 4.1 Docker Compose (Local Development)

| Service | Image | Port | Purpose |
|---|---|---|---|
| backend | ./backend (Dockerfile) | 8000 | FastAPI API |
| frontend | ./frontend (Dockerfile) | 3000 | Next.js App |
| db | postgis/postgis:15-3.3 | 5432 | PostgreSQL + PostGIS |
| redis | redis:alpine | 6379 | Cache & Queue |
| meilisearch | getmeili/meilisearch:v1.3 | 7700 | Full-text Search |

### 4.2 Production (Render + Vercel)

```
                    +------------------+
                    |    Vercel        |
                    |    (Frontend)    |
                    +--------+---------+
                             |
                    NEXT_PUBLIC_API_URL
                             |
                    +--------v---------+
                    |    Render        |
                    |    (Backend)     |
                    +--------+---------+
                             |
                    DATABASE_URL
                             |
                    +--------v---------+
                    |    Supabase      |
                    |    PostgreSQL    |
                    +------------------+
```

### 4.3 Environment Configuration

| Environment | Backend DB | Frontend API | Auth |
|---|---|---|---|
| Local Dev | SQLite (agrios_dev.db) | http://127.0.0.1:8000/api/v1 | Local JWT |
| Docker Dev | PostgreSQL (local) | http://localhost:8000/api/v1 | Local JWT |
| Production | Supabase PostgreSQL | Render URL/api/v1 | Production JWT |

---

## 5. Security Architecture

### 5.1 Authentication Flow

1. User submits email + password to `/api/v1/auth/login`
2. Backend verifies credentials against bcrypt hash
3. Returns JWT token (HS256, 7-day expiry)
4. Frontend stores token in `localStorage`
5. All API requests include `Authorization: Bearer <token>`
6. Backend validates token via `get_current_user` dependency

### 5.2 Authorization Model

| Layer | Mechanism |
|---|---|
| Route Protection | `AuthGuard` component (frontend) |
| API Protection | `Depends(get_current_user)` (backend) |
| Data Isolation | Farm ownership check (`owner_id == current_user.id`) |
| Role-Based | `user.role` field (farmer, buyer, expert, admin) |

### 5.3 Identified Security Boundaries

| Boundary | Status |
|---|---|
| CORS | `allow_origins=["*"]` (OPEN - needs restriction in prod) |
| HTTPS | Enforced by Vercel/Render |
| Secrets in Code | **VIOLATION** - `docker-compose.yml` contains credentials |
| JWT Secret | Hardcoded default (should be env var in prod) |
| Input Validation | Pydantic schemas on all endpoints |
| SQL Injection | Protected by SQLAlchemy ORM |
| File Upload | Limited to diagnosis images |

---

## 6. Data Flow Diagrams

### 6.1 Crop Disease Diagnosis Flow

```
Farmer Takes Photo -> Frontend DiagnosisUploader
  -> POST /api/v1/diagnosis/predict (multipart/form-data)
    -> DiagnosisService (AI inference or mock)
      -> DiagnosisLog (saved to DB)
        -> KnowledgeGraph lookup (Pest -> Chemical recommendations)
    <- Response: disease, confidence, treatment, prevention
  <- Display results with marketplace product links
```

### 6.2 IoT Device Command Flow

```
User clicks Valve Toggle -> Frontend DeviceControlModal
  -> POST /api/v1/iot/devices/{id}/command
    -> IoTService validates device ownership
      -> IoTCommand created (status: PENDING)
        -> Transport: MQTT or SMS (based on connectivity)
    <- Response: command_id, status
  <- UI updates valve state
```

### 6.3 Multi-User Data Isolation Flow

```
User Login -> /api/v1/auth/login -> JWT Token
  -> /api/v1/farm-management/user-farm-id
    -> UserFarmService.get_or_create_farm(user_id)
      -> Returns farm_id owned by this user
  -> All subsequent queries filtered by farm_id
  -> Write operations verify farm.owner_id == user.id
    -> 403 Forbidden if mismatch
```

---

## 7. Integration Points

| External Service | Purpose | Module |
|---|---|---|
| Supabase PostgreSQL | Production database | core/database |
| HuggingFace Hub | AI model inference | core/huggingface_service |
| Google Cloud Speech | Voice-to-text | voice_search |
| Google Cloud TTS | Text-to-speech | voice_search |
| Twilio | SMS notifications | common/sms |
| Weather API | Agricultural weather | weather |
| Gemini AI | Voice search processing | voice_search |
| OpenTelemetry | Observability | core/telemetry |

---

## 8. Architectural Decisions Reference

All architectural decisions are tracked in [DECISION_LOG.md](DECISION_LOG.md).
