# WORKSPACE OVERVIEW — Agri-OS

> **Document Type:** Single Source of Truth
> **Last Updated:** 2026-02-06
> **Maintained By:** Human + AI Agent (Shared)
> **Status:** ACTIVE

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project Name** | Agri-OS (Agricultural Operating System) |
| **Repository** | `AgriOs` (branch: `agrios_dev`, main: `main`) |
| **Project Type** | Full-Stack Web Application (PWA) |
| **Domain** | AgriTech — Precision Farming, IoT, Marketplace, Livestock, Supply Chain |
| **Architecture** | Monorepo — FastAPI Backend + Next.js Frontend |
| **Database** | PostgreSQL (Production) / SQLite (Dev Fallback) |
| **Deployment** | Render (Backend), Vercel (Frontend), Docker Compose (Local) |
| **License** | Proprietary |

---

## 2. System Summary

Agri-OS is a unified agricultural platform that integrates:

- **Crop Doctor** — AI-powered disease diagnosis via image upload
- **Knowledge Graph** — Crop-Pest-Chemical ontology with regulatory compliance
- **IoT Management** — ESP32-based device control (valves, pumps, sensors)
- **Livestock Management** — Animal registry, housing, feed plans, smart monitoring
- **Farm Management** — Loans, inventory, assets, machinery, labor, financials
- **Marketplace** — P2P product listings, commercial products, orders
- **Supply Chain** — Batch traceability from harvest to delivery
- **Voice Search** — Multilingual voice-driven queries via AI
- **Weather Advisory** — Location-based agricultural weather alerts
- **Drone Analytics** — Aerial imagery analysis
- **Prophet** — Price/yield prediction engine
- **Multi-language** — 10 Indian languages (en, hi, kn, ta, te, ml, mr, bn, gu, pa)

---

## 3. Technology Stack

### Backend
| Component | Technology |
|---|---|
| Framework | FastAPI (Python) |
| ORM | SQLAlchemy |
| Database | PostgreSQL + PostGIS / SQLite (dev) |
| Auth | JWT (python-jose + passlib + bcrypt) |
| AI/ML | HuggingFace Hub, Google Cloud Speech/TTS |
| GIS | GeoAlchemy2, Shapely |
| Telemetry | OpenTelemetry |
| Env Security | Cryptography (encrypted .env) |

### Frontend
| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React Context + TanStack React Query |
| i18n | next-intl (10 locales) |
| Maps | Leaflet + React-Leaflet |
| Charts | Chart.js + Recharts |
| Offline | WatermelonDB + LokiJS |
| PWA | next-pwa |
| Animations | Framer Motion |
| Analytics | React GA4 |

### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Backend Hosting | Render (Free Tier) |
| Frontend Hosting | Vercel |
| Database | Supabase PostgreSQL |
| Search | MeiliSearch (local) |
| Cache | Redis (local) |

---

## 4. Directory Structure

