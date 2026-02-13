# WORKFLOW — Agri-OS

> **Document Type:** Work Process Governance
> **Last Updated:** 2026-02-06
> **Status:** ACTIVE

---

## 1. Actors

| Actor | Role | Allowed Actions |
|---|---|---|
| **Human Developer** | Primary codebase owner | All actions. Final authority on all decisions. |
| **AI Agent (Claude)** | Development assistant | Code generation, debugging, documentation, analysis. Must follow governance rules. |
| **CI/CD Pipeline** | Automated build/deploy | Build, test, deploy (via Render/Vercel). No code changes. |

---

## 2. Change Workflow (MANDATORY for all changes)

### 2.1 Standard Change Process

```
Step 1: IDENTIFY
  |-- What type of change? (bug, feature, refactor, infra, agent, doc)
  |-- What files are affected?
  |-- What is the risk level? (Low/Medium/High/Critical)
  |
Step 2: DOCUMENT (BEFORE coding)
  |-- Create or update Epic (if feature/refactor)
  |-- Add Risk Analysis entry (if Medium+)
  |-- Add Decision Log entry (if architectural choice)
  |
Step 3: IMPLEMENT
  |-- Write code following existing patterns
  |-- Test locally
  |-- Verify no regressions
  |
Step 4: RECORD
  |-- Update CHANGELOG.md with entry
  |-- Update FILE_INDEX.md if new files created
  |-- Update KNOWN_ISSUES.md if new issues found
  |
Step 5: COMMIT
  |-- Descriptive commit message
  |-- Reference Epic/Issue if applicable
  |
Step 6: VERIFY
  |-- Frontend builds successfully
  |-- Backend starts without errors
  |-- No new CRITICAL violations in FILE_INDEX.md
```

### 2.2 Risk-Based Gates

| Risk Level | Required Before Implementation |
|---|---|
| **LOW** | Standard commit message |
| **MEDIUM** | CHANGELOG entry |
| **HIGH** | CHANGELOG + Risk Analysis entry + Testing |
| **CRITICAL** | Epic + Risk Analysis + Decision Log + Explicit Approval Note + Rollback Plan |

---

## 3. Development Workflow

