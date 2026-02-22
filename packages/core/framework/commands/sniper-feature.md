# /sniper-feature -- Incremental Feature Lifecycle

You are executing the `/sniper-feature` command. Your job is to orchestrate a scoped mini-lifecycle for adding a single feature to an existing project. You run the full flow: scoping, planning, story generation, sprint, and merge-back — with user checkpoints between phases. Follow every step below precisely.

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

1. **Feature description** (positional): The feature title/description (e.g., "Add webhook support for real-time event delivery").
2. **`--list`:** List all active and completed features with their status. Print the list and STOP.
3. **`--resume SNPR-{XXXX}`:** Resume a paused feature. Find the feature in `state.features[]`, determine its current phase, and jump to the appropriate step.
4. **`--skip-to {phase}`:** Skip directly to a specific phase (planning, solving, sprint). Only valid with `--resume`.

### 0d. Handle `--list`

If `--list` was passed:

```
============================================
  SNIPER Features
============================================

  Active Features:
    SNPR-{XXXX}  {title}        {phase} ({progress})
    ...

  Completed Features:
    SNPR-{XXXX}  {title}        completed {date} ({story_count} stories)
    ...

  Total: {active} active, {completed} completed

============================================
```

Then STOP.

### 0e. Handle `--resume`

If `--resume SNPR-{XXXX}` was passed:

1. Find the feature in `state.features[]` by ID.
2. If not found, STOP: "Feature SNPR-{XXXX} not found."
3. Read the feature's current phase.
4. Jump to the corresponding step:
   - `scoping` → Step 2 (re-run scoping or continue)
   - `planning` → Step 4 (run planning)
   - `solving` → Step 6 (run story generation)
   - `sprint` → Step 8 (run sprint)

### 0f. Verify Feature Description

If no `--list` or `--resume` flag, a feature description is required:

1. If `$ARGUMENTS` does not contain a feature description, ask the user: "What feature would you like to add? Describe it in one sentence."
2. Store the feature description for Step 1.

### 0g. Check Architecture Doc Exists

1. Check if `docs/architecture.md` exists.
2. If it does NOT exist:
   - Print: "No architecture doc found. The feature lifecycle works best with an existing architecture doc. Options: (a) Run `/sniper-ingest` first to reverse-engineer the architecture (b) Continue without architecture context"
   - If (a), STOP.
   - If (b), note that the architecture delta phase will be skipped.

---

## Step 1: Assign Feature ID and Create Directory

### 1a. Assign SNPR ID

1. Read `state.feature_counter` from config (default: 1).
2. Assign the feature ID: `SNPR-{XXXX}` where XXXX is zero-padded (e.g., SNPR-0001).
3. Generate a slug from the feature description (e.g., "Add webhook support" → "webhook-support").
4. Increment `feature_counter` and write back to config.

### 1b. Record Feature in State

Add to `state.features[]`:

```yaml
- id: "SNPR-{XXXX}"
  slug: "{slug}"
  title: "{feature description}"
  phase: scoping
  created_at: "{current ISO timestamp}"
  completed_at: null
  arch_base_version: {current version of docs/architecture.md, or 0 if it doesn't exist}
  stories_total: 0
  stories_complete: 0
```

### 1c. Create Feature Directory

```
docs/features/SNPR-{XXXX}/
```

Print:

```
============================================
  Feature Created: SNPR-{XXXX}
============================================

  Title: {feature description}
  Slug:  {slug}
  Dir:   docs/features/SNPR-{XXXX}/

  Starting scoping phase...
============================================
```

---

## Step 2: Phase 1 — Scoping (Single Agent)

**You run scoping directly — no team is spawned.** This is lightweight.

### 2a. Gather Context

Read the following files to understand the current system:

1. `docs/architecture.md` (if exists) — understand the system structure
2. `docs/conventions.md` (if exists) — understand coding patterns
3. `.sniper/config.yaml` — get ownership paths and stack info
4. Source code files relevant to the feature — search for keywords from the feature description in the codebase

### 2b. Read Template

Read `.sniper/templates/feature-brief.md`