```
AgriOs/
|-- .agent/                    # AI agent workflow definitions
|   |-- workflows/             # Agent task blueprints
|-- backend/                   # FastAPI Python backend
|   |-- app/
|   |   |-- common/            # Constants, enums, SMS utils
|   |   |-- core/              # Config, database, i18n, telemetry
|   |   |-- models/            # Shared model definitions
|   |   |-- modules/           # Feature modules (auth, farms, iot, etc.)
|   |   |   |-- auth/          # Authentication & user management
|   |   |   |-- consent/       # GDPR/DPDP consent management
|   |   |   |-- crops/         # Crop cycle management
|   |   |   |-- dashboard/     # Aggregated dashboard data
|   |   |   |-- diagnosis/     # AI crop disease diagnosis
|   |   |   |-- drone/         # Drone imagery analysis
|   |   |   |-- farm_management/ # Loans, inventory, assets, labor
|   |   |   |-- farms/         # Farm CRUD + zones + GIS
|   |   |   |-- fintech/       # Financial services (models only)
|   |   |   |-- inventory/     # Inventory models
|   |   |   |-- iot/           # IoT device management + commands
|   |   |   |-- knowledge_graph/ # Crop-Pest-Chemical ontology
|   |   |   |-- labor/         # Labor management models
|   |   |   |-- livestock/     # Animal management + smart monitoring
|   |   |   |-- machinery/     # Machinery management + parser
|   |   |   |-- market_access/ # Market access models
|   |   |   |-- marketplace/   # P2P marketplace + orders
|   |   |   |-- prophet/       # Price/yield predictions
|   |   |   |-- registry/      # Universal crop/entity registry
|   |   |   |-- retailer/      # Retailer models
|   |   |   |-- supply_chain/  # Batch traceability
|   |   |   |-- sync/          # Offline sync API
|   |   |   |-- traceability/  # Traceability models
|   |   |   |-- ufsi/          # Universal Farm Service Interface
|   |   |   |-- voice_search/  # Voice-based queries
|   |   |   |-- weather/       # Weather advisory
|   |   |-- schemas/           # Shared Pydantic schemas
|   |-- static/                # Uploaded files (diagnosis images)
|   |-- main.py                # FastAPI app entry point
|   |-- *.py                   # Migration, debug, seed scripts
|-- frontend/                  # Next.js 14 TypeScript frontend
|   |-- public/                # PWA manifest, icons, service worker
|   |-- src/
|   |   |-- app/[locale]/      # Locale-based routing (10 languages)
|   |   |   |-- auth/          # Login, signup pages
|   |   |   |-- calculator/    # Farm calculator
|   |   |   |-- community/     # Community forum
|   |   |   |-- crop-doctor/   # Disease diagnosis UI
|   |   |   |-- crops/         # Crop management UI
|   |   |   |-- devices/       # IoT device management UI
|   |   |   |-- docs/          # Documentation pages
|   |   |   |-- drone/         # Drone analysis UI
|   |   |   |-- farm-management/ # Full farm ops dashboard
|   |   |   |-- farms/         # Farm CRUD UI
|   |   |   |-- features/      # Marketing features page
|   |   |   |-- library/       # Knowledge graph browser
|   |   |   |-- livestock/     # Livestock management UI
|   |   |   |-- marketplace/   # Marketplace UI
|   |   |   |-- smart-monitor/ # Smart shelter monitoring
|   |   |   |-- supply-chain/  # Supply chain tracking
|   |   |   |-- use-cases/     # Marketing use cases
|   |   |   |-- verify/        # QR verification page
|   |   |-- components/        # Reusable UI components
|   |   |-- db/                # WatermelonDB offline database
|   |   |-- hooks/             # Custom React hooks
|   |   |-- i18n/              # Internationalization config
|   |   |-- lib/               # API client, auth, utilities
|   |   |-- messages/          # Translation JSON files (10 langs)
|-- docs/                      # Project documentation
|   |-- governance/            # THIS GOVERNANCE SYSTEM
|   |   |-- agents/            # AI agent documentation
|   |   |-- epics/             # Epic planning artifacts
|-- docker-compose.yml         # Local dev orchestration
|-- render.yaml                # Render deployment config
```

---

## 5. Registered Artifact Types

| Artifact Type | Location | Documentation Required |
|---|---|---|
| Source Code | `backend/`, `frontend/` | FILE_INDEX.md entry + inline comments |
| Configuration | `.env*`, `*.config.*`, `*.yaml` | ARCHITECTURE.md reference |
| Infrastructure | `Dockerfile`, `docker-compose.yml`, `render.yaml` | ARCHITECTURE.md + RISK_ANALYSIS.md |
| Tests | `backend/test_*.py` | KNOWN_ISSUES.md if failing |
| Documentation | `docs/`, `*.md` | Self-documenting |
| AI Agent Artifacts | `.agent/workflows/` | `agents/<name>.md` MANDATORY |
| Epics | `docs/governance/epics/` | Epic template MANDATORY |
| Migration Scripts | `backend/*.py` (fix/migrate/seed) | CHANGELOG.md entry |
| Translation Files | `frontend/src/messages/*.json` | LOCALIZATION_PROGRESS.md |
| Static Uploads | `backend/static/` | No documentation needed |

---

## 6. Cross-References

| Document | Purpose |
|---|---|
| [FILE_INDEX.md](FILE_INDEX.md) | Every file + purpose + risk level |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design & boundaries |
| [WORKFLOW.md](WORKFLOW.md) | How work flows (human + AI) |
| [CHANGELOG.md](CHANGELOG.md) | Chronological change tracking |
| [RISK_ANALYSIS.md](RISK_ANALYSIS.md) | All known and emerging risks |
| [DECISION_LOG.md](DECISION_LOG.md) | Architectural & process decisions |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Bugs, limits, tech debt |
| [agents/](agents/) | AI agent documentation |
| [epics/](epics/) | Epic planning artifacts |

---

## 7. Golden Rules

1. **Documentation BEFORE code** — No implementation without documented intent
2. **Risk analysis BEFORE implementation** — Assess downstream impact first
3. **Approval BEFORE high-risk changes** — Explicit sign-off required
4. **Consistency ALWAYS** — All changes reflected in governance docs
5. **No silent changes** — Every modification tracked in CHANGELOG.md
6. **No undocumented agents** — Every AI agent must have its `.md` file
7. **No epic-less features** — Every feature maps to an approved Epic