### 3.1 Local Development Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Docker (full stack)
docker-compose up --build
```

### 3.2 Branch Strategy

| Branch | Purpose | Protection |
|---|---|---|
| `main` | Production-ready code | Deploy target |
| `agrios_dev` | Active development | Primary working branch |
| `feature/*` | Feature branches (recommended) | None currently |
| `fix/*` | Bug fix branches (recommended) | None currently |

### 3.3 Commit Message Convention

```
<type>: <short description>

Types:
  feat:     New feature
  fix:      Bug fix
  refactor: Code restructuring
  docs:     Documentation changes
  infra:    Infrastructure changes
  chore:    Maintenance tasks
  hotfix:   Emergency production fix

Examples:
  feat: Add livestock health log API endpoint
  fix: Resolve multi-user data isolation issue
  docs: Update ARCHITECTURE.md with IoT flow diagram
```

---

## 4. AI Agent Workflow

### 4.1 Before Any AI Agent Action

```
1. CHECK: Does the agent have a documentation file in agents/?
   |-- NO  -> Create agents/<agent_name>.md FIRST
   |-- YES -> Proceed
   |
2. CHECK: Is this action within the agent's allowed scope?
   |-- NO  -> STOP. Escalate to Human Developer.
   |-- YES -> Proceed
   |
3. CHECK: Does this change touch CRITICAL-risk files?
   |-- YES -> Require Human Developer approval
   |-- NO  -> Proceed
   |
4. EXECUTE: Perform the action
   |
5. RECORD: Update CHANGELOG.md with what was changed
```

### 4.2 AI Agent Rules (Non-Negotiable)

1. **Never modify** without reading the file first
2. **Never delete** files without explicit human approval
3. **Never commit** secrets, credentials, or API keys
4. **Always update** governance docs after making changes
5. **Always explain** the reasoning behind changes
6. **Never bypass** security mechanisms (auth, validation)
7. **Respect** the module boundary pattern (models/schemas/router/service)

### 4.3 AI Agent Escalation Triggers

The AI agent MUST escalate to the Human Developer when:

| Trigger | Action |
|---|---|
| Change affects `main.py` | Escalate |
| Change affects `database.py` or `config.py` | Escalate |
| Change requires new Python dependency | Escalate |
| Change requires new npm package | Escalate |
| Change modifies authentication logic | Escalate |
| Change affects database schema (new columns/tables) | Escalate |
| Change modifies `docker-compose.yml` or `render.yaml` | Escalate |
| Confidence in solution < 80% | Escalate |
| Change could cause data loss | Escalate |

---

## 5. Feature Development Workflow

### 5.1 New Feature Lifecycle

```
1. PROPOSAL
   |-- Create Epic: docs/governance/epics/EPIC-XXX-feature-name.md
   |-- Define: Goal, Affected Files, Dependencies, Risks, Acceptance Criteria
   |-- Set Status: PROPOSED
   |
2. APPROVAL
   |-- Human Developer reviews Epic
   |-- Risk Analysis reviewed
   |-- Set Status: APPROVED
   |
3. IMPLEMENTATION
   |-- Set Status: IN PROGRESS
   |-- Follow Module Pattern:
   |     Backend:  models.py -> schemas.py -> service.py -> router.py -> main.py (mount)
   |     Frontend: page.tsx -> components -> api.ts (add methods) -> translations
   |-- Write tests
   |
4. INTEGRATION
   |-- Update CHANGELOG.md
   |-- Update FILE_INDEX.md (new files)
   |-- Update ARCHITECTURE.md (if structural change)
   |-- Verify builds pass
   |
5. COMPLETION
   |-- Set Epic Status: DONE
   |-- Commit with reference to Epic
```

### 5.2 Backend Module Creation Template

```
backend/app/modules/<module_name>/
  |-- __init__.py         # Empty or minimal imports
  |-- models.py           # SQLAlchemy models (extend Base)
  |-- schemas.py          # Pydantic request/response schemas
  |-- service.py          # Business logic (receives db session)
  |-- router.py           # FastAPI router (APIRouter)
```

Then in `main.py`:
```python
from app.modules.<module_name> import models as <module>_models
from app.modules.<module_name> import router as <module>_router
app.include_router(<module>_router.router, prefix="/api/v1/<module>", tags=["<module>"])
```

### 5.3 Frontend Page Creation Template

```
frontend/src/app/[locale]/<feature>/
  |-- layout.tsx          # Metadata + layout wrapper
  |-- page.tsx            # Main page component (uses AuthGuard)

frontend/src/components/<feature>/
  |-- <Feature>Dashboard.tsx   # Main feature view
  |-- <Feature>Modal.tsx       # Create/Edit modals
  |-- <Feature>Card.tsx        # List item card
```

Then in `api.ts`:
```typescript
api.<feature> = {
    list: () => fetchAPI("/<feature>/"),
    create: (data: any) => fetchAPI("/<feature>/", "POST", data),
    // ...
};
```

---

## 6. Bug Fix Workflow

```
1. REPRODUCE
   |-- Document the bug (steps, expected vs actual)
   |-- Identify affected files
   |
2. ASSESS
   |-- Risk level of the fix?
   |-- Can it cause regressions?
   |-- Update KNOWN_ISSUES.md if not already listed
   |
3. FIX
   |-- Implement minimal fix
   |-- Test the specific scenario
   |-- Verify no regressions
   |
4. RECORD
   |-- Update CHANGELOG.md
   |-- Update KNOWN_ISSUES.md (mark resolved)
   |-- Commit: "fix: <description>"
```

---

## 7. Database Change Workflow

Database changes are HIGH-RISK by default.

```
1. PLAN
   |-- Document new columns/tables needed
   |-- Check for downstream dependencies
   |-- Assess data migration needs
   |
2. MODEL
   |-- Update models.py in the appropriate module
   |-- SQLAlchemy will auto-create on startup (create_all)
   |
3. MIGRATE (if production)
   |-- Write migration script in backend/
   |-- Test on dev database first
   |-- Document in CHANGELOG.md
   |
4. VERIFY
   |-- Check all endpoints still work
   |-- Check frontend renders correctly
   |-- No orphaned data
```

---

## 8. Deployment Workflow

### 8.1 Backend (Render)

```
1. Merge to main branch
2. Render auto-deploys from main
3. Build: pip install -r requirements.txt
4. Start: uvicorn main:app --host 0.0.0.0 --port $PORT
5. Health check: /docs
```

### 8.2 Frontend (Vercel)

```
1. Push to main/agrios_dev
2. Vercel auto-deploys
3. Build: next build
4. Verify: Check deployment URL
```

### 8.3 Pre-Deployment Checklist

- [ ] All governance docs updated
- [ ] CHANGELOG.md has new entries
- [ ] No CRITICAL violations in FILE_INDEX.md
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend starts without errors
- [ ] No secrets hardcoded in committed files
- [ ] Environment variables configured on target platform

---

## 9. Documentation Maintenance Workflow

| Trigger | Required Update |
|---|---|
| New file created | FILE_INDEX.md |
| File deleted | FILE_INDEX.md |
| New feature | CHANGELOG.md + Epic |
| Bug fixed | CHANGELOG.md + KNOWN_ISSUES.md |
| Architectural change | ARCHITECTURE.md + DECISION_LOG.md |
| New risk identified | RISK_ANALYSIS.md |
| New AI agent | agents/<name>.md |
| New artifact type | WORKSPACE_OVERVIEW.md + FILE_INDEX.md + WORKFLOW.md |

---

## 10. Emergency Hotfix Workflow

For production-breaking issues:

```
1. ASSESS severity (Is production down? Data at risk?)
2. FIX directly on main (or hotfix branch)
3. DEPLOY immediately
4. DOCUMENT retroactively:
   |-- CHANGELOG.md entry with [HOTFIX] tag
   |-- KNOWN_ISSUES.md if root cause not fully resolved
   |-- RISK_ANALYSIS.md if new risk discovered
5. POST-MORTEM within 24 hours
```
