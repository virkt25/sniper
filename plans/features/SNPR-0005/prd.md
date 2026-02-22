# SNPR-0005: Production Debugging (`/sniper-debug`)

> **Status:** Draft
> **Phase:** B — Production Lifecycle
> **Dependencies:** SNPR-0001 (versioned artifacts), SNPR-0002 (phase_log for tracking)
> **Soft Dependencies:** SNPR-0003 (architecture doc from ingest provides better context)

## Problem Statement

When a production bug occurs, developers typically:

1. Manually read through logs, error messages, and stack traces
2. Try to reproduce the issue locally
3. Dig through code to find the root cause
4. Write a fix without structured investigation artifacts
5. Ship the fix without a post-mortem or regression prevention strategy

This is ad-hoc and error-prone. For complex bugs that span multiple services or involve race conditions, a single developer often misses the full picture. There's no structured handoff — if the developer gets stuck, the next person starts from scratch.

SNIPER can bring the same team-based approach to debugging: parallel investigation, structured artifacts, and reproducible investigation logs.

## Solution Overview

A new `/sniper-debug` command spawns a debugging team that investigates a production issue through structured phases:

```
/sniper-debug "Checkout flow returns 500 errors for users with multiple payment methods"
/sniper-debug --from-issue GH-1234        # pull context from a GitHub issue
/sniper-debug --resume BUG-003            # resume an in-progress investigation
```

The team produces structured artifacts under `docs/bugs/BUG-{NNN}/`:
- `report.md` — structured bug report
- `investigation.md` — investigation log with findings
- `postmortem.md` — root cause analysis and prevention strategy

## Detailed Requirements

### 1. New Command: `/sniper-debug`

**Usage:**
```
/sniper-debug "Description of the bug"
/sniper-debug --from-issue GH-1234          # pull bug description from GitHub issue
/sniper-debug --severity critical            # set severity (critical/high/medium/low)
/sniper-debug --list                         # list active and resolved bugs
/sniper-debug --resume BUG-003              # resume investigation
```

### 2. Bug Numbering

Bugs are tracked separately from features using `BUG-{NNN}` format:

```yaml
state:
  bug_counter: 1
  bugs:
    - id: "BUG-001"
      title: "Checkout 500 errors with multiple payment methods"
      severity: high
      status: investigating    # triaging | investigating | fix-in-progress | complete
      created_at: "2026-02-22T..."
      resolved_at: null
      root_cause: null         # filled after investigation
      fix_stories: []          # SNPR IDs of fix stories, if any
```

### 3. Bug Directory Structure

```
docs/bugs/BUG-001/
├── report.md              # Structured bug report (triage phase)
├── investigation.md       # Investigation log (investigation phase)
└── postmortem.md          # Root cause analysis + prevention (resolution phase)
```

### 4. Debug Team Composition

Three-phase team execution (not all agents run simultaneously):

**Phase 1: Triage (Single Agent — no team spawned)**

The lead runs triage directly, producing `report.md`. This is lightweight (2-3 minutes).

**Phase 2: Investigation (2-Agent Team, Parallel)**

| Teammate | Compose | Output |
|----------|---------|--------|
| `log-analyst` | process: log-analyst, technical: null, cognitive: devils-advocate | `investigation.md` (log findings section) |
| `code-investigator` | process: code-investigator, technical: backend, cognitive: systems-thinker | `investigation.md` (code findings section) |

**Phase 3: Resolution (Single Agent — no team spawned)**

The lead runs fix generation directly, reading the investigation findings, writing the code fix, and producing `postmortem.md`.

**Note on Phase 1 & 3 as single-agent:** Triage and fix phases run as the lead agent directly (no team spawn). This matches the lightweight pattern from `/sniper-feature` scoping. Only Phase 2 (investigation) spawns a team for parallel work.

**`--from-issue` flag:** Uses `gh issue view {number} --json title,body` to fetch the issue content. Requires the `gh` CLI to be installed and authenticated. If `gh` is not available, falls back to asking the user to paste the issue content.

**Cancel behavior:** If the user cancels at any checkpoint, the bug remains in its current status (triaging, investigating, or fix-in-progress). The user can resume later with `--resume`.

**Resume behavior:** `--resume BUG-{NNN}` reads the bug's current status and restarts from the beginning of that phase (not mid-phase, since agent state is ephemeral). For example, if status is `investigating`, the investigation team is re-spawned with the existing report.md as context.

**phase_log entries:** Debug sessions do NOT write to `state.phase_log` (which is for the main lifecycle). Debugging is tracked entirely in `state.bugs[]`.

### 5. Triage Lead — Bug Report

The triage lead reads the bug description and codebase context, then produces a structured bug report.

**Agent reads:**
- The bug description (from user or GitHub issue)
- `docs/architecture.md` (if exists) — to identify affected components
- Relevant source code (keyword search from bug description)
- Error logs if provided by the user

**Agent produces: `docs/bugs/BUG-{NNN}/report.md`**

Content:
- **Bug Summary** — one-paragraph description
- **Severity Assessment** — critical/high/medium/low with justification
- **Affected Components** — which architecture components are involved
- **Reproduction Steps** — inferred from bug description (may note "unable to determine")
- **Error Context** — error messages, stack traces, affected endpoints
- **Hypothesis** — initial theory about what might be wrong
- **Investigation Plan** — what the investigation team should look at

