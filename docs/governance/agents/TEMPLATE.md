# AGENT: [Agent Name]

> **Agent Type:** [AI Dev | Planning | Monitoring | etc.]
> **Last Updated:** YYYY-MM-DD
> **Status:** ACTIVE | INACTIVE | DEPRECATED

---

## 1. Agent Identity

| Field | Value |
|---|---|
| **Name** | [Agent name] |
| **Platform** | [Where it runs] |
| **Scope** | [What it does] |

---

## 2. Purpose & Scope

[Description of what this agent does and its boundaries]

---

## 3. Allowed Actions

| Action | Conditions |
|---|---|
| [Action] | [When/how it's allowed] |

---

## 4. Forbidden Actions

| Action | Reason |
|---|---|
| [Action] | [Why it's forbidden] |

---

## 5. Files Agent May Modify

| File/Pattern | Purpose |
|---|---|
| [File path or glob] | [Why] |

---

## 6. Files Agent Must NEVER Touch

| File | Reason |
|---|---|
| [File path] | [Why] |

---

## 7. Required Pre-Checks Before Action

1. [Pre-check 1]
2. [Pre-check 2]

---

## 8. Risk Profile

| Dimension | Level | Notes |
|---|---|---|
| Code Modification | [NONE/LOW/MEDIUM/HIGH] | [Notes] |
| Architecture Impact | [NONE/LOW/MEDIUM/HIGH] | [Notes] |
| Data Safety | [NONE/LOW/MEDIUM/HIGH] | [Notes] |
| Documentation | [NONE/LOW/MEDIUM/HIGH] | [Notes] |

---

## 9. Escalation Rules

The agent MUST escalate to the Human Developer when:
1. [Condition 1]
2. [Condition 2]
