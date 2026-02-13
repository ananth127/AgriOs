# DATA ACCESS POLICY — Agri-OS

> **Document Type:** Data Visibility & Access Control Audit
> **Last Updated:** 2026-02-06
> **Status:** ACTIVE — CRITICAL VIOLATIONS FOUND
> **Purpose:** Define what data is PRIVATE (per-user), what is PUBLIC (shared), and audit every endpoint for compliance

---

## 1. Data Classification Principles

### PRIVATE Data (User-Owned — NEVER visible to other users)

These are a user's personal assets, records, and operational data. Another user seeing this data is a **security breach**.

| Data Type | Examples | Ownership Key |
|---|---|---|
| **Farms** | Farm boundaries, zones, soil profiles | `farms.owner_id = user.id` |
| **Crops** | Crop cycles, sowing dates, health scores | `crop_cycles.farm_id → farms.owner_id` |
| **Livestock** | Animals, health logs, production logs, QR codes | `livestock.farm_id → farms.owner_id` |
| **IoT Devices** | ESP32 devices, sensors, valves, pumps | `iot_devices.user_id = user.id` |
| **IoT Commands** | Device commands, history | `iot_commands.device_id → iot_devices.user_id` |
| **Smart Monitoring** | Cameras, alerts, telemetry in shelters | `monitoring_devices.housing_id → housing.farm_id → farms.owner_id` |
| **Farm Assets** | Tractors, pumps, drip systems, machinery | `farm_assets.farm_id → farms.owner_id` |
| **Farm Inventory** | Fertilizers, pesticides, seeds, fuel | `farm_inventory.farm_id → farms.owner_id` |
| **Farm Loans** | Loan amounts, interest, repayment schedules | `farm_loans.farm_id → farms.owner_id` |
| **Farm Financials** | Revenue, expenses, profit | `farm_financials.farm_id → farms.owner_id` |
| **Farm Activities** | Irrigation, fertilization, sowing, harvesting logs | `farm_activities.farm_id → farms.owner_id` |
| **Diagnosis History** | User's own crop disease scans | `diagnosis_logs` (currently NO user_id!) |
| **User Profile** | Email, password, location, survey number | `users.id = user.id` |
| **Consent Records** | GDPR/DPDP consent history | `user_consent.user_id` |
| **Supply Chain Batches** | User's own product batches | `supply_chain_batches` (currently NO user_id!) |

### PUBLIC Data (Visible to ALL authenticated users)

This data is inherently shared and benefits from cross-user visibility.

| Data Type | Examples | Why Public |
|---|---|---|
| **Marketplace Listings** | "Selling 2 tons Wheat", "Buying Tomato Seeds" | Marketplace only works if buyers see sellers' listings |
| **Commercial Products** | "Dithane M-45 by UPL" | Product catalog is reference data, not user-owned |
| **Service Listings** | "Drone Spraying - Rs 500/acre" | Service providers need visibility |
| **Labor Job Postings** | "Need 5 workers for harvesting" | Workers need to find available jobs |
| **Knowledge Graph** | Crops, pests, chemicals, treatments | Educational reference data |
| **Registry** | Crop profiles and definitions | Universal reference data |
| **Weather Advisory** | Weather forecasts, disease risk alerts | Location-based, not user-specific |

### PUBLIC Data (Visible WITHOUT authentication)

| Data Type | Examples | Why |
|---|---|---|
| **QR Verification** | `/verify/{farmerId}/{animalId}` | QR codes scanned by anyone |
| **Marketing Pages** | Features, use-cases, docs | Public website |

---

## 2. Endpoint-by-Endpoint Audit

### Legend

| Symbol | Meaning |
|---|---|
| ✅ | Correctly implemented |
| ❌ | **VIOLATION — Needs fix** |
| ⚠️ | Partial — has auth but missing ownership check |
| 🔓 | Intentionally public |

---

### 2.1 Auth Module (`/api/v1/auth`) — ✅ COMPLIANT

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `POST /register` | None (public) | N/A | ✅ | Registration is public |
| `POST /login` | None (public) | N/A | ✅ | Login is public |
| `GET /me` | `get_current_user` | Self only | ✅ | Returns own profile only |
| `PUT /me` | `get_current_user` | Self only | ✅ | Updates own profile only |

---

