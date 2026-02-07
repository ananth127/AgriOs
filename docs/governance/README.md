# Agri-OS Governance Documentation System

> **Single Source of Truth for Developers and AI Agents**
> **Established:** 2026-02-06

---

## Quick Navigation

| Document | Purpose | Update Frequency |
|---|---|---|
| [WORKSPACE_OVERVIEW.md](WORKSPACE_OVERVIEW.md) | High-level system summary | On structural changes |
| [FILE_INDEX.md](FILE_INDEX.md) | Every file + purpose + risk level | On every file add/remove |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design & boundaries | On architectural changes |
| [WORKFLOW.md](WORKFLOW.md) | How work flows (human + AI) | On process changes |
| [CHANGELOG.md](CHANGELOG.md) | Chronological change tracking | On every change |
| [RISK_ANALYSIS.md](RISK_ANALYSIS.md) | All known and emerging risks | On risk discovery/resolution |
| [DECISION_LOG.md](DECISION_LOG.md) | Architectural & process decisions | On each decision |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Bugs, limits, tech debt | On issue discovery/resolution |
| [DATA_ACCESS_POLICY.md](DATA_ACCESS_POLICY.md) | Data visibility & access control audit | On endpoint changes |

### Agent Documentation
| Document | Purpose |
|---|---|
| [agents/claude-dev-agent.md](agents/claude-dev-agent.md) | Claude Code development agent rules |
| [agents/blueprint-workflow-agent.md](agents/blueprint-workflow-agent.md) | Blueprint progress tracking agent |
| [agents/TEMPLATE.md](agents/TEMPLATE.md) | Template for new agent documentation |

### Epics (Planning Artifacts)
| Document | Status |
|---|---|
| [epics/EPIC-001-multi-user-isolation.md](epics/EPIC-001-multi-user-isolation.md) | IN PROGRESS |
| [epics/EPIC-002-security-hardening.md](epics/EPIC-002-security-hardening.md) | PROPOSED |
| [epics/EPIC-003-database-migration-system.md](epics/EPIC-003-database-migration-system.md) | PROPOSED |
| [epics/EPIC-004-testing-infrastructure.md](epics/EPIC-004-testing-infrastructure.md) | PROPOSED |
| [epics/TEMPLATE.md](epics/TEMPLATE.md) | Template for new epics |

---

## Golden Rules

1. **Documentation BEFORE code** — No implementation without documented intent
2. **Risk analysis BEFORE implementation** — Assess downstream impact first
3. **Approval BEFORE high-risk changes** — Explicit sign-off required
4. **Consistency ALWAYS** — All changes reflected in governance docs
5. **No silent changes** — Every modification tracked in CHANGELOG.md
6. **No undocumented agents** — Every AI agent must have its `.md` file
7. **No epic-less features** — Every feature maps to an approved Epic

---

## How to Use This System

### For Developers

1. **Before starting work**: Check KNOWN_ISSUES.md and RISK_ANALYSIS.md
2. **Before coding a feature**: Create or find the relevant Epic
3. **After making changes**: Update CHANGELOG.md
4. **After creating files**: Update FILE_INDEX.md
5. **After making decisions**: Update DECISION_LOG.md

### For AI Agents

1. **Before any action**: Check your agent documentation file
2. **Verify scope**: Ensure the action is within allowed actions
3. **Check risk level**: Consult FILE_INDEX.md for file risk levels
4. **Escalate if needed**: Follow escalation rules in your agent doc
5. **Document changes**: Update CHANGELOG.md after every change

### For New Artifact Types

If a new type of artifact appears (experiments, prompts, models, datasets):

1. Define a documentation standard
2. Create a template `.md` in the appropriate directory
3. Register in WORKSPACE_OVERVIEW.md (Section 5)
4. Register in FILE_INDEX.md
5. Update WORKFLOW.md with maintenance rules

---

## Current System Health

| Metric | Status |
|---|---|
| **Open Risks** | 12 (1 CRITICAL, 5 HIGH, 5 MEDIUM, 1 LOW) |
| **Open Issues** | 14 (1 P0, 2 P1, 3 P2, 4 P3, 4 P4) |
| **Active Epics** | 1 IN PROGRESS, 3 PROPOSED |
| **Registered Agents** | 2 |
| **Compliance Violations** | 4 (see FILE_INDEX.md Section 13) |
| **API Access Control** | **43% compliant** — 40 of 83 endpoints exposed (see DATA_ACCESS_POLICY.md) |
| **Endpoints Without Auth** | 55 of 105 total (Livestock: 24, Crops: 4, Marketplace: 6, etc.) |
