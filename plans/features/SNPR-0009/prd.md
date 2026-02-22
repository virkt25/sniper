# SNPR-0009: Audit: Security (`/sniper-audit --target security`)

> **Status:** Draft
> **Phase:** C — Quality & Depth
> **Dependencies:** SNPR-0006 (shares the `/sniper-audit` umbrella command)
> **Soft Dependencies:** SNPR-0003 (architecture doc provides attack surface context), SNPR-0007 (security reviewer persona is reused as a layer)

## Problem Statement

Security reviews are typically reactive — triggered by a breach scare, a compliance audit, or a customer requirement. In practice:

1. **No systematic threat modeling** — developers fix vulnerabilities they know about but never map the full attack surface. The architecture has authentication, authorization, data handling, and external integrations, but nobody has documented which components handle sensitive data or where trust boundaries exist.
2. **Point-in-time scanning only** — tools like `npm audit` or `snyk` catch known CVEs in dependencies, but miss application-level vulnerabilities: broken access control, insecure direct object references, mass assignment, SSRF, etc.
3. **No remediation tracking** — findings from security reviews live in PDFs or spreadsheets. There's no connection between "we found an SQL injection in the user search endpoint" and "here's the story to fix it."
4. **Security knowledge is siloed** — the developer who fixes a vulnerability doesn't document the pattern for the team. The same class of vulnerability recurs in new code.

SNIPER can bring structured, multi-perspective security analysis with a direct path from findings to fix stories.

## Solution Overview

`/sniper-audit --target security` spawns a security audit team that performs a structured security review:

```
/sniper-audit --target security                              # full security audit
/sniper-audit --target security --scope "src/api/ src/auth/"  # scope to sensitive areas
/sniper-audit --target security --focus threats               # threat modeling only
/sniper-audit --target security --focus vulns                 # vulnerability scanning only
/sniper-audit --target security --resume SEC-002              # resume an audit
/sniper-audit --target security --list                        # list security audits
```

The team produces artifacts under `docs/audits/SEC-{NNN}/`:
- `threat-model.md` — threat model with attack surface mapping
- `vulnerability-report.md` — vulnerability findings with severity and remediation
- `stories/` — remediation stories

**`--dry-run`:** Runs threat modeling and vulnerability scanning only. Produces both analysis reports but does not generate remediation stories or proceed to sprint.

## Detailed Requirements

### 1. Integration with `/sniper-audit` Umbrella

Add a `security` section to `sniper-audit.md` (Section D). Update the target dispatch table to mark `security` as `Available`.

### 2. Security Audit Numbering

Security audits use `SEC-{NNN}` format:

```yaml
state:
  security_audit_counter: 1
  security_audits:
    - id: "SEC-001"
      title: "Full security audit"
      status: analyzing         # analyzing | planning | in-progress | complete
      created_at: "2026-02-22T..."
      completed_at: null
      scope_dirs: []
      focus: null               # null (full) | threats | vulns
      findings_critical: 0
      findings_high: 0
      findings_medium: 0
      findings_low: 0
      stories_total: 0
      stories_complete: 0
```

### 3. Security Audit Directory Structure

```
docs/audits/SEC-001/
├── threat-model.md           # Threat model (analyzing phase)
├── vulnerability-report.md   # Vulnerability findings (analyzing phase)
└── stories/
    ├── S01-fix-sql-injection-search.md
    ├── S02-add-rate-limiting.md
    └── S03-fix-idor-user-profile.md
```

### 4. Team Composition

**Phase 1: Analysis (2-Agent Team, Parallel)**

| Teammate | Persona Layers | Output | Purpose |
|----------|---------------|--------|---------|
| `threat-modeler` | process: threat-modeler, technical: security, cognitive: systems-thinker | `threat-model.md` | Map attack surface, identify trust boundaries, model threats |
| `vuln-scanner` | process: vuln-scanner, technical: security, cognitive: devils-advocate | `vulnerability-report.md` | Find application-level vulnerabilities via code analysis |

**Phase 2: Planning (Single Agent — Lead)**

The lead reads both reports, prioritizes findings, and generates remediation stories.

**Phase 3: Execution (Parallel Team — reuses sprint infrastructure)**

Remediation stories are executed via the standard sprint mechanism.

**`--focus` flag:** When `--focus threats` is passed, only the threat-modeler runs. When `--focus vulns`, only the vuln-scanner runs.

