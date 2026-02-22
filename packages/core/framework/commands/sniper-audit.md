# /sniper-audit -- Audit: Refactoring, Review & QA

You are executing the `/sniper-audit` command. This is an umbrella command that dispatches to target-specific audit modes. Each mode spawns specialized agent teams for structured analysis. Follow every step below precisely.

**Arguments:** $ARGUMENTS

---

## Step 0: Pre-Flight Checks (All Targets)

### 0a. Verify SNIPER Is Initialized

1. Read `.sniper/config.yaml`.
2. If the file does not exist or `project.name` is empty:
   - **STOP.** Print: "SNIPER is not initialized. Run `/sniper-init` first."

### 0b. Config Migration Check

1. Read `schema_version` from `.sniper/config.yaml`.
2. If `schema_version` is absent or less than 2, run the v1→v2 migration. Write the updated config before proceeding.

### 0c. Parse Shared Arguments

1. **`--target {name}`** (required): Select the audit mode. Valid targets listed below.
2. **`--dry-run`:** Run scoping/analysis only without proceeding to implementation or full review.
3. **`--scope "dir1/ dir2/"`:** Limit analysis to specific directories.

### 0d. Target Dispatch

If `--target` is missing, print the target table and ask the user to specify one:

```
============================================
  SNIPER Audit Targets
============================================

  Target        Description                    Status
  ──────        ───────────                    ──────
  refactor      Large-scale code changes       Available
  review        PR review / release readiness  Available
  security      Security audit                 Phase C
  tests         Test & coverage analysis       Phase C
  performance   Performance analysis           Phase C

  Usage:
    /sniper-audit --target refactor "Migrate from Express to Fastify"
    /sniper-audit --target review --pr 42
    /sniper-audit --target review --release v2.5.0

============================================
```

Then STOP.

### 0e. Dispatch to Target

Based on `--target`:
- `refactor` → Jump to **Section A: Refactoring**
- `review` → Jump to **Section B: Review & QA**
- `security`, `tests`, `performance` → STOP. Print: "Target '{name}' is not yet available. It will be added in Phase C."
- Anything else → STOP. Print: "Unknown target '{name}'. Run `/sniper-audit` to see available targets."

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Section A: Refactoring (`--target refactor`)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## A0. Parse Refactor Arguments

1. **Refactor description** (positional): What is being refactored (e.g., "Migrate from Express to Fastify").
2. **`--list`:** List all refactors with status. Print and STOP.
3. **`--resume REF-{NNN}`:** Resume an in-progress refactor.

### A0a. Handle `--list`

If `--list` was passed:

```
============================================
  SNIPER Refactors
============================================

  Active Refactors:
    REF-{NNN}  {title}        {status} ({stories_complete}/{stories_total} stories)
    ...

  Completed Refactors:
    REF-{NNN}  {title}        complete {date} ({stories_total} stories)
    ...

  Total: {active} active, {completed} completed

============================================
```

Then STOP.

### A0b. Handle `--resume`

If `--resume REF-{NNN}` was passed:

1. Find the refactor in `state.refactors[]` by ID.
2. If not found, STOP: "Refactor REF-{NNN} not found."
3. Jump to the corresponding phase:
   - `scoping` → Step A1 (re-run impact analysis)
   - `planning` → Step A3 (run migration planning)
   - `in-progress` → Step A7 (resume sprint)

### A0c. Verify Refactor Description

If no `--list` or `--resume` flag, a refactor description is required. If not provided, ask the user to describe the refactoring.

---

## A1. Assign Refactor ID and Scope

### A1a. Assign Refactor ID

1. Read `state.refactor_counter` from config (default: 1).
2. Assign: `REF-{NNN}` where NNN is zero-padded to 3 digits.
3. Increment `refactor_counter` and write back to config.

### A1b. Record Refactor in State

Add to `state.refactors[]`:

```yaml
- id: "REF-{NNN}"
  title: "{refactor description, truncated to 80 chars}"
  status: scoping
  created_at: "{current ISO timestamp}"
  completed_at: null
  scope_dirs: ["{from --scope, or empty for full codebase}"]
  stories_total: 0
  stories_complete: 0
```

### A1c. Create Refactor Directory

```
docs/refactors/REF-{NNN}/
```

---

## A2. Impact Analysis (Single Agent — You Do This Directly)

### A2a. Read Context

1. `docs/architecture.md` (if exists) — identify affected components
2. `docs/conventions.md` (if exists) — understand current patterns
3. Source code in the affected scope (`--scope` dirs, or scan full codebase)
4. Refactor description

### A2b. Compose Impact Analyst Persona

Read persona layers:
1. `.sniper/personas/process/impact-analyst.md`
2. `.sniper/personas/cognitive/devils-advocate.md`

Apply these perspectives as you produce the analysis.

### A2c. Produce Scope Document

Read the template at `.sniper/templates/refactor-scope.md`.

Write `docs/refactors/REF-{NNN}/scope.md` following the template:
- **Summary** — what is being changed and why
- **Blast Radius** — complete list of affected files, modules, and components
- **Pattern Inventory** — count of each pattern instance that needs migration (e.g., "47 Express route handlers across 12 files")
- **Risks** — what could go wrong, breaking change potential
- **Compatibility Concerns** — API consumers, downstream dependencies, database migrations
- **Estimated Effort** — S/M/L/XL based on file count and complexity

### A2d. Present Scope

```
============================================
  Impact Analysis: REF-{NNN}
============================================

  Refactor: {title}
  Blast Radius: {file count} files, {instance count} instances
  Effort: {S/M/L/XL}
  Risk: {key risk summary}

  Full scope: docs/refactors/REF-{NNN}/scope.md

  Options:
    yes    — Continue to migration planning
    edit   — Edit the scope, then say "continue"
    cancel — Pause (resume later with --resume)

============================================
```

Wait for user response.
- **yes** → proceed to Step A3
- **edit** → wait for "continue", then proceed
- **cancel** → STOP. Refactor stays in `scoping` status.

If `--dry-run` was passed, STOP here after presenting the scope.

---

## A3. Transition to Planning

Update `state.refactors[]` for this refactor: `status: planning`

---

## A4. Migration Planning (Single Agent — You Do This Directly)

### A4a. Read Context

1. `docs/refactors/REF-{NNN}/scope.md` — the impact analysis
2. `docs/architecture.md` (if exists)
3. `docs/conventions.md` (if exists)
4. Target framework/pattern documentation (if the user provided links)

### A4b. Compose Migration Architect Persona

Read persona layers:
1. `.sniper/personas/process/migration-architect.md`
2. `.sniper/personas/technical/backend.md`
3. `.sniper/personas/cognitive/systems-thinker.md`

Apply these perspectives as you produce the plan.

### A4c. Produce Migration Plan

Read the template at `.sniper/templates/migration-plan.md`.

Write `docs/refactors/REF-{NNN}/plan.md` following the template:
- **Strategy** — big-bang vs incremental vs strangler fig, with rationale
- **Steps** — ordered phases for the migration (following dependency order)
- **Coexistence** — how old and new patterns coexist during migration
- **Compatibility** — adapter patterns needed during transition
- **Verification** — how to verify each step (tests, canary, etc.)
- **Rollback** — how to undo if something goes wrong

### A4d. Present Plan

```
============================================
  Migration Plan: REF-{NNN}
============================================

  Strategy: {strategy name}
  Steps: {step count} migration phases
  Coexistence: {brief description}

  Full plan: docs/refactors/REF-{NNN}/plan.md

  Options:
    yes    — Generate stories
    edit   — Edit the plan, then say "continue"
    cancel — Pause

============================================
```

Wait for user response.

---

## A5. Story Generation (Scoped Solve)

### A5a. Generate Stories

