# EPIC-002: Security Hardening

> **Status:** PROPOSED
> **Created:** 2026-02-06
> **Last Updated:** 2026-02-06
> **Owner:** Human Developer

---

## 1. Business / Technical Goal

Address all CRITICAL and HIGH severity security risks identified in RISK_ANALYSIS.md. Bring the application to a production-ready security posture.

---

## 2. Affected Files & Systems

| Task | Files |
|---|---|
| Rotate exposed credentials | `docker-compose.yml`, all deployment configs |
| Remove secrets from git history | Repository-wide (BFG) |
| Restrict CORS | `backend/main.py:38-44` |
| Remove debug endpoints | `backend/main.py:116-236` |
| Add rate limiting | `backend/main.py`, `backend/requirements.txt` |
| Secure file uploads | `backend/app/modules/diagnosis/router.py` |
| Add .gitignore entries | `.gitignore` |

---

## 3. Dependencies

- Access to Supabase dashboard (credential rotation)
- Access to Gemini API console (key rotation)
- Access to GCP console (service account key rotation)

---

## 4. Risks & Unknowns

| Risk | Severity | Mitigation |
|---|---|---|
| Credential rotation causes downtime | HIGH | Rotate during off-hours, update env vars before rotating |
| BFG rewrites git history | HIGH | All team members must re-clone after history rewrite |
| Rate limiting blocks legitimate traffic | MEDIUM | Start with generous limits, monitor and adjust |

---

## 5. Acceptance Criteria

- [ ] No secrets in any committed file (verified by `git grep` scan)
- [ ] `vertex-key.json` and `*.db` in `.gitignore`
- [ ] CORS restricted to known frontend domains
- [ ] `/fix-db` and `/debug-financials-error` removed or auth-protected
- [ ] Rate limiting on `/api/v1/auth/login` (max 5/min per IP)
- [ ] File upload validation (type, size, content)
- [ ] All old credentials rotated and confirmed working

---

## 6. Rollback Plan

1. Keep old credentials active for 24h after rotation
2. CORS changes: revert to `["*"]` if frontend breaks
3. Rate limiting: disable middleware if blocking legitimate users
4. Git history: keep a pre-BFG backup branch

---

## 7. Status History

| Date | Status | Notes |
|---|---|---|
| 2026-02-06 | PROPOSED | Initial epic creation from RISK_ANALYSIS.md |
