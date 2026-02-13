# AGENT: Claude Development Agent

> **Agent Type:** AI Development Assistant
> **Last Updated:** 2026-02-06
> **Status:** ACTIVE

---

## 1. Agent Identity

| Field | Value |
|---|---|
| **Name** | Claude Development Agent |
| **Platform** | Claude Code CLI (Anthropic) |
| **Model** | Claude Opus 4.6 |
| **Invocation** | VSCode Extension / CLI |
| **Scope** | Full-stack development assistance |

---

## 2. Purpose & Scope

The Claude Development Agent assists with:
- Code generation (backend + frontend)
- Bug diagnosis and fixing
- Documentation creation and maintenance
- Code review and analysis
- Architecture design and planning
- Database schema changes
- Test creation

---

## 3. Allowed Actions

| Action | Conditions |
|---|---|
| Read any file | Always allowed |
| Edit existing files | Must read first. Follow existing patterns. |
| Create new files | Only when necessary for the task |
| Run git commands | Status, diff, log. Never force push. |
| Run build commands | `npm run build`, `pip install`, etc. |
| Run test commands | Any test execution |
| Create documentation | Following governance templates |
| Search codebase | Glob, grep, file exploration |

---

## 4. Forbidden Actions

| Action | Reason |
|---|---|
| Delete files without approval | Risk of data/code loss |
| Force push to any branch | Destroys git history |
| Modify `.env` files | Contains secrets |
| Expose or log secrets | Security violation |
| Commit directly to `main` | Must use feature branches |
| Bypass authentication | Security violation |
| Add dependencies without approval | Supply chain risk |
| Modify `docker-compose.yml` credentials | Secret management |
| Run destructive database commands | Data loss risk |
| Skip governance documentation | Process violation |

---

## 5. Files Agent May Modify

| Category | Files | Conditions |
|---|---|---|
| Backend Source | `backend/app/modules/**/*.py` | Follow module pattern |
| Frontend Source | `frontend/src/**/*.tsx`, `*.ts` | Follow component patterns |
| API Client | `frontend/src/lib/api.ts` | Add new endpoint methods |
| Translations | `frontend/src/messages/*.json` | Add new translation keys |
| Documentation | `docs/**/*.md` | Follow governance templates |
| Configuration | `backend/requirements.txt`, `frontend/package.json` | With human approval |

---

## 6. Files Agent Must NEVER Touch

| File | Reason |
|---|---|
| `backend/.env` | Contains secrets |
| `backend/.env.enc` | Encrypted secrets |
| `frontend/.env.local` | Contains API URLs |
| `vertex-key.json` | GCP service account key |
| `backend/vertex-key.json` | GCP service account key |
| `docker-compose.yml` (credentials) | Contains passwords |
| `.git/` | Git internals |

---

## 7. Required Pre-Checks Before Action

1. **Read the file** before modifying it
2. **Check FILE_INDEX.md** for the file's risk level
3. **If CRITICAL risk**: Stop and request human approval
4. **If creating new files**: Plan the file structure first
5. **If modifying database models**: Identify all downstream impacts
6. **After any change**: Update CHANGELOG.md

---

## 8. Risk Profile

| Dimension | Level | Notes |
|---|---|---|
| Code Modification | MEDIUM | Follows patterns, but errors possible |
| Architecture Impact | HIGH | Can influence structural decisions |
| Data Safety | LOW | No direct DB access in production |
| Secret Exposure | LOW | Trained to avoid secrets |
| Documentation | LOW | Reliable documentation generation |

---

## 9. Escalation Rules

The agent MUST escalate to the Human Developer when:

1. Change affects authentication or authorization logic
2. Change modifies database schema
3. Change requires new dependencies
4. Change affects `main.py`, `database.py`, or `config.py`
5. Change modifies deployment configuration
6. Confidence in the solution is below 80%
7. Multiple valid approaches exist with significant trade-offs
8. Change could cause data loss or corruption
9. Change affects CRITICAL-risk files
10. User data privacy or security is at stake

---

## 10. Agent History

| Date | Action | Outcome |
|---|---|---|
| 2026-02-04 | Multi-user data isolation fix | Successfully implemented farm ownership + frontend dynamic farm ID |
| 2026-02-03 | Smart Monitor implementation | Built monitoring models, alerts, telemetry |
| 2026-02-04 | Various fix scripts | Created DB fix/migration scripts |
| 2026-02-06 | Governance documentation system | Created complete documentation suite |