### 2c. Produce Feature Brief

Write `docs/features/SNPR-{XXXX}/brief.md` following the template. Fill in:

- **Feature Description** — what this feature does, in user-facing terms
- **Motivation** — why this feature is needed
- **Affected Areas** — which components/files will be impacted (use architecture doc and codebase search)
- **Scope** — clear in/out boundaries
- **Risks & Open Questions** — unknowns that need resolution
- **Dependencies** — external services, libraries, or other features needed

### 2d. Update Feature State

Update `state.features[]` for this feature: `phase: scoping` (already set).

### 2e. Present to User

Print:

```
============================================
  Feature Brief: SNPR-{XXXX}
============================================

{Summary of the brief — affected components, scope, key risks}

  Full brief: docs/features/SNPR-{XXXX}/brief.md

  Options:
    yes    — Continue to planning phase
    edit   — Make manual edits, then say "continue"
    cancel — Pause this feature (resume later with --resume)

============================================
```

Wait for user response.

- **yes** → proceed to Step 3
- **edit** → wait for user to say "continue", then proceed to Step 3
- **cancel** → STOP. Feature remains in `scoping` phase.

---

## Step 3: Transition to Planning

Update `state.features[]` for this feature: `phase: planning`

---

## Step 4: Phase 2 — Planning (2-Agent Team)

### 4a. Read Team Definition

Read `.sniper/teams/feature-plan.yaml`. Replace `{feature_id}` with the actual ID and `{feature_title}` with the title.

### 4b. Read Context

1. Read `docs/features/SNPR-{XXXX}/brief.md` (just produced)
2. Read `docs/architecture.md` (if exists)
3. Read `docs/conventions.md` (if exists)
4. Read templates: `.sniper/templates/feature-spec.md` and `.sniper/templates/arch-delta.md`

### 4c. Compose Spawn Prompts

For each teammate in the feature-plan team YAML:

**feature-pm:**
1. Read persona layers: process/product-manager.md, cognitive/systems-thinker.md
2. Compose spawn prompt with:
   - Feature context (brief, architecture, description)
   - Task: produce `docs/features/SNPR-{XXXX}/spec.md`
   - Instructions to follow the feature-spec template
   - Remind agent to read the brief first

**feature-architect:**
1. Read persona layers: process/architect.md, technical/backend.md, cognitive/systems-thinker.md
2. Compose spawn prompt with:
   - Feature context (brief, spec once produced, architecture, conventions)
   - Task: produce `docs/features/SNPR-{XXXX}/arch-delta.md`
   - Instructions to follow the arch-delta template
   - Note the base architecture version for merge-back tracking
   - Blocked by: feature-spec (must wait for PM to complete)
   - `plan_approval: true` — the architect must present a plan for approval before writing

### 4d. Create Team and Tasks

```
TeamCreate:
  team_name: "sniper-feature-plan-{feature_id}"
  description: "Feature planning for SNPR-{XXXX}: {title}"
```

Create two tasks:
1. "Feature Requirements Spec" — assigned to feature-pm
2. "Architecture Delta" — assigned to feature-architect, blocked by task 1

### 4e. Spawn Teammates and Delegate

Spawn both teammates. Enter delegate mode — coordinate, don't produce artifacts.

- The PM works first (produces spec.md)
- When PM completes, the architect's task unblocks
- The architect reads the spec + architecture and produces arch-delta.md
- The architect's task requires plan approval — review their proposed approach before they write

### 4f. Verify Artifacts

Once both complete, verify:
- `docs/features/SNPR-{XXXX}/spec.md` exists and has content
- `docs/features/SNPR-{XXXX}/arch-delta.md` exists and has content

### 4g. Shut Down Planning Team

Send shutdown requests to both teammates.

### 4h. Run Feature Review

Read `.sniper/checklists/feature-review.md`. Evaluate the spec and arch-delta sections.

### 4i. Present to User

Print:

```
============================================
  Feature Planning Complete: SNPR-{XXXX}
============================================

  Spec:       docs/features/SNPR-{XXXX}/spec.md
  Arch Delta: docs/features/SNPR-{XXXX}/arch-delta.md

  {Summary: requirement count, component changes, data model changes}

  Review: {pass_count}/{total} checklist items passed

  Options:
    yes    — Continue to story generation
    edit   — Make manual edits, then say "continue"
    cancel — Pause this feature

============================================
```

Wait for user response.

---

## Step 5: Transition to Solving

Update `state.features[]` for this feature: `phase: solving`

---

## Step 6: Phase 3 — Story Generation (Scoped Solve)

**You run this directly as a single agent (same as `/sniper-solve`), but scoped to the feature.**

### 6a. Read Feature Artifacts

1. Read `docs/features/SNPR-{XXXX}/spec.md`
2. Read `docs/features/SNPR-{XXXX}/arch-delta.md`
3. Read `docs/architecture.md` (for broader context)
4. Read `docs/conventions.md` (if exists, for coding patterns)
5. Read story template: `.sniper/templates/story.md`

### 6b. Create Stories Directory

```
docs/features/SNPR-{XXXX}/stories/
```

### 6c. Generate Stories

Create **3-8 stories** scoped to this feature. Follow the same rules as `/sniper-solve` Step 7:

- Self-contained: embed all context from the feature spec and arch-delta
- Given/When/Then acceptance criteria
- File ownership from config.yaml
- Complexity: S/M/L (split XL)
- Dependencies form a DAG

**Numbering:** Stories are numbered sequentially within the feature: `S01-{slug}.md`, `S02-{slug}.md`, etc.

**Context embedding:** Stories reference the feature spec and arch-delta, NOT the main PRD. Embed:
- Relevant requirements from `spec.md`
- Relevant architecture changes from `arch-delta.md`
- Patterns from `conventions.md`

### 6d. Update Feature State

```yaml
stories_total: {count of stories created}
```

### 6e. Present to User

```
============================================
  Stories Created: SNPR-{XXXX}
============================================

  {count} stories in docs/features/SNPR-{XXXX}/stories/

  | # | Story | Size | Priority | Ownership | Deps |
  |---|-------|------|----------|-----------|------|
  | S01 | {title} | M | P0 | backend | None |
  | S02 | {title} | S | P0 | backend | S01 |
  | ... | ... | ... | ... | ... | ... |

  Options:
    yes    — Start implementation sprint
    edit   — Make manual edits, then say "continue"
    cancel — Pause this feature

============================================
```

Wait for user response.

---

## Step 7: Transition to Sprint

Update `state.features[]` for this feature: `phase: sprint`

---

## Step 8: Phase 4 — Sprint (Scoped to Feature)

**This runs the sprint logic from `/sniper-sprint`, but scoped to the feature.**

### Key Differences from Standard Sprint

1. **Story source:** Read stories from `docs/features/SNPR-{XXXX}/stories/` instead of `docs/stories/`.

2. **Architecture context:** Include both `docs/architecture.md` AND `docs/features/SNPR-{XXXX}/arch-delta.md` in teammate spawn prompts. The arch-delta takes precedence for this feature's scope.

3. **State tracking:** Does NOT increment `state.current_sprint`. The feature's sprint is tracked in `state.features[].phase: sprint` and `state.features[].stories_complete`.

4. **Team naming:** Use `sniper-feature-sprint-{feature_id}` to avoid collision with main lifecycle sprint teams.

5. **Story completion:** Update `state.features[].stories_complete` count as stories complete.

6. **Conventions context:** Include `docs/conventions.md` (if exists) in spawn prompts so agents follow established patterns.

### Sprint Execution

Follow the same process as `/sniper-sprint` Steps 1-14, with the adjustments above:

- Step 0: Pre-flight (already done in feature pre-flight)
- Step 1: Do NOT increment `state.current_sprint`. Append a phase_log entry with `context: "feature-sprint-SNPR-{XXXX}"`.
- Step 2: Read team definition from `.sniper/teams/sprint.yaml`
- Step 3: Present feature stories (from feature dir) for selection. Default: select ALL feature stories.
- Steps 4-6: Same (determine teammates, assign stories, compose prompts — add arch-delta to context)
- Steps 7-14: Same execution, delegate, verify, review, state update