### 5. Threat Modeler

**Agent reads:**
- `docs/architecture.md` (if exists) — component structure and data flows
- `docs/conventions.md` (if exists) — authentication/authorization patterns
- Source code for auth, API, and data handling layers
- `package.json` / dependency manifests — for dependency inventory

**Agent produces: `docs/audits/SEC-{NNN}/threat-model.md`**

Content:
- **Attack Surface Map** — all entry points (API endpoints, webhooks, file uploads, admin panels, WebSocket connections) with their authentication requirements
- **Trust Boundaries** — where authenticated/unauthenticated, internal/external, user/admin boundaries exist in the architecture
- **Data Classification** — what sensitive data exists (PII, credentials, tokens, financial data), where it's stored, how it flows through the system
- **Threat Inventory** — threats modeled using STRIDE categories:
  - **S**poofing — can an attacker impersonate a user/service?
  - **T**ampering — can request/response data be modified?
  - **R**epudiation — can actions be performed without accountability?
  - **I**nformation Disclosure — can sensitive data leak?
  - **D**enial of Service — can the service be overwhelmed?
  - **E**levation of Privilege — can a user gain unauthorized access?
- **Dependency Risk** — high-risk dependencies (known CVEs, unmaintained packages, excessive permissions)
- **Priority Threats** — top 5 threats ranked by likelihood x impact

### 6. Vulnerability Scanner

**Agent reads:**
- Source code in the scoped directories (or full codebase)
- `docs/architecture.md` (if exists)
- Configuration files (environment variable usage, secrets management)
- API route definitions and middleware chains

**Agent produces: `docs/audits/SEC-{NNN}/vulnerability-report.md`**

Content:
- **Findings Summary** — count by severity (critical/high/medium/low)
- **Vulnerability Inventory** — each finding with:
  - **ID:** `VULN-{NNN}` (sequential within this audit)
  - **Severity:** critical / high / medium / low
  - **Category:** OWASP Top 10 category (e.g., A01:2021 Broken Access Control)
  - **Location:** file:line (or file:function)
  - **Description:** what the vulnerability is
  - **Evidence:** the specific code pattern that creates the vulnerability
  - **Impact:** what an attacker could achieve by exploiting this
  - **Remediation:** how to fix it, with code example where possible
- **Patterns of Concern** — systemic issues (e.g., "no input validation middleware", "SQL queries built with string concatenation in 8 locations")
- **Positive Findings** — security practices that are done well (gives confidence and should be maintained)

**Scanning approach:** This is static code analysis, not runtime scanning. The agent:
1. Searches for common vulnerability patterns (SQL concatenation, unsanitized user input in templates, missing auth checks on routes, hardcoded secrets, insecure crypto usage, CORS misconfigurations)
2. Traces data flow from user input to database/response to find injection points
3. Checks authentication/authorization middleware coverage on all routes
4. Reviews error handling for information leakage (stack traces, internal paths, database errors exposed to clients)
5. Checks dependency manifests for known vulnerable versions

### 7. Story Generation

After the analysis reports are approved, the lead generates remediation stories:

1. Read both reports (threat-model.md and/or vulnerability-report.md)
2. Generate 3-15 stories under `docs/audits/SEC-{NNN}/stories/`
3. Stories are prioritized by severity: critical findings first, then high, etc.
4. Each story handles one remediation (e.g., "Fix SQL injection in user search", "Add rate limiting to auth endpoints")
5. Stories that address systemic patterns (e.g., "Add input validation middleware") are placed before individual fixes they would prevent
6. Name stories: `S01-{slug}.md`, `S02-{slug}.md`, etc.

### 8. Sprint Integration

Remediation stories reuse the standard sprint infrastructure:

