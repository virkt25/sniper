# SNPR-0004: Incremental Feature Lifecycle (`/sniper-feature`)

> **Status:** Draft
> **Phase:** A — Foundation
> **Dependencies:** SNPR-0001 (versioned artifacts for merge-back), SNPR-0002 (flexible navigation for feature context)
> **Soft Dependencies:** SNPR-0003 (ingested artifacts provide better context, but not required — works with any project that has `docs/architecture.md` from normal discover/plan)

## Problem Statement

After a project's initial build, ongoing development happens feature-by-feature. Today, developers have two options:

1. **Full lifecycle re-run** — run discover → plan → solve → sprint again, which overwrites everything and is massive overkill for adding one feature.
2. **Quick-feature workflow** — skip directly to sprint with a manually-written story, which has no planning and no architecture review.

Neither option is right. Features need lightweight planning (not full PRD rewrites), architecture review (to ensure the feature fits the existing system), and proper story generation — but scoped to just the feature, not the entire product.

## Solution Overview

A new `/sniper-feature` command that runs a scoped mini-lifecycle:

```
/sniper-feature "Add webhook support for real-time event delivery"
```

1. **Scoping** — single agent produces a Feature Brief
2. **Planning** — 2-agent team produces a Feature Spec and Architecture Delta
3. **Story Generation** — scoped `/sniper-solve` creates stories for just this feature
4. **Sprint** — `/sniper-sprint` runs with the feature's stories
5. **Merge-back** — architecture delta is merged into the main architecture doc

All artifacts live under `docs/features/SNPR-{XXXX}/` to keep them organized and separate from the main project artifacts.

## Detailed Requirements

### 1. New Command: `/sniper-feature`

**Usage:**
```
/sniper-feature "Add webhook support for real-time event delivery"
/sniper-feature "Add webhook support" --skip-to sprint   # skip to sprint if planning is done
/sniper-feature --list                                    # list active features
/sniper-feature --resume SNPR-0014                        # resume a paused feature
```

### 2. Feature Numbering

Each feature gets the next available `SNPR-{XXXX}` ID from the config:

```yaml
state:
  feature_counter: 14    # next ID to assign
  features:
    - id: "SNPR-0014"
      slug: "webhook-support"
      title: "Add webhook support for real-time event delivery"
      phase: scoping    # scoping | planning | solving | sprint | complete
      created_at: "2026-02-21T..."
      completed_at: null
      stories_total: 0
      stories_complete: 0
```

The counter starts at the next number after the last SNPR ID used in the `plans/features/` directory (for projects bootstrapping from the v2 roadmap, this would be 14).

### 3. Feature Directory Structure

```
docs/features/SNPR-0014/
├── brief.md              # Feature Brief (scoping phase)
├── spec.md               # Feature Spec (planning phase)
├── arch-delta.md          # Architecture Delta (planning phase)
└── stories/
    ├── S01-webhook-endpoint.md
    ├── S02-webhook-retry.md
    └── S03-webhook-dashboard.md
```

### 4. Phase 1: Scoping (Single Agent)

A single scoping agent reads the codebase context and produces a Feature Brief.

**Agent reads:**
- `docs/architecture.md` (or codebase if no architecture doc exists)
- `docs/conventions.md` (if exists)
- The feature description provided by the user
- Relevant source code files (identified by keyword matching against the feature description)

**Agent produces: `docs/features/SNPR-{XXXX}/brief.md`**

**New template: `packages/core/framework/templates/feature-brief.md`**

```markdown
# Feature Brief: {title}

> **Feature ID:** SNPR-{XXXX}
> **Version:** 1
> **Status:** Draft
> **Date:** {date}
> **Author:** Feature Scoping Agent

## Feature Description
<!-- What this feature does, in user-facing terms -->

## Motivation
<!-- Why this feature is needed. What user problem does it solve? -->

## Affected Areas
<!-- Which parts of the existing codebase will this feature touch? -->

### Components Affected
| Component | Impact | Notes |
|-----------|--------|-------|
| | Low / Medium / High | |

### Files Likely Modified
- `path/to/file.ts` — reason

## Scope

### In Scope
-

### Out of Scope
-

## Risks & Open Questions
1.

## Dependencies
<!-- External services, libraries, or other features needed -->
```