1. Read the migration plan at `docs/refactors/REF-{NNN}/plan.md`
2. Generate 3-12 stories under `docs/refactors/REF-{NNN}/stories/`
3. Stories follow the migration order from the plan
4. Each story handles one logical migration step
5. Name stories: `S01-{slug}.md`, `S02-{slug}.md`, etc.

Use the story template from `.sniper/templates/story.md`.

### A5b. Update State

Update `state.refactors[]`: `stories_total: {count}`

### A5c. Present Stories

```
============================================
  Refactor Stories: REF-{NNN}
============================================

  {count} stories generated:
    S01  {title}
    S02  {title}
    ...

  Stories: docs/refactors/REF-{NNN}/stories/

  Options:
    yes    — Start refactoring sprint
    edit   — Edit stories, then say "continue"
    cancel — Pause

============================================
```

Wait for user response.

---

## A6. Review Gate

Run `/sniper-review` against the refactor artifacts using the refactor review checklist at `.sniper/checklists/refactor-review.md`. Verify:
- Impact analysis is complete and thorough
- Migration plan follows dependency order
- Stories cover all instances from the pattern inventory
- Overall consistency between scope, plan, and stories

---

## A7. Sprint Execution

### A7a. Transition to In-Progress

Update `state.refactors[]` for this refactor: `status: in-progress`

### A7b. Run Sprint

Execute the sprint using the standard sprint infrastructure (same as `/sniper-sprint`) with these adjustments:

1. **Story source:** Read stories from `docs/refactors/REF-{NNN}/stories/` instead of `docs/stories/`.
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.refactors[].stories_complete`.
3. **Team naming:** Team is named `sniper-refactor-sprint-REF-{NNN}`.
4. **Architecture context:** Include migration plan (`docs/refactors/REF-{NNN}/plan.md`) in spawn prompts.
5. **phase_log:** Append to `state.phase_log` with `context: "refactor-sprint-REF-{NNN}"`.

### A7c. On Completion

If all stories complete:
1. Optionally update `docs/conventions.md` to reflect new patterns (ask user)
2. Update `state.refactors[]`: `status: complete`, `completed_at: "{timestamp}"`

---

## A8. Present Final Results

```
============================================
  Refactor Complete: REF-{NNN}
============================================

  {title}

  Scope:    {file count} files, {instance count} instances
  Stories:  {complete}/{total}
  Duration: {time from creation to completion}

  Artifacts:
    Scope:   docs/refactors/REF-{NNN}/scope.md
    Plan:    docs/refactors/REF-{NNN}/plan.md
    Stories: docs/refactors/REF-{NNN}/stories/

============================================
  Next Steps
============================================

  1. Review the migrated code and run full test suite
  2. Update docs/conventions.md if not already done
  3. Run /sniper-status to see overall project state

============================================
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Section B: Review & QA (`--target review`)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## B0. Parse Review Arguments

1. **`--pr {number}`:** Review a specific pull request.
2. **`--release {tag}`:** Run release readiness assessment.
3. **`--focus {area}`:** Deep-dive on one area only (e.g., `security`, `tests`, `code`). Valid with `--pr` only.
4. **`--since {tag}`:** Compare against a specific previous release. Valid with `--release` only.

If neither `--pr` nor `--release` is provided, print:

```
============================================
  /sniper-audit --target review
============================================

  Specify a review sub-mode:

    --pr {number}         Review a pull request
    --release {tag}       Assess release readiness

  Examples:
    /sniper-audit --target review --pr 42
    /sniper-audit --target review --release v2.5.0
    /sniper-audit --target review --release v2.5.0 --since v2.4.0

============================================
```

Then STOP.

Dispatch:
- `--pr` → Jump to **B1: PR Review**
- `--release` → Jump to **B5: Release Readiness**

---

## B1. PR Review Mode

### B1a. Retrieve PR Diff