### 2.2 Farms Module (`/api/v1/farms`) — ✅ COMPLIANT

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `POST /` | `get_current_user` | Auto-assigns `owner_id` | ✅ | |
| `GET /` | `get_current_user` | Filters by `owner_id` | ✅ | |
| `GET /{farm_id}` | `get_current_user` | Checks `owner_id` | ✅ | Returns 404 for non-owned |
| `PUT /{farm_id}` | `get_current_user` | Checks `owner_id` | ✅ | |
| `DELETE /{farm_id}` | `get_current_user` | Checks `owner_id` | ✅ | |
| `PUT /zones/{zone_id}` | **None** | **None** | ❌ | **No auth, no ownership check** |

**Violation: `PUT /zones/{zone_id}` — Any unauthenticated user can modify any zone.**

---

### 2.3 Crops Module (`/api/v1/crops`) — ❌ FULLY BROKEN

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `POST /` | **None** | **None** | ❌ | **Anyone can plant crops in any farm** |
| `GET /farm/{farm_id}` | **None** | **None** | ❌ | **Anyone can see any farm's crops** |
| `PUT /{cycle_id}` | **None** | **None** | ❌ | **Anyone can modify any crop** |
| `DELETE /{cycle_id}` | **None** | **None** | ❌ | **Anyone can delete any crop** |

**CRITICAL: Zero authentication. Zero ownership checks. All 4 endpoints fully exposed.**

---

### 2.4 Livestock Module (`/api/v1/livestock`) — ❌ FULLY BROKEN

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `POST /` | **None** | **None** | ❌ | **Anyone can register animals in any farm** |
| `GET /farm/{farm_id}` | **None** | **None** | ❌ | **Anyone can see any farm's animals** |
| `GET /farm/{farm_id}/stats` | **None** | **None** | ❌ | **Anyone can see production stats** |
| `GET /farm/{farm_id}/housing` | **None** | **None** | ❌ | **Anyone can see housing** |
| `GET /{animal_id}` | **None** | **None** | ❌ | **Anyone can see any animal detail** |
| `PUT /{animal_id}` | **None** | **None** | ❌ | **Anyone can modify any animal** |
| `DELETE /{animal_id}` | **None** | **None** | ❌ | **Anyone can delete any animal** |
| `POST /{animal_id}/production` | **None** | **None** | ❌ | **Anyone can log production** |
| `GET /{animal_id}/production` | **None** | **None** | ❌ | **Anyone can see production history** |
| `POST /{animal_id}/health-logs` | **None** | **None** | ❌ | **Anyone can add health logs** |
| `GET /{animal_id}/health-logs` | **None** | **None** | ❌ | **Anyone can see health logs** |
| `POST /housing` | **None** | **None** | ❌ | **Anyone can create housing** |
| `DELETE /housing/{id}` | **None** | **None** | ❌ | **Anyone can delete housing** |
| `GET /feed-plans` | **None** | **None** | ❌ | **Anyone can see feed plans** |
| `POST /feed-plans` | **None** | **None** | ❌ | **Anyone can create feed plans** |
| `DELETE /feed-plans/{id}` | **None** | **None** | ❌ | **Anyone can delete feed plans** |
| `POST /smart/devices` | **None** | **None** | ❌ | **Anyone can register monitoring devices** |
| `GET /smart/housing/{id}/devices` | **None** | **None** | ❌ | **Anyone can see monitoring devices** |
| `POST /smart/telemetry` | **None** | **None** | ❌ | **Anyone can log telemetry** |
| `POST /smart/alerts` | **None** | **None** | ❌ | **Anyone can create alerts** |
| `GET /smart/alerts/active` | **None** | **None** | ❌ | **Anyone can see all active alerts** |
| `PUT /smart/alerts/{id}/resolve` | **None** | **None** | ❌ | **Anyone can resolve alerts** |
| `POST /smart/devices/{id}/log` | **None** | **None** | ❌ | **Anyone can log device actions** |
| `GET /smart/housing/{id}/suggestions` | **None** | **None** | ❌ | **Anyone can see suggestions** |

**CRITICAL: 24 endpoints with zero authentication. This is the biggest violation in the entire system.**

---