1. **Story source:** Read stories from `docs/audits/SEC-{NNN}/stories/`
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.security_audits[].stories_complete`.
3. **Team naming:** Team is named `sniper-security-sprint-SEC-{NNN}`.
4. **Context:** Include threat-model.md and vulnerability-report.md in spawn prompts.
5. **On completion:** Update security audit status to `complete`.

### 9. Orchestration Flow

```
Step 1: Assign security audit ID (SEC-{NNN})
Step 2: Create audit directory
Step 3: Spawn analysis team (1-2 agents → threat-model.md, vulnerability-report.md)
Step 4: Present findings → "Review security analysis. Generate remediation stories? (yes/edit/cancel)"
Step 5: Generate stories (lead → stories/)
Step 6: Present stories → "Review stories. Start remediation sprint? (yes/edit/cancel)"
Step 7: Run sprint (standard sprint infrastructure)
Step 8: Update audit status to complete
```

### 10. New Persona Files

**`personas/process/threat-modeler.md`**
Role: Threat modeling specialist. Map the full attack surface of an application by identifying entry points, trust boundaries, and data flows. Apply STRIDE methodology to systematically identify threats. Think like an attacker planning a campaign — what would you target first, and how would you get there?

**`personas/process/vuln-scanner.md`**
Role: Application security analyst. Find vulnerabilities through systematic code review, tracing data from user input to storage and output. Focus on OWASP Top 10 categories but also look for logic bugs, race conditions, and business logic flaws. Think like a security researcher submitting bug bounties — find the non-obvious vulnerabilities that automated tools miss.

### 11. New Templates

**`templates/threat-model.md`** — Threat model with attack surface map, trust boundaries, data classification, STRIDE threat inventory, dependency risk, and priority threats.

**`templates/vulnerability-report.md`** — Vulnerability report with findings summary, detailed inventory (ID, severity, OWASP category, location, evidence, impact, remediation), patterns of concern, and positive findings.

### 12. `/sniper-status` Integration

Status should show security audits:

```
Security Audits:
  SEC-001  Full security audit       in-progress (3/8 stories done)
  SEC-002  API security review       analyzing

Completed Security Audits:
  SEC-003  Auth module audit         completed 2026-02-18 (5 stories, 2 critical fixed)
```

### 13. New Checklist

**`checklists/security-review.md`** — Verify:
- Threat model covers all entry points from the architecture doc
- Trust boundaries are clearly identified
- All critical/high vulnerabilities have remediation stories
- Remediation code examples follow secure coding practices
- Systemic fixes (middleware, validation layers) are prioritized before individual fixes
- Positive findings section acknowledges existing security practices

## Acceptance Criteria

1. **Given** `/sniper-audit --target security`, **When** the command runs, **Then** it spawns threat-modeler and vuln-scanner agents that produce analysis reports.

2. **Given** an API with 15 endpoints, **When** the threat-modeler runs, **Then** the attack surface map lists all 15 endpoints with their authentication requirements.

3. **Given** code with SQL string concatenation, **When** the vuln-scanner runs, **Then** it flags the injection vulnerability with file:line, evidence, and remediation.

4. **Given** `--focus threats`, **When** the audit runs, **Then** only the threat-modeler runs (no vuln-scanner).

5. **Given** approved security reports with 3 critical findings, **When** stories are generated, **Then** the critical remediation stories appear first.

6. **Given** `/sniper-audit --target security --list`, **When** security audits exist, **Then** all audits are listed with status, finding counts, and progress.

## Implementation Scope

### In Scope
- `/sniper-audit --target security` command logic (Section D in sniper-audit.md)
- Security audit numbering (SEC-{NNN}) and directory creation
- 2 new persona files (threat-modeler, vuln-scanner)
- 2 new templates (threat-model, vulnerability-report)
- Security review checklist
- Security team YAML
- Story generation for remediation
- Sprint execution for remediation
- Config state tracking for security audits
- `--focus`, `--list`, `--resume`, `--scope` flags

### Out of Scope
- Runtime security scanning (DAST, penetration testing)
- Compliance framework mapping (SOC 2, HIPAA, PCI-DSS checklists)
- Secrets scanning (detecting leaked API keys in git history)
- Container/infrastructure security analysis
- Automated dependency upgrades

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-audit.md` | UPDATE — add `security` target section (Section D) |
| `packages/core/framework/teams/security.yaml` | NEW — security audit team composition |
| `packages/core/framework/personas/process/threat-modeler.md` | NEW — persona |
| `packages/core/framework/personas/process/vuln-scanner.md` | NEW — persona |
| `packages/core/framework/templates/threat-model.md` | NEW — template |
| `packages/core/framework/templates/vulnerability-report.md` | NEW — template |
| `packages/core/framework/checklists/security-review.md` | NEW — checklist |
| `packages/core/framework/commands/sniper-status.md` | Update to show security audits |
| `packages/core/framework/config.template.yaml` | Add `security_audit_counter` and `security_audits` array |
