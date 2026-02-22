# /sniper-debug -- Production Debugging (Phased Investigation)

You are executing the `/sniper-debug` command. Your job is to orchestrate a structured bug investigation through three phases: triage, investigation, and resolution. You run triage and resolution directly; you spawn a team for investigation. Follow every step below precisely.

**Arguments:** $ARGUMENTS

---

## Step 0: Pre-Flight Checks

### 0a. Verify SNIPER Is Initialized

1. Read `.sniper/config.yaml`.
2. If the file does not exist or `project.name` is empty:
   - **STOP.** Print: "SNIPER is not initialized. Run `/sniper-init` first."

### 0b. Config Migration Check

1. Read `schema_version` from `.sniper/config.yaml`.
2. If `schema_version` is absent or less than 2, run the v1→v2 migration. Write the updated config before proceeding.

### 0c. Parse Arguments

1. **Bug description** (positional): What's wrong (e.g., "Checkout returns 500 for users with multiple payment methods").
2. **`--from-issue GH-{NNN}`:** Fetch bug description from a GitHub issue using `gh issue view {number} --json title,body`. If `gh` CLI is not available, ask the user to paste the issue content.
3. **`--severity {level}`:** Override the automatic severity assessment (critical/high/medium/low).
4. **`--list`:** List all bugs with status and severity. Print and STOP.
5. **`--resume BUG-{NNN}`:** Resume an in-progress investigation.

### 0d. Handle `--list`

If `--list` was passed:

```
============================================
  SNIPER Bugs
============================================

  Active Bugs:
    BUG-{NNN}  {title}        {status} ({severity})
    ...

  Resolved Bugs:
    BUG-{NNN}  {title}        complete {date} ({severity})
    ...

  Total: {active} active, {resolved} resolved

============================================
```

Then STOP.

### 0e. Handle `--resume`

If `--resume BUG-{NNN}` was passed:

1. Find the bug in `state.bugs[]` by ID.
2. If not found, STOP: "Bug BUG-{NNN} not found."
3. Jump to the corresponding phase:
   - `triaging` → Step 1 (re-run triage with existing context)
   - `investigating` → Step 3 (spawn investigation team)
   - `fix-in-progress` → Step 5 (run fix with investigation context)

### 0f. Verify Bug Description

If no `--list` or `--resume` flag, a bug description is required. If not provided, ask the user to describe the bug.

---

## Step 1: Assign Bug ID and Triage

### 1a. Assign Bug ID

1. Read `state.bug_counter` from config (default: 1).
2. Assign: `BUG-{NNN}` where NNN is zero-padded.
3. Increment `bug_counter` and write back to config.

### 1b. Record Bug in State

Add to `state.bugs[]`:

```yaml
- id: "BUG-{NNN}"
  title: "{bug description, truncated to 80 chars}"
  severity: null              # set after triage
  status: triaging
  created_at: "{current ISO timestamp}"
  resolved_at: null
  root_cause: null
  fix_stories: []
```

### 1c. Create Bug Directory

```
docs/bugs/BUG-{NNN}/
```

### 1d. Run Triage (You Do This Directly)

Read the following context:
1. `docs/architecture.md` (if exists) — identify affected components
2. `docs/conventions.md` (if exists) — understand code patterns
3. Source code — search for keywords from the bug description
4. GitHub issue content (if `--from-issue` was used)

Read the template at `.sniper/templates/bug-report.md`.

Produce `docs/bugs/BUG-{NNN}/report.md` following the template:
- **Bug Summary** — clear description of the observed behavior
- **Severity Assessment** — critical/high/medium/low with justification (use `--severity` override if provided)
- **Affected Components** — mapped to architecture doc entries
- **Reproduction Steps** — inferred from description (note unknowns)
- **Error Context** — error messages, status codes, affected endpoints
- **Hypothesis** — initial theory
- **Investigation Plan** — specific guidance for each investigator

Update the bug's severity in `state.bugs[]`.

### 1e. Present Triage to User

```
============================================
  Bug Triage: BUG-{NNN}
============================================

  Severity: {level}
  Affected: {component list}
  Hypothesis: {one-line theory}

  Full report: docs/bugs/BUG-{NNN}/report.md

  Options:
    yes    — Start investigation (2-agent team)
    edit   — Edit the report, then say "continue"
    cancel — Pause (resume later with --resume)

============================================
```

Wait for user response.
- **yes** → proceed to Step 2
- **edit** → wait for "continue", then proceed
- **cancel** → STOP. Bug stays in `triaging` status.

---

## Step 2: Transition to Investigation

Update `state.bugs[]` for this bug: `status: investigating`

---

## Step 3: Investigation (2-Agent Team)

### 3a. Read Team Definition

Read `.sniper/teams/debug.yaml`. Replace `{bug_id}` and `{bug_title}` with actual values.

### 3b. Compose Spawn Prompts