**Scoping is lightweight** — no team spawned, single agent, should complete in 2-3 minutes. The user reviews the brief before proceeding to planning.

**State recorded at scoping time:**
- `state.features[].arch_base_version` — the current version of `docs/architecture.md` (used later for merge-back conflict detection, see Section 8).

### 5. Phase 2: Planning (2-Agent Team)

After the user reviews the Feature Brief, a 2-agent mini-planning team runs:

| Teammate | Output | Purpose |
|----------|--------|---------|
| `feature-pm` | `docs/features/SNPR-{XXXX}/spec.md` | Feature requirements spec |
| `feature-architect` | `docs/features/SNPR-{XXXX}/arch-delta.md` | Architecture changes needed |

**Team coordination:** The architect is blocked by the PM's spec. The PM reads the feature brief and produces the spec. The architect reads the spec + existing `docs/architecture.md` and produces the delta.

**New template: `packages/core/framework/templates/feature-spec.md`**

```markdown
# Feature Spec: {title}

> **Feature ID:** SNPR-{XXXX}
> **Version:** 1
> **Status:** Draft
> **Date:** {date}
> **Author:** Feature Planning Team — PM
> **Source:** `docs/features/SNPR-{XXXX}/brief.md`

## Requirements

### Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-001 | | P0 | |

### Non-Functional Requirements
| Category | Requirement | Target |
|----------|------------|--------|
| | | |

## User Stories
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-001 | | | |

## API Changes
<!-- New endpoints, modified endpoints, deprecated endpoints -->

## Data Model Changes
<!-- New tables/collections, modified schemas, migrations needed -->

## UI Changes
<!-- New screens, modified screens, new components -->

## Rollout Strategy
<!-- Feature flag? Gradual rollout? Migration needed? -->
```

**New template: `packages/core/framework/templates/arch-delta.md`**

```markdown
# Architecture Delta: {title}

> **Feature ID:** SNPR-{XXXX}
> **Version:** 1
> **Status:** Draft
> **Date:** {date}
> **Author:** Feature Planning Team — Architect
> **Base Architecture:** `docs/architecture.md` (version {N})

## Summary of Changes
<!-- 2-3 sentence overview of what changes to the architecture -->

## New Components
<!-- Components being added to the system -->

### {Component Name}
- **Responsibility:**
- **Interfaces:**
- **Dependencies:**

## Modified Components
<!-- Existing components that need changes -->

### {Existing Component Name}
- **Current behavior:**
- **New behavior:**
- **Migration notes:**

## New Data Models
<!-- New entities or modified schemas -->

| Field | Type | Constraints | Index | Notes |
|-------|------|------------|-------|-------|
| | | | | |

## New/Modified API Endpoints
```
METHOD /api/v1/{resource}
Request: { }
Response: { }
Status Codes: 200, 400, 401, 404, 500
Auth: Required
```

## Infrastructure Changes
<!-- Any new services, queues, caches, etc. -->

## Patterns to Follow
<!-- Reference existing architecture patterns that should be followed -->
<!-- From docs/conventions.md if available -->

## Risks
<!-- Architecture risks specific to this feature -->
```

### 6. Phase 3: Story Generation (Scoped Solve)

After the user reviews the spec and architecture delta, `/sniper-solve` runs scoped to the feature:

- Reads only `docs/features/SNPR-{XXXX}/spec.md` and `docs/features/SNPR-{XXXX}/arch-delta.md` (not the full PRD)
- Produces stories under `docs/features/SNPR-{XXXX}/stories/`
- Stories are numbered sequentially within the feature (S01, S02, etc.)
- Stories embed context from the feature spec and arch delta, not the main PRD
- Story count is typically 3-8 (features are smaller than full products)

### 7. Phase 4: Sprint (Standard Sprint)

`/sniper-sprint` runs with stories from the feature directory. The command needs to accept a feature scope:

```
/sniper-sprint --feature SNPR-0014
```

**Changes to sprint command behavior when `--feature` is set:**

1. **Story selection (Step 3):** Read stories from `docs/features/SNPR-0014/stories/` instead of `docs/stories/`. The selection UI shows only feature stories.

