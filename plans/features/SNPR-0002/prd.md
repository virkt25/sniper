# SNPR-0002: Flexible Phase Navigation

> **Status:** Draft
> **Phase:** A — Foundation
> **Dependencies:** SNPR-0001 (artifact versioning enables safe re-entry)

## Problem Statement

SNIPER's lifecycle is a strict linear state machine: `null → discover → plan → solve → sprint`. Re-running an earlier phase triggers warnings that treat it as regression ("are you sure?", "this will reset progress"). The config tracks a single `current_phase` value that can only move forward.

This means:

1. A team that ships sprint 1 and wants to plan a new feature area cannot re-enter the plan phase without alarming warnings.
2. The config has no concept of "context" — re-running discover after sprint looks identical to running discover for the first time.
3. There is no way to run phases in parallel (e.g., a feature lifecycle alongside the main lifecycle).
4. The `phase_history` array records when phases ran but doesn't distinguish between initial runs and re-runs.

## Solution Overview

Replace the single `current_phase` with a `phase_log` and remove the linear progression assumption from all pre-flight checks.

## Detailed Requirements

### 1. Config Schema: Replace `current_phase` with `phase_log`

**Current:**
```yaml
state:
  current_phase: sprint      # single value, linear progression
  phase_history:             # append-only log
    - phase: discover
      started_at: "2026-01-10T..."
      completed_at: "2026-01-10T..."
      approved_by: "auto-flexible"
    - phase: plan
      started_at: "2026-01-11T..."
      completed_at: "2026-01-12T..."
      approved_by: "human"
```

**New:**
```yaml
state:
  phase_log:                 # replaces both current_phase and phase_history
    - phase: discover
      context: "initial"     # NEW — what triggered this phase
      started_at: "2026-01-10T..."
      completed_at: "2026-01-10T..."
      approved_by: "auto-flexible"
    - phase: plan
      context: "initial"
      started_at: "2026-01-11T..."
      completed_at: "2026-01-12T..."
      approved_by: "human"
    - phase: sprint
      context: "sprint-1"
      started_at: "2026-01-13T..."
      completed_at: "2026-01-20T..."
      approved_by: "human"
    - phase: plan
      context: "adding-webhooks"   # second time through plan
      started_at: "2026-02-01T..."
      completed_at: null
      approved_by: null
```

**Key changes:**
- `current_phase` is removed. The "current" phase is derived: the last entry in `phase_log` where `completed_at` is null (or the last completed entry if none are in-progress).
- `phase_history` is renamed to `phase_log` for clarity.
- Each entry gains a `context` field — a human-readable label for why this phase is running.
- `current_sprint` is kept as a convenience counter (incremented by `/sniper-sprint`). It could be derived from counting sprint entries in `phase_log`, but keeping it explicit is simpler for the sprint command.
- `ingest` is added to the valid phase vocabulary (for SNPR-0003).
- `feature` is NOT a phase_log entry — feature lifecycles are tracked in `state.features[]` (SNPR-0004).

See `plans/features/phase-a-config-schema.md` for the unified final schema and migration protocol.

### 2. Smart Pre-Flight Checks

Replace the current warning-based checks with context-aware guidance.

**Current behavior (all commands):**
```
If current_phase != expected_previous_phase:
  → "The project is in '{current_phase}' phase. Running {this} will reset progress. Are you sure?"
```

**New behavior:**

```
Determine active_context = last phase_log entry with completed_at: null

If active_context exists AND active_context.phase != this_command.phase:
  → Present the situation clearly:
    "You have an active {active_context.phase} ({active_context.context}) that hasn't completed.
     Options:
     (a) Pause {active_context.phase} and start {this_command.phase}
     (b) Complete {active_context.phase} first
     (c) Run {this_command.phase} as a parallel context"
  → Wait for user choice

If active_context exists AND active_context.phase == this_command.phase:
  → "A {this_command.phase} phase is already in progress ({active_context.context}).
     Options:
     (a) Resume it
     (b) Start a new {this_command.phase} with a different context"

If no active_context (all phases complete):
  → Proceed normally. No warnings. Re-running any phase is expected.
```

**Commands affected:** All phase commands — `sniper-discover`, `sniper-plan`, `sniper-solve`, `sniper-sprint`, `sniper-ingest` (SNPR-0003).