### After Sprint Completes

If all feature stories are complete, proceed automatically to Step 9 (merge-back).

If not all stories are complete, present:
```
Feature SNPR-{XXXX}: {completed}/{total} stories complete.
Run another sprint? (yes/no)
```

---

## Step 9: Phase 5 — Merge-Back

After all feature stories are complete and the sprint is approved:

### 9a. Conflict Detection

1. Read `arch_base_version` from `state.features[]` for this feature.
2. Read the current version from `docs/architecture.md` header.
3. **If current version > base version:** The architecture doc was modified since this feature started.
   - Print: "The architecture doc has been updated since this feature started (was v{base}, now v{current}). Please review the merge-back manually."
   - Show the arch-delta changes and ask for user approval before merging.
   - Wait for confirmation.
4. **If current version == base version:** Proceed with automatic merge.

### 9b. Merge Architecture Delta

1. Read `docs/features/SNPR-{XXXX}/arch-delta.md`
2. Read `docs/architecture.md`
3. For each section in the delta:
   - **New Components** → Add to the architecture doc's component section (within managed markers if present)
   - **Modified Components** → Update the relevant section in the architecture doc
   - **New Data Models** → Add to the Data Models section
   - **New/Modified API Endpoints** → Add to the API Contracts section
   - **Infrastructure Changes** → Add to the Infrastructure section
4. Increment the architecture doc's version number
5. Add a changelog entry: `v{N} ({date}): Merged SNPR-{XXXX} — {feature title}`
6. Set architecture doc status back to "Draft"

### 9c. Update Feature Log

Append to `docs/features/log.md` (create if it doesn't exist):

```markdown
| SNPR-{XXXX} | {title} | {start_date} | {completion_date} | {story_count} | {summary of architecture changes} |
```

### 9d. Update Feature State

```yaml
phase: complete
completed_at: "{current ISO timestamp}"
```

Update `state.artifacts.architecture.version` (incremented by merge-back).

---

## Step 10: Present Final Results

```
============================================
  Feature Complete: SNPR-{XXXX}
============================================

  {title}

  Stories Completed: {count}/{total}
  Architecture Updated: v{old} → v{new}

  Artifacts:
    Brief:      docs/features/SNPR-{XXXX}/brief.md
    Spec:       docs/features/SNPR-{XXXX}/spec.md
    Arch Delta: docs/features/SNPR-{XXXX}/arch-delta.md
    Stories:    docs/features/SNPR-{XXXX}/stories/

  Architecture Merge-Back:
    {summary of components/models/APIs added or modified}

  Feature logged in: docs/features/log.md

============================================
  Next Steps
============================================

  1. Review the merged architecture doc at docs/architecture.md
  2. Run /sniper-feature "next feature" to add another feature
  3. Run /sniper-status to see overall project state
  4. Run /sniper-audit --target security to audit the new code

============================================
```

---

## IMPORTANT RULES

- The feature lifecycle runs as a single orchestrated session with user checkpoints between phases.
- Phase 1 (scoping) runs as a single agent — no team spawned. Keep it lightweight (2-3 minutes).
- Phase 2 (planning) spawns a 2-agent team. The architect is blocked by the PM.
- Phase 3 (story generation) runs as a single agent scoped to the feature.
- Phase 4 (sprint) spawns the standard sprint team but scoped to feature stories.
- Phase 5 (merge-back) runs as a single agent and merges the arch-delta into the main architecture doc.
- Features are tracked in `state.features[]`, NOT in `state.phase_log` (except for sprint entries).
- The `arch_base_version` is recorded at scoping time for merge-back conflict detection.
- Feature stories live in `docs/features/SNPR-{XXXX}/stories/`, not in `docs/stories/`.
- Feature sprints do NOT increment `state.current_sprint`.
- At every user checkpoint, the user can pause the feature with "cancel" and resume later with `--resume`.
- If `$ARGUMENTS` contains "dry-run", perform Steps 0-2 only (scope the feature) and present the brief without proceeding further.
- All file paths are relative to the project root.