### 6. Investigation Team

Two agents investigate in parallel after the triage report is complete.

**Log Analyst:**
- Reviews error patterns, frequency, timing
- Searches codebase for error handling in affected areas
- Documents log findings in investigation.md
- Notes correlations (e.g., "errors spike after deployments" or "only affects users with X")

**Code Investigator:**
- Traces the code path from the affected endpoint/component
- Identifies the specific code that produces the error
- Checks recent changes to the affected files (git log)
- Documents code findings and root cause hypothesis in investigation.md

Both contribute to a single `investigation.md` file (different managed sections).

### 7. Fix Engineer

After investigation completes, a fix engineer:
- Reads the investigation findings
- Writes the actual code fix
- Writes regression tests
- Produces a post-mortem document

**Post-mortem content:**
- **Root Cause** — what specifically was wrong
- **Fix Summary** — what was changed and why
- **Impact Assessment** — who was affected, for how long
- **Prevention** — what should change to prevent similar bugs
- **Regression Tests** — what tests were added

### 8. Orchestration Flow

```
Step 1: Assign bug ID (BUG-{NNN})
Step 2: Create bug directory
Step 3: Run triage (single agent → report.md)
Step 4: Present report → "Review the bug report. Start investigation? (yes/edit/cancel)"
Step 5: Spawn investigation team (2 agents → investigation.md)
Step 6: Present findings → "Review findings. Proceed to fix? (yes/edit/cancel)"
Step 7: Spawn fix engineer (1 agent → code fix + postmortem.md)
Step 8: Present fix + postmortem → "Review fix. Apply? (yes/edit/cancel)"
Step 9: Update bug status to resolved
```

### 9. New Persona Files

**`personas/process/triage-lead.md`**
Role: Bug triage specialist. Rapidly assess severity, identify affected components, and create investigation plans. Think like a senior SRE responding to an incident.

**`personas/process/log-analyst.md`**
Role: Log and observability specialist. Analyze error patterns, timing correlations, and log data. Think like a data analyst looking for signal in noise.

**`personas/process/code-investigator.md`**
Role: Code path tracer. Follow execution paths, identify failure points, and trace bugs to root cause. Think like a debugger stepping through code mentally.

### 10. New Templates

**`templates/bug-report.md`** — Structured bug report with severity, affected components, reproduction, hypothesis, investigation plan.

**`templates/investigation.md`** — Investigation log with log findings section, code findings section, root cause section, and evidence links.

**`templates/postmortem.md`** — Post-mortem with root cause, fix summary, impact assessment, prevention strategy, and regression tests.

### 11. `/sniper-status` Integration

Status should show active bugs:

```
Active Bugs:
  BUG-001  Checkout 500 errors      investigating (high)
  BUG-002  Slow dashboard load      triaging (medium)

Resolved Bugs:
  BUG-003  Login timeout            resolved 2026-02-20 (low)
```

## Acceptance Criteria

1. **Given** `/sniper-debug "Checkout 500 errors"`, **When** the command starts, **Then** it assigns a bug ID, creates the bug directory, and runs triage.

2. **Given** a completed triage report, **When** the user approves investigation, **Then** two agents investigate in parallel and produce `investigation.md`.

3. **Given** investigation findings, **When** the user approves fixing, **Then** the fix engineer writes code and produces `postmortem.md`.

4. **Given** `/sniper-debug --list`, **When** bugs exist, **Then** all bugs are listed with status and severity.

5. **Given** a resolved bug, **When** `/sniper-status` runs, **Then** the bug appears in the resolved section with root cause summary.

## Implementation Scope

### In Scope
- `/sniper-debug` command definition (3-phase orchestration)
- Bug numbering and directory creation
- 3 new persona files (triage-lead, log-analyst, code-investigator)
- 3 new templates (bug-report, investigation, postmortem)
- Debug team YAML
- Debug review checklist
- `--from-issue`, `--severity`, `--list`, `--resume` flags
- Config state tracking for bugs

### Out of Scope
- Integration with external monitoring tools (Sentry, Datadog, PagerDuty)
- Automated log fetching from production environments
- Live debugging or attaching to running processes
- Automated incident response or alerting

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-debug.md` | NEW — command definition |
| `packages/core/framework/teams/debug.yaml` | NEW — team composition |
| `packages/core/framework/personas/process/triage-lead.md` | NEW — persona |
| `packages/core/framework/personas/process/log-analyst.md` | NEW — persona |
| `packages/core/framework/personas/process/code-investigator.md` | NEW — persona |
| `packages/core/framework/templates/bug-report.md` | NEW — template |
| `packages/core/framework/templates/investigation.md` | NEW — template |
| `packages/core/framework/templates/postmortem.md` | NEW — template |
| `packages/core/framework/checklists/debug-review.md` | NEW — checklist |
| `packages/core/framework/commands/sniper-status.md` | Update to show bugs |
| `packages/core/framework/config.template.yaml` | Add `bug_counter` and `bugs` array |