2. **Architecture context (Step 6):** Include both `docs/architecture.md` AND `docs/features/SNPR-0014/arch-delta.md` in teammate spawn prompts. The delta takes precedence for this feature's scope.

3. **State tracking:** Does NOT increment `state.current_sprint`. Instead, the feature's sprint is tracked in `state.features[].phase: sprint` and `state.features[].stories_complete`. The main sprint counter is reserved for full-lifecycle sprints.

4. **Story completion (Step 13):** Marks stories as complete within the feature directory. Updates `state.features[].stories_complete` count.

5. **Team naming:** Team is named `sniper-feature-sprint-{feature_id}` to avoid collision with main lifecycle sprint teams.

6. **Review gate:** Same strict review gate as normal sprints. On approval, if all feature stories are complete, the feature phase transitions to `complete` and merge-back (Section 8) runs automatically.

### 8. Phase 5: Merge-Back

After the feature is complete (all stories done, sprint approved), the architecture delta is merged into the main architecture doc:

**Conflict detection (addresses concurrent feature work):**

1. Read the `arch_base_version` from `state.features[]` for this feature (recorded when the feature started — the version of `docs/architecture.md` at scoping time).
2. Read the current version of `docs/architecture.md`.
3. If current version > base version, the architecture doc was modified since this feature started (by another feature merge-back or a direct `/sniper-plan` re-run).
   - **Flag for human review:** "The architecture doc has been updated since this feature started (was v{base}, now v{current}). Please review the merge-back manually."
   - Present the arch-delta and the changes that happened to the architecture doc since the feature started.
   - Wait for user approval before merging.
4. If current version == base version, proceed with automatic merge.

**Merge steps:**

1. Read `docs/features/SNPR-{XXXX}/arch-delta.md`
2. Read `docs/architecture.md`
3. For each "New Component" in the delta, add it to the architecture doc's Component Architecture managed section
4. For each "Modified Component", update the relevant managed section in the architecture doc
5. For each "New Data Model", add it to the Data Models managed section
6. For each "New API Endpoint", add it to the API Contracts managed section
7. Increment the architecture doc's version and add a changelog entry: "v{N} ({date}): Merged SNPR-{XXXX} — {feature title}"
8. Mark the feature as `phase: complete` in config
9. Append to `docs/features/log.md`

This uses SNPR-0001's managed sections protocol for non-destructive updates.

### 9. Feature Log

**`docs/features/log.md`** — a running log of all features added:

```markdown
# Feature Log

| ID | Feature | Started | Completed | Stories | Architecture Changes |
|----|---------|---------|-----------|---------|---------------------|
| SNPR-0014 | Webhook support | 2026-02-21 | 2026-02-28 | 5 | Added WebhookService component, webhook_events table |
| SNPR-0015 | Admin dashboard | 2026-03-01 | — | 3/7 | Added AdminController, dashboard_settings table |
```

### 10. New Team YAML

**`packages/core/framework/teams/feature-plan.yaml`**

```yaml
team_name: sniper-feature-plan-{feature_id}
description: "Feature planning for {feature_title}"
model_override: opus

teammates:
  - name: feature-pm
    compose:
      process: product-manager
      technical: api-design
      cognitive: systems-thinker
    tasks:
      - id: feature-spec
        name: "Feature Requirements Spec"
        output: docs/features/{feature_id}/spec.md
        template: .sniper/templates/feature-spec.md
        reads: ["docs/features/{feature_id}/brief.md", "docs/architecture.md"]
        blocked_by: []

  - name: feature-architect
    compose:
      process: architect
      technical: backend
      cognitive: systems-thinker
    tasks:
      - id: arch-delta
        name: "Architecture Delta"
        output: docs/features/{feature_id}/arch-delta.md
        template: .sniper/templates/arch-delta.md
        reads: ["docs/features/{feature_id}/spec.md", "docs/architecture.md", "docs/conventions.md (if exists)"]
        blocked_by: [feature-spec]
        plan_approval: true

coordination:
  - [feature-pm, feature-architect]

review_gate:
  checklist: .sniper/checklists/feature-review.md
  mode: flexible
```

### 11. Orchestration Flow

The `/sniper-feature` command orchestrates all 5 phases in a single session, with user checkpoints between phases:

```
Step 1: Assign feature ID (SNPR-{XXXX})
Step 2: Create feature directory
Step 3: Run scoping (single agent → brief.md)
Step 4: Present brief to user → "Review the feature brief. Continue to planning? (yes/edit/cancel)"
Step 5: If yes, spawn planning team (2 agents → spec.md + arch-delta.md)
Step 6: Present spec + delta to user → "Review the plan. Continue to stories? (yes/edit/cancel)"
Step 7: If yes, run scoped solve (stories in feature dir)
Step 8: Present stories to user → "Review stories. Start sprint? (yes/edit/cancel)"
Step 9: If yes, run /sniper-sprint --feature SNPR-{XXXX}
Step 10: After sprint completes, run merge-back
Step 11: Update feature status to complete
```

At each checkpoint, the user can:
- **yes** — proceed to next phase
- **edit** — make manual edits, then say "continue" when ready
- **cancel** — pause the feature (can resume later with `--resume`)

### 12. `/sniper-status` Integration

Status should show active features:

```
Active Features:
  SNPR-0014  Webhook support        sprint (3/5 stories done)
  SNPR-0015  Admin dashboard        planning
  SNPR-0016  Email notifications    scoping

Completed Features:
  SNPR-0013  User authentication    completed 2026-02-15 (8 stories)
```

## Acceptance Criteria

1. **Given** `/sniper-feature "Add webhook support"`, **When** the command starts, **Then** it assigns the next SNPR ID, creates `docs/features/SNPR-{XXXX}/`, and runs scoping.

2. **Given** a completed feature brief, **When** the user says "yes" to continue, **Then** a 2-agent planning team spawns and produces the spec and arch-delta.

3. **Given** a completed planning phase, **When** stories are generated, **Then** they reference the feature spec and arch-delta (not the main PRD).

4. **Given** `/sniper-sprint --feature SNPR-0014`, **When** the sprint runs, **Then** it uses stories from `docs/features/SNPR-0014/stories/`.

5. **Given** a completed feature sprint, **When** merge-back runs, **Then** the architecture delta is merged into `docs/architecture.md` with a version increment and changelog entry.

6. **Given** `/sniper-feature --list`, **When** features exist, **Then** all features are listed with their current phase and progress.

7. **Given** a feature paused at the planning phase, **When** `/sniper-feature --resume SNPR-0014` is run, **Then** it resumes from the planning phase.

## Implementation Scope

### Note on `/sniper-review`

Feature lifecycles run their own inline review gates as part of the `/sniper-feature` orchestration flow (Section 11). Running `/sniper-review` during a feature lifecycle is not supported — the review command operates on the main project lifecycle. If a user runs `/sniper-review` while a feature is active, the review command should report the main lifecycle state and note "Active feature SNPR-{XXXX} has its own review gates managed by `/sniper-feature`."

### In Scope
- `/sniper-feature` command definition (orchestration of all 5 phases)
- Feature numbering and directory creation
- Feature Brief template + scoping agent behavior
- Feature Spec template + Feature Planning team
- Architecture Delta template + merge-back logic
- Scoped solve (stories in feature directory)
- Scoped sprint (`--feature` flag on `/sniper-sprint`)
- Feature log (`docs/features/log.md`)
- `/sniper-status` feature display
- `--list`, `--resume`, `--skip-to` flags

### Out of Scope
- Parallel features (running two feature sprints simultaneously) — design for later
- Feature branches in git (SNIPER doesn't manage git branching)
- Feature flags in code (left to the developer)
- Cross-feature dependency tracking

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-feature.md` | NEW — command definition |
| `packages/core/framework/teams/feature-plan.yaml` | NEW — planning team |
| `packages/core/framework/templates/feature-brief.md` | NEW — template |
| `packages/core/framework/templates/feature-spec.md` | NEW — template |
| `packages/core/framework/templates/arch-delta.md` | NEW — template |
| `packages/core/framework/checklists/feature-review.md` | NEW — checklist |
| `packages/core/framework/commands/sniper-sprint.md` | Add `--feature` flag support |
| `packages/core/framework/commands/sniper-solve.md` | Add feature-scoped mode |
| `packages/core/framework/commands/sniper-status.md` | Add feature display |
| `packages/core/framework/config.template.yaml` | Add `feature_counter` and `features` array |