**Phase vocabulary for pre-flight checks:** `discover | plan | solve | sprint | ingest`. The `feature` lifecycle is tracked separately in `state.features[]` and does not interact with these pre-flight checks.

### 3. Context Parameter

All phase commands accept an optional context parameter:

```
/sniper-discover                        # context defaults to "initial" or auto-increments
/sniper-discover --context "post-pivot" # explicit context label
/sniper-plan --context "webhook-feature"
/sniper-sprint                          # context auto-set to "sprint-{N}"
```

The context is:
- Stored in the `phase_log` entry
- Displayed in `/sniper-status` output
- Used to differentiate between runs of the same phase
- Purely informational — does not affect behavior

If no context is provided:
- First run of a phase: defaults to `"initial"`
- Subsequent runs: defaults to `"iteration-{N}"` where N is the count of previous runs of that phase

### 4. Phase Log Helper Functions

Commands need to query the phase log. Define these operations in the command logic:

- **`get_current_phase()`** — returns the last `phase_log` entry with `completed_at: null`, or null if nothing is in-progress.
- **`get_last_completed(phase)`** — returns the most recent completed entry for a given phase type (e.g., last completed "plan").
- **`count_phase_runs(phase)`** — returns how many times a phase has been run (useful for auto-context naming).
- **`has_ever_run(phase)`** — returns true if the phase appears anywhere in the log.

### 5. `/sniper-status` Changes

Status output should show the phase log clearly:

```
SNIPER Status — my-saas-app
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase History:
  1. discover    (initial)            completed 2026-01-10   [auto-flexible]
  2. plan        (initial)            completed 2026-01-12   [human]
  3. solve       (initial)            completed 2026-01-12   [auto-flexible]
  4. sprint      (sprint-1)           completed 2026-01-20   [human]
  5. sprint      (sprint-2)           completed 2026-02-05   [human]
  6. plan        (adding-webhooks)    IN PROGRESS...

Active: plan (adding-webhooks)
```

### 6. Backward Compatibility

Migration from v1 config format is handled by the shared Config Reader Protocol defined in `plans/features/phase-a-config-schema.md`. All Phase A changes (SNPR-0001 artifact objects, SNPR-0002 phase_log, SNPR-0003 conventions, SNPR-0004 features) are applied in a single atomic migration gated by `schema_version`.

## Acceptance Criteria

1. **Given** a project that completed sprint-2, **When** the developer runs `/sniper-plan`, **Then** no warning about "resetting progress" appears. A new `phase_log` entry is created with the user-provided or auto-generated context.

2. **Given** an active plan phase (not completed), **When** the developer runs `/sniper-sprint`, **Then** they are presented with options: pause plan, complete plan first, or run sprint in parallel.

3. **Given** `/sniper-plan --context "webhook-feature"`, **When** the phase starts, **Then** the phase_log entry has `context: "webhook-feature"`.

4. **Given** a v1 config with `current_phase` and `phase_history`, **When** any command reads the config, **Then** it auto-migrates to the new `phase_log` format.

5. **Given** `/sniper-status`, **When** the phase_log has multiple entries for the same phase, **Then** all entries are shown with their contexts and timestamps.

## Implementation Scope

### In Scope
- Config schema change: `current_phase` + `phase_history` → `phase_log` with `context`
- Updated pre-flight checks in all 4 phase commands
- Context parameter support in all phase commands
- `/sniper-status` phase log rendering
- Auto-migration from v1 config format

### Out of Scope
- Parallel phase execution (option c in pre-flight) — design now, implement with SNPR-0004
- Phase dependency enforcement (e.g., "plan requires discover") — keep as soft warnings, not hard blocks
- Undo/rollback of phases

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/config.template.yaml` | Replace `current_phase` + `phase_history` with `phase_log` |
| `packages/core/framework/commands/sniper-discover.md` | Update pre-flight checks, add context parameter, use phase_log |
| `packages/core/framework/commands/sniper-plan.md` | Update pre-flight checks, add context parameter, use phase_log |
| `packages/core/framework/commands/sniper-solve.md` | Update pre-flight checks, add context parameter, use phase_log |
| `packages/core/framework/commands/sniper-sprint.md` | Update pre-flight checks, add context parameter, use phase_log |
| `packages/core/framework/commands/sniper-status.md` | Update to render phase_log with contexts |
| `packages/core/framework/commands/sniper-review.md` | Update to read current phase from phase_log |