1. Try: `gh pr diff {number}` to get the diff.
2. If `gh` is not available, fall back to `git diff main...HEAD` for the current branch.
3. If neither works, STOP: "Cannot retrieve PR diff. Ensure `gh` CLI is installed or check out the PR branch locally."

### B1b. Read Context

1. `docs/architecture.md` (if exists)
2. `docs/conventions.md` (if exists)
3. The PR diff

### B1c. Create Output Directory

Create `docs/reviews/` if it doesn't exist.

### B1d. Handle `--dry-run`

If `--dry-run` was passed, run only the code-reviewer (single perspective preview). Skip to B1f with a single-agent review instead of a team.

### B1e. Handle `--focus`

If `--focus {area}` was passed, run only the corresponding single reviewer:
- `--focus code` → code-reviewer only
- `--focus security` → security-reviewer only
- `--focus tests` → test-reviewer only

Skip to B1f with a single-agent review.

### B1f. Spawn PR Review Team (3 Agents)

Read `.sniper/teams/review-pr.yaml`. Replace `{pr_number}` with the actual PR number.

**code-reviewer:**
1. Read persona layers: `process/code-reviewer.md`, `cognitive/devils-advocate.md`
2. Include: PR diff, architecture doc, conventions doc
3. Task: produce code quality section of `docs/reviews/PR-{NNN}-review.md`
4. Instructions: review for logic errors, naming clarity, pattern adherence, error handling, complexity, DRY violations, architecture compliance

**security-reviewer:**
1. Read persona layers: `process/code-reviewer.md`, `cognitive/security-first.md`
2. Include: PR diff
3. Task: produce security section of `docs/reviews/PR-{NNN}-review.md`
4. Instructions: review for OWASP top 10, input validation, authentication, authorization, secrets handling, SQL injection, XSS, CSRF

**test-reviewer:**
1. Read persona layers: `process/qa-engineer.md`, `cognitive/systems-thinker.md`
2. Include: PR diff, conventions doc
3. Task: produce test coverage section of `docs/reviews/PR-{NNN}-review.md`
4. Instructions: review for missing tests, edge cases, test naming, mock patterns, assertion quality

### B1g. Create Team, Tasks, and Spawn

```
TeamCreate:
  team_name: "sniper-review-pr-{pr_number}"
  description: "PR review for #{pr_number}"
```

Create three tasks (parallel, no dependencies):
1. "Code Quality Review" — assigned to code-reviewer
2. "Security Review" — assigned to security-reviewer
3. "Test Coverage Review" — assigned to test-reviewer

Spawn all agents. Enter delegate mode.

### B1h. Compile Review Report

When all reviewers complete:

1. Read all agents' findings
2. Read the template at `.sniper/templates/pr-review.md`
3. Compile into `docs/reviews/PR-{NNN}-review.md` following the template
4. Determine recommendation:
   - If any **critical** findings → `request-changes`
   - If any **warning** findings but no criticals → `comment`
   - If only **suggestion** findings → `approve`
5. Shut down the review team

### B1i. Record Review in State

Add to `state.reviews[]`:

```yaml
- id: "PR-{NNN}"
  type: pr
  target: "{pr_number}"
  recommendation: "{approve | request-changes | comment}"
  created_at: "{current ISO timestamp}"
```

### B1j. Present Review

```
============================================
  PR Review: #{pr_number}
============================================

  Recommendation: {APPROVE / REQUEST CHANGES / COMMENT}

  Findings:
    Critical:   {count}
    Warning:    {count}
    Suggestion: {count}

  Full review: docs/reviews/PR-{NNN}-review.md

============================================
  Note: This review is local only.
  To post comments to GitHub, review the
  report and manually copy relevant findings.
============================================
```

---

## B5. Release Readiness Mode

### B5a. Determine Comparison Range

1. If `--since {tag}` was provided, use that as the base.
2. Otherwise, find the most recent release tag: `git describe --tags --abbrev=0`
3. If no tags found, use the initial commit.

### B5b. Read Context