### 2.5 IoT Module (`/api/v1/iot`) — ✅ COMPLIANT

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `GET /devices` | `get_current_user` | Filters by `user_id` | ✅ | Only shows user's devices |
| `POST /devices` | `get_current_user` | Sets `user_id` | ✅ | |
| `GET /devices/{id}` | `get_current_user` | Checks `user_id` (403) | ✅ | |
| `PUT /devices/{id}` | `get_current_user` | Checks `user_id` (403) | ✅ | |
| `POST /devices/{id}/command` | `get_current_user` | Checks `user_id` (403) | ✅ | |
| `GET /devices/{id}/commands` | `get_current_user` | Checks `user_id` (404) | ✅ | |
| `POST /webhooks/sms` | None | N/A | 🔓 | Incoming webhook (intentional) |

**Model implementation. Every endpoint authenticates + checks ownership.**

---

### 2.6 Farm Management (`/api/v1/farm-management`) — ✅ MOSTLY COMPLIANT

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `GET /user-farm-id` | `get_current_user` | Own farm | ✅ | |
| `POST /loans` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `GET /loans/{farm_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | Returns `[]` if not owned |
| `POST /inventory` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `GET /inventory/{farm_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `PUT /inventory/{item_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `DELETE /inventory/{item_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `POST /assets` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `GET /assets/{farm_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `PUT /assets/{asset_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `DELETE /assets/{asset_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `POST /activities` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `GET /timeline/` | `get_current_user` | `verify_farm_ownership` | ⚠️ | Default `farm_id=1` in param! |
| `GET /timeline/{crop_cycle_id}` | **None** | **None** | ❌ | **No auth, no ownership** |
| `GET /financials/{farm_id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `GET /suggestions/fertilizer` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `GET /suggestions/pesticide` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `POST /labor/jobs` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `GET /labor/jobs` | `get_current_user` | `verify_farm_ownership` | ⚠️ | Default `farm_id=1` |
| `DELETE /labor/jobs/{id}` | `get_current_user` | `verify_farm_ownership` | ✅ | |
| `POST /labor/applications/{id}/accept` | `get_current_user` | **Incomplete** | ⚠️ | Comment says "should check" |

**Violations:**
- `GET /timeline/{crop_cycle_id}` — No auth, no ownership
- `GET /timeline/` — Defaults to `farm_id=1` (leftover hardcode)
- `GET /labor/jobs` — Defaults to `farm_id=1` (leftover hardcode)
- `POST /labor/applications/{id}/accept` — No ownership check on job's farm

---

### 2.7 Marketplace (`/api/v1/marketplace`) — ❌ MIXED (Auth Broken)

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `POST /providers` | **Mock** `user_id=1` | **Hardcoded** | ❌ | Uses `get_current_user_id()` returning 1 |
| `POST /providers/{id}/listings` | **None** | **None** | ❌ | Anyone can add listings to any provider |
| `GET /listings/` | **None** | N/A | 🔓 | Should be public (service listings) |
| `POST /products` | **Mock** `user_id=1` | **Hardcoded** | ❌ | All products created as user 1 |
| `GET /products/` | **None** | N/A | 🔓 | Should be public (marketplace browse) |
| `GET /search` | **None** | N/A | 🔓 | Should be public (geo search) |
| `PUT /products/{id}` | **None** | **None** | ❌ | **Anyone can edit any listing** |
| `DELETE /products/{id}` | **None** | **None** | ❌ | **Anyone can delete any listing** |
| `POST /orders` | **Mock** `user_id=1` | **Hardcoded** | ❌ | All orders placed as user 1 |
| `GET /commercial-products` | **None** | N/A | 🔓 | Should be public (product catalog) |

**Critical: `get_current_user_id()` is a mock function always returning `1`. No real authentication.**

**Data that SHOULD be public (reading):** listings, products, commercial-products, search
**Data that MUST be private (writing):** create/update/delete product — must verify `seller_id == current_user.id`

---

### 2.8 Diagnosis (`/api/v1/diagnosis`) — ❌ BROKEN

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `POST /predict` | **None** | **None** | ❌ | **No user_id saved. Anyone can diagnose.** |
| `GET /history` | **None** | **None** | ❌ | **Returns ALL users' diagnosis history globally** |

**Violation: Diagnosis history is personal medical-grade crop data. Should be per-user. The `diagnosis_logs` model has NO `user_id` column at all.**

---

### 2.9 Supply Chain (`/api/v1/supply-chain`) — ❌ BROKEN

| Endpoint | Auth | Ownership | Status | Notes |
|---|---|---|---|---|
| `POST /batches` | **None** | **None** | ❌ | **Anyone can create batches** |
| `POST /batches/{id}/events` | **None** | **None** | ❌ | **Anyone can add events to any batch** |
| `GET /batches/{id}` | **None** | **None** | ❌ | **Anyone can track any batch** |
| `GET /batches` | **None** | **None** | ❌ | **Returns ALL batches globally** |

**Note:** Supply chain tracking has a dual nature — batch reading COULD be public (for consumers scanning QR codes). But creation/modification must be user-owned. The `supply_chain_batches` model has NO `user_id` column.**

---

### 2.10 Knowledge Graph (`/api/v1/library`) — 🔓 CORRECTLY PUBLIC

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `GET /pests` | None | 🔓 | Reference data — should be public |
| `GET /crops` | None | 🔓 | Reference data — should be public |
| `GET /pests/{id}` | None | 🔓 | Reference data — should be public |
| `POST /regulatory/sync` | **None** | ⚠️ | Admin-only action, no auth |
| `GET /regulatory/check-compliance` | None | 🔓 | Reference data |

**Violation: `POST /regulatory/sync` should be admin-only.**

---

### 2.11 Registry (`/api/v1/registry`) — 🔓 CORRECTLY PUBLIC

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `POST /` | **None** | ⚠️ | Anyone can create registry entries (should be admin) |
| `GET /search` | None | 🔓 | Public reference |
| `GET /` | None | 🔓 | Public reference |
| `GET /{name}` | None | 🔓 | Public reference |

**Violation: `POST /` should require authentication (admin role).**

---

### 2.12 Dashboard (`/api/v1/dashboard`) — ✅ COMPLIANT

| Endpoint | Auth | Ownership | Status |
|---|---|---|---|
| `GET /realtime` | `get_current_user` | Filters by `user_id` | ✅ |

---

### 2.13 Weather (`/api/v1/weather`) — 🔓 CORRECTLY PUBLIC

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `GET /advisory` | None | 🔓 | Location-based, not user-specific |

---

### 2.14 Voice Search (`/api/v1/voice-search`) — ⚠️ SHOULD HAVE AUTH

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `POST /query` | **None** | ⚠️ | AI API calls cost money. Should require auth. |

---

### 2.15 Drone (`/api/v1/drone`) — ⚠️ SHOULD HAVE AUTH

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `POST /analyze` | **None** | ⚠️ | AI API calls cost money. Should require auth. |

---

### 2.16 Prophet (`/api/v1/prophet`) — 🔓 ACCEPTABLE PUBLIC

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `POST /predict` | None | 🔓 | Prediction input is user-provided, no DB data accessed |

---

### 2.17 Consent (`/api/v1/consent`) — ❌ BROKEN

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `POST /policies` | **None** | ❌ | **Anyone can create consent policies (admin-only)** |
| `GET /policies/latest` | None | 🔓 | Public (users need to see policies) |
| `POST /record-consent` | **Mock** `user_id=1` | ❌ | **Hardcoded user_id=1, no real auth** |

---

### 2.18 Sync (`/api/v1/sync`) — ❌ BROKEN

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `GET /pull` | **None** | ❌ | **Returns data without auth (mock but structure is wrong)** |
| `POST /push` | **None** | ❌ | **Accepts data without auth** |

---

### 2.19 UFSI (`/api/v1/ufsi`) — 🔓 MOCK / ACCEPTABLE

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `GET /verify-farmer/{id}` | None | 🔓 | Mock endpoint, returns static data |

---

### 2.20 Root Endpoints — ❌ VIOLATIONS

| Endpoint | Auth | Status | Notes |
|---|---|---|---|
| `GET /` | None | 🔓 | Welcome message (fine) |
| `GET /fix-db` | **None** | ❌ | **Runs ALTER TABLE without auth!** |
| `GET /debug-financials-error` | **None** | ❌ | **Exposes stack traces without auth!** |

---

## 3. VIOLATION SUMMARY

### Severity: CRITICAL (Immediate Fix Required)

| # | Module | Issue | Endpoints Affected |
|---|---|---|---|
| V-01 | **Livestock** | Zero auth on ALL 24 endpoints | 24 |
| V-02 | **Crops** | Zero auth on ALL 4 endpoints | 4 |
| V-03 | **Marketplace** | Mock `user_id=1` on writes, zero auth on edits/deletes | 6 |
| V-04 | **Supply Chain** | Zero auth on ALL 4 endpoints, no user_id in model | 4 |
| V-05 | **Diagnosis** | Zero auth, no user_id in model, history exposes all | 2 |

### Severity: HIGH (Fix Soon)

| # | Module | Issue | Endpoints Affected |
|---|---|---|---|
| V-06 | **Farm Mgmt** | Timeline endpoint no auth; hardcoded `farm_id=1` defaults | 3 |
| V-07 | **Consent** | Mock user_id, unauthenticated policy creation | 2 |
| V-08 | **Sync** | No auth on push/pull | 2 |
| V-09 | **Root** | `/fix-db` and `/debug-*` unauthenticated | 2 |

### Severity: MEDIUM (Should Fix)

| # | Module | Issue | Endpoints Affected |
|---|---|---|---|
| V-10 | **Farms** | Zone update has no auth | 1 |
| V-11 | **Knowledge Graph** | Regulatory sync has no admin check | 1 |
| V-12 | **Registry** | Create endpoint has no auth | 1 |
| V-13 | **Voice/Drone** | Cost-bearing AI endpoints have no auth | 2 |

---

## 4. TOTAL VIOLATION COUNT

| Metric | Count |
|---|---|
| **Total API Endpoints Audited** | 83 |
| **Correctly Protected (✅)** | 29 |
| **Intentionally Public (🔓)** | 14 |
| **VIOLATIONS (❌)** | **40** |
| **Percentage Broken** | **48%** |

---

## 5. REQUIRED DATABASE MODEL CHANGES

These models are missing `user_id` columns, making ownership enforcement impossible:

| Model | Table | Missing Column | Fix |
|---|---|---|---|
| `DiagnosisLog` | `diagnosis_logs` | `user_id` | Add `user_id = Column(Integer, ForeignKey("users.id"))` |
| `ProductBatch` | `supply_chain_batches` | `user_id` | Add `user_id = Column(Integer, ForeignKey("users.id"))` |

---

## 6. REQUIRED FIX PLAN (Priority Order)

### Phase 1: CRITICAL — Livestock + Crops (48 endpoints)

**What:** Add `get_current_user` dependency + farm ownership checks to ALL livestock and crops endpoints.

**Pattern to follow (copy from IoT router):**
```python
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

@router.get("/farm/{farm_id}", response_model=List[schemas.Animal])
def get_farm_animals(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ADD THIS
):
    # ADD THIS: Verify the farm belongs to this user
    farm = db.query(FarmTable).filter(FarmTable.id == farm_id).first()
    if not farm or farm.owner_id != current_user.id:
        return []
    return service.get_animals_by_farm(db, farm_id)
```

### Phase 2: HIGH — Marketplace Auth

**What:** Replace mock `get_current_user_id()` with real `get_current_user` dependency. Add `seller_id == current_user.id` checks on update/delete.

**Keep public:** `GET /products/`, `GET /listings/`, `GET /commercial-products`, `GET /search`

### Phase 3: HIGH — Diagnosis + Supply Chain

**What:**
1. Add `user_id` column to `DiagnosisLog` and `ProductBatch` models
2. Add auth to all endpoints
3. Filter history by user_id

### Phase 4: MEDIUM — Cleanup

**What:**
1. Add auth to zone update, registry create, regulatory sync
2. Add auth to voice/drone endpoints
3. Remove `/fix-db` and `/debug-*` endpoints from production
4. Fix `farm_id=1` defaults in farm management

---

## 7. PUBLIC vs PRIVATE — FINAL CLASSIFICATION

### Data That MUST Be Shared (Public Read)

| Data | Endpoint | Why |
|---|---|---|
| Marketplace product listings | `GET /marketplace/products/` | Buyers need to see sellers |
| Service listings | `GET /marketplace/listings/` | Users find services |
| Commercial product catalog | `GET /marketplace/commercial-products` | Reference/shopping |
| Labor job postings | `GET /farm-management/labor/jobs` (all farms) | Workers need to find jobs |
| Knowledge graph (pests, crops, chemicals) | `GET /library/*` | Educational reference |
| Registry (crop definitions) | `GET /registry/*` | Universal reference |
| Weather advisory | `GET /weather/advisory` | Location-based utility |
| Supply chain batch tracking (read) | `GET /supply-chain/batches/{id}` | Consumer transparency |
| QR verification | `GET /verify/{farmerId}/{animalId}` | Public verification |

### Data That MUST Be Private (User-Only)

| Data | Current Status | Required Fix |
|---|---|---|
| User's farms, zones, soil data | ✅ Protected | — |
| User's crop cycles | ❌ EXPOSED | Add auth + ownership |
| User's livestock, health logs, production | ❌ EXPOSED | Add auth + ownership |
| User's IoT devices + commands | ✅ Protected | — |
| User's smart monitoring (cameras, alerts) | ❌ EXPOSED | Add auth + ownership |
| User's farm assets (machinery) | ✅ Protected | — |
| User's inventory (fertilizer, seeds) | ✅ Protected | — |
| User's loans | ✅ Protected | — |
| User's financials | ✅ Protected | — |
| User's activities/timeline | ⚠️ Partial | Fix timeline endpoint |
| User's diagnosis history | ❌ EXPOSED (no user_id) | Add user_id + auth |
| User's supply chain batches | ❌ EXPOSED (no user_id) | Add user_id + auth |
| User's consent records | ❌ Mock user_id | Use real auth |
| User's marketplace listings (write) | ❌ Mock user_id | Use real auth |

### Data That Has Dual Nature (Public Read, Private Write)

| Data | Read Access | Write Access |
|---|---|---|
| Marketplace listings | Public (all can browse) | Private (only owner can edit/delete) |
| Labor job postings | Public (workers can see) | Private (only farm owner can create/delete) |
| Supply chain batches | Public (consumers can track) | Private (only creator can add events) |

---

## 8. COMPLIANCE SCORECARD

| Module | Endpoints | Protected | Exposed | Score |
|---|---|---|---|---|
| Auth | 4 | 4 | 0 | **100%** |
| Farms | 6 | 5 | 1 | **83%** |
| IoT | 7 | 7 | 0 | **100%** |
| Farm Management | 21 | 17 | 4 | **81%** |
| Dashboard | 1 | 1 | 0 | **100%** |
| Crops | 4 | 0 | 4 | **0%** |
| Livestock | 24 | 0 | 24 | **0%** |
| Marketplace | 10 | 0 | 6 | **40%** |
| Diagnosis | 2 | 0 | 2 | **0%** |
| Supply Chain | 4 | 0 | 4 | **0%** |
| Consent | 3 | 0 | 2 | **33%** |
| Sync | 2 | 0 | 2 | **0%** |
| Knowledge Graph | 5 | 4 | 1 | **80%** |
| Registry | 4 | 3 | 1 | **75%** |
| Weather | 1 | 1 | 0 | **100%** |
| Voice | 1 | 0 | 1 | **0%** |
| Drone | 1 | 0 | 1 | **0%** |
| Prophet | 1 | 1 | 0 | **100%** |
| UFSI | 1 | 1 | 0 | **100%** |
| Root | 3 | 1 | 2 | **33%** |
| **TOTAL** | **105** | **45** | **55** | **43%** |

---

## 9. Cross-References

| Document | Relation |
|---|---|
| [RISK_ANALYSIS.md](RISK_ANALYSIS.md) | RISK-008 (Incomplete multi-user isolation) |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | ISS-005 (Incomplete data isolation) |
| [EPIC-001](epics/EPIC-001-multi-user-isolation.md) | Multi-user isolation epic |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Section 5.2 (Authorization Model) |

---

## 10. Mandatory Research Protocol

> **Rule:** Before implementing ANY feature, execute this research protocol. No code is written until all phases are completed and confirmed.

### RESEARCH PHASE (MANDATORY)

#### 1. Real-world behavior research

Before writing any implementation code, research how the feature works in production applications:

- How does this work in production applications?
- What is the standard/expected behavior?
- Example: "For login functionality, I need to research:
  - Session management best practices
  - Token expiration standards
  - Error handling conventions
  - Security requirements (OWASP standards)"

#### 2. Codebase pattern research

Understand how similar functionality is already implemented in Agri-OS:

- How is similar functionality implemented in our project?
- What patterns/libraries are already in use?
- What are our existing conventions?
- Find and reference: "I found that we handle authentication in [file], using [pattern]. I'll follow the same approach."

#### 3. Dependency & constraint research

Identify all external interactions, limitations, and edge cases:

- What external systems/APIs does this interact with?
- What are their actual behaviors and limitations?
- What edge cases exist in real usage?

### VALIDATION CHECKPOINT

Before writing code, present:

- "Based on research, here's how [feature] should work..."
- "Here's the real-world expected behavior..."
- "Here's how our codebase already handles similar cases..."
- "Here are the constraints and edge cases I've identified..."

**Wait for confirmation:** "Does this match your understanding and requirements?"

**ONLY THEN implement.**