**log-analyst:**
1. Read persona layers: `process/log-analyst.md`, `cognitive/devils-advocate.md`
2. Include: bug report content, architecture doc (if exists), investigation plan
3. Task: produce log findings section of `docs/bugs/BUG-{NNN}/investigation.md`
4. Instructions: search for error patterns in affected components, document correlations and evidence

**code-investigator:**
1. Read persona layers: `process/code-investigator.md`, `technical/backend.md`, `cognitive/systems-thinker.md`
2. Include: bug report content, architecture doc (if exists), investigation plan
3. Task: produce code findings section of `docs/bugs/BUG-{NNN}/investigation.md`
4. Instructions: trace execution path, identify root cause, check git history

### 3c. Create Team, Tasks, and Spawn

```
TeamCreate:
  team_name: "sniper-debug-{bug_id}"
  description: "Bug investigation for BUG-{NNN}: {title}"
```

Create two tasks (parallel, no dependencies):
1. "Analyze Error Patterns" — assigned to log-analyst
2. "Trace Code Path to Root Cause" — assigned to code-investigator

Spawn both agents. Enter delegate mode.

### 3d. Delegate

Monitor progress. When both complete:
1. Read both agents' findings
2. Combine into a single `docs/bugs/BUG-{NNN}/investigation.md` following the template
3. Write the root cause section based on the combined findings
4. Shut down the investigation team

### 3e. Present Investigation Findings

```
============================================
  Investigation Complete: BUG-{NNN}
============================================

  Root Cause: {one-paragraph summary}

  Full investigation: docs/bugs/BUG-{NNN}/investigation.md

  Options:
    yes    — Proceed to fix (I will write the fix and postmortem)
    edit   — Edit findings, then say "continue"
    cancel — Pause

============================================
```

Wait for user response.

---

## Step 4: Transition to Fix

Update `state.bugs[]` for this bug: `status: fix-in-progress`

---

## Step 5: Resolution (You Do This Directly)

### 5a. Read Investigation

1. Read `docs/bugs/BUG-{NNN}/investigation.md`
2. Read `docs/bugs/BUG-{NNN}/report.md`
3. Read `docs/conventions.md` (if exists — follow coding patterns)
4. Read the affected source files identified in the investigation

### 5b. Write the Fix

1. Apply the recommended fix from the investigation
2. Follow existing code patterns from `docs/conventions.md`
3. Write minimal, targeted changes — fix the bug, don't refactor surrounding code

### 5c. Write Regression Tests

1. Write tests that specifically verify the bug is fixed
2. Test the exact scenario described in the bug report
3. Test related edge cases identified during investigation

### 5d. Produce Post-Mortem

Read the template at `.sniper/templates/postmortem.md`.

Write `docs/bugs/BUG-{NNN}/postmortem.md`:
- **Root Cause** — definitive explanation
- **Fix Summary** — what was changed, files modified
- **Impact Assessment** — who was affected, for how long
- **Prevention** — process, code, and monitoring changes
- **Regression Tests** — what tests were added
- **Timeline** — key events with timestamps

### 5e. Present Fix and Post-Mortem

```
============================================
  Fix Complete: BUG-{NNN}
============================================

  Root Cause: {summary}
  Fix: {summary of changes}
  Tests: {count} regression tests added

  Files Changed:
    {list of modified/created files}

  Postmortem: docs/bugs/BUG-{NNN}/postmortem.md

  Options:
    yes    — Mark bug as resolved
    edit   — Review and edit, then say "continue"
    cancel — Pause

============================================
```

---

## Step 6: Update State

Update `state.bugs[]` for this bug:
```yaml
status: complete
resolved_at: "{current ISO timestamp}"
root_cause: "{one-line root cause summary}"
```

---

## Step 7: Present Final Results

```
============================================
  Bug Resolved: BUG-{NNN}
============================================

  {title}

  Severity:    {level}
  Root Cause:  {summary}
  Fix:         {summary}
  Duration:    {time from creation to resolution}

  Artifacts:
    Report:        docs/bugs/BUG-{NNN}/report.md
    Investigation: docs/bugs/BUG-{NNN}/investigation.md
    Postmortem:    docs/bugs/BUG-{NNN}/postmortem.md

============================================
  Next Steps
============================================

  1. Review the fix and regression tests
  2. Run /sniper-debug "next bug" to investigate another issue
  3. Run /sniper-status to see overall project state

============================================
```

---

## IMPORTANT RULES

- Phase 1 (triage) and Phase 3 (fix) run as a single agent — YOU do the work directly.
- Phase 2 (investigation) spawns a 2-agent team for parallel investigation.
- You DO write code in this command (the fix and regression tests in Phase 3).
- If `$ARGUMENTS` contains "dry-run", run triage only (Steps 0-1) and present the report without spawning.
- Bug state is tracked in `state.bugs[]`, NOT in `state.phase_log`.
- Cancel at any checkpoint leaves the bug in its current status for later `--resume`.
- Resume restarts from the beginning of the current phase (agent state is ephemeral).
- All file paths are relative to the project root.