1. `git log {base}..HEAD` — all commits since previous release
2. `git diff {base}..HEAD` — all file changes
3. `docs/architecture.md` (if exists)
4. `README.md` (if exists)

### B5c. Create Output Directory

Create `docs/releases/` if it doesn't exist.

### B5d. Handle `--dry-run`

If `--dry-run` was passed, run only the release-manager (changelog only, no breaking change analysis or migration guide). Skip to B5f with a single-agent review.

### B5e. Spawn Release Readiness Team (3 Agents)

Read `.sniper/teams/review-release.yaml`. Replace `{version}` with the target version tag.

**release-manager:**
1. Read persona layers: `process/release-manager.md`, `cognitive/systems-thinker.md`
2. Include: git log, package.json
3. Task: produce changelog and version recommendation sections of readiness report
4. Instructions: categorize all changes, determine semver bump, produce user-facing changelog

**breaking-change-analyst:**
1. Read persona layers: `process/code-reviewer.md`, `cognitive/devils-advocate.md`
2. Include: git diff, architecture doc
3. Task: produce breaking changes and migration sections of readiness report
4. Instructions: analyze for API changes, schema changes, config changes, behavior changes. For each breaking change, write a migration step. Err on the side of flagging.

**doc-reviewer:**
1. Read persona layers: `process/doc-writer.md`, `cognitive/user-empathetic.md`
2. Include: git log, docs/, README.md
3. Task: produce documentation status section of readiness report
4. Instructions: check if documentation matches changes. Flag outdated or missing docs.

### B5f. Create Team, Tasks, and Spawn

```
TeamCreate:
  team_name: "sniper-review-release-{version}"
  description: "Release readiness assessment for {version}"
```

Create three tasks (parallel, no dependencies):
1. "Changelog & Version Recommendation" — assigned to release-manager
2. "Breaking Change Analysis" — assigned to breaking-change-analyst
3. "Documentation Status" — assigned to doc-reviewer

Spawn all agents. Enter delegate mode.

### B5g. Compile Readiness Report

When all reviewers complete:

1. Read all agents' findings
2. Read the template at `.sniper/templates/release-readiness.md`
3. Compile into `docs/releases/{version}-readiness.md` following the template
4. Determine recommendation:
   - If any undocumented breaking changes → `not-ready`
   - If all breaking changes have migration guides and docs are updated → `ready`
5. Shut down the release team

### B5h. Record Review in State

Add to `state.reviews[]`:

```yaml
- id: "REL-{version}"
  type: release
  target: "{version}"
  recommendation: "{ready | not-ready}"
  created_at: "{current ISO timestamp}"
```

### B5i. Present Readiness Report

```
============================================
  Release Readiness: {version}
============================================

  Recommendation: {READY / NOT READY}
  Version Bump:   {major / minor / patch}

  Changes:
    Features:        {count}
    Bug Fixes:       {count}
    Breaking:        {count}
    Internal:        {count}

  Documentation:
    Up to date:  {count}
    Needs update: {count}

  Full report: docs/releases/{version}-readiness.md

============================================
```

---

## IMPORTANT RULES

- This command does NOT write production code — it produces analysis reports and documentation only.
- Exception: `--target refactor` Phase 3 (sprint execution) writes code through the standard sprint infrastructure.
- Reviews (`--target review`) do NOT post to GitHub automatically. They produce local reports.
- Reviews do NOT write to `state.phase_log`. They are tracked in `state.reviews[]` only.
- Refactor scoping and planning do NOT write to `state.phase_log`. Refactor sprints DO append to `state.phase_log` with `context: "refactor-sprint-REF-{NNN}"`.
- Cancel at any checkpoint leaves the refactor in its current status for later `--resume`.
- Resume restarts from the beginning of the current phase (agent state is ephemeral).
- All file paths are relative to the project root.
- The `--dry-run` flag limits each mode to its first analysis step only.
- Phase C targets (security, tests, performance) are NOT implemented — print a message and stop.
