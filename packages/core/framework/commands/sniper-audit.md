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
  tests         Test & coverage analysis       Available
  security      Security audit                 Available
  performance   Performance analysis           Available

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
- `tests` → Jump to **Section C: Test & Coverage**
- `security` → Jump to **Section D: Security**
- `performance` → Jump to **Section E: Performance**
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

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Section C: Test & Coverage (`--target tests`)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## C0. Parse Tests Arguments

1. **`--list`:** List all test audits with status. Print and STOP.
2. **`--resume TST-{NNN}`:** Resume an in-progress test audit.
3. **`--focus {area}`:** `coverage` (coverage-analyst only) or `flaky` (flake-hunter only).

### C0a. Handle `--list`

If `--list` was passed:

```
============================================
  SNIPER Test Audits
============================================

  Active Test Audits:
    TST-{NNN}  {title}        {status} ({stories_complete}/{stories_total} stories)
    ...

  Completed Test Audits:
    TST-{NNN}  {title}        complete {date} ({stories_total} stories)
    ...

  Total: {active} active, {completed} completed

============================================
```

Then STOP.

### C0b. Handle `--resume`

If `--resume TST-{NNN}` was passed:

1. Find the test audit in `state.test_audits[]` by ID.
2. If not found, STOP: "Test audit TST-{NNN} not found."
3. Jump to the corresponding phase:
   - `analyzing` → Step C1 (re-run analysis)
   - `planning` → Step C4 (generate stories)
   - `in-progress` → Step C6 (resume sprint)

---

## C1. Assign Test Audit ID

### C1a. Assign ID

1. Read `state.test_audit_counter` from config (default: 1).
2. Assign: `TST-{NNN}` where NNN is zero-padded to 3 digits.
3. Increment `test_audit_counter` and write back to config.

### C1b. Record Test Audit in State

Add to `state.test_audits[]`:

```yaml
- id: "TST-{NNN}"
  title: "{description or 'Full test suite analysis'}"
  status: analyzing
  created_at: "{current ISO timestamp}"
  completed_at: null
  scope_dirs: ["{from --scope, or empty for full codebase}"]
  focus: "{null | coverage | flaky}"
  stories_total: 0
  stories_complete: 0
```

### C1c. Create Audit Directory

```
docs/audits/TST-{NNN}/
```

---

## C2. Analysis Phase (Team Spawn)

### C2a. Determine Agents to Spawn

- If `--focus coverage`: spawn only `coverage-analyst`
- If `--focus flaky`: spawn only `flake-hunter`
- Otherwise: spawn both in parallel

### C2b. Read Context

1. `docs/architecture.md` (if exists) — to map coverage to architectural components
2. `docs/conventions.md` (if exists) — to understand testing patterns
3. Source code in the scoped directories (`--scope` dirs, or scan full codebase)

### C2c. Spawn Coverage Analyst

Read persona layers:
1. `.sniper/personas/process/coverage-analyst.md`
2. `.sniper/personas/cognitive/systems-thinker.md`

**Instructions:**
1. Run `{test_runner} --coverage` (from `stack.test_runner` in config) to get coverage data. Common mappings:
   - `vitest` → `npx vitest run --coverage`
   - `jest` → `npx jest --coverage`
   - `pytest` → `pytest --cov --cov-report=json`
   - `go` → `go test -coverprofile=coverage.out ./...`
2. If coverage tooling fails, fall back to static analysis: scan for source files without corresponding test files.
3. Read `.sniper/templates/coverage-report.md`.
4. Produce `docs/audits/TST-{NNN}/coverage-report.md` following the template.

### C2d. Spawn Flake Hunter

Read persona layers:
1. `.sniper/personas/process/flake-hunter.md`
2. `.sniper/personas/cognitive/devils-advocate.md`

**Instructions:**
1. Run the test suite twice to identify inconsistent results.
2. If dual-run is too slow, fall back to static analysis: scan for common flake patterns (setTimeout in tests, shared mutable state, missing cleanup, hardcoded ports, Date.now() in assertions).
3. If CI logs are available (`.github/workflows/`), cross-reference with historically failing tests.
4. Read `.sniper/templates/flaky-report.md`.
5. Produce `docs/audits/TST-{NNN}/flaky-report.md` following the template.

### C2e. Create Team, Tasks, and Spawn

```
TeamCreate:
  team_name: "sniper-test-audit-TST-{NNN}"
  description: "Test & coverage audit TST-{NNN}"
```

Create tasks (parallel, no dependencies):
1. "Coverage Analysis" — assigned to coverage-analyst (if not `--focus flaky`)
2. "Flaky Test Investigation" — assigned to flake-hunter (if not `--focus coverage`)

Spawn agents. Enter delegate mode.

### C2f. Present Analysis

When agents complete:

```
============================================
  Test Analysis: TST-{NNN}
============================================

  Coverage:
    Lines: {pct}%  |  Branches: {pct}%
    Critical gaps: {count}
    Integration boundaries without tests: {count}

  Flaky Tests:
    Identified: {count}
    Systemic issues: {count}
    Quick wins: {count}

  Reports:
    docs/audits/TST-{NNN}/coverage-report.md
    docs/audits/TST-{NNN}/flaky-report.md

  Options:
    yes    — Generate improvement stories
    edit   — Edit the reports, then say "continue"
    cancel — Pause (resume later with --resume)

============================================
```

Wait for user response.
- **yes** → proceed to Step C3
- **edit** → wait for "continue", then proceed
- **cancel** → STOP. Audit stays in `analyzing` status.

If `--dry-run` was passed, STOP here after presenting the analysis.

---

## C3. Transition to Planning

Update `state.test_audits[]` for this audit: `status: planning`

Shut down the analysis team.

---

## C4. Story Generation (Lead Generates Directly)

### C4a. Read Context

1. `docs/audits/TST-{NNN}/coverage-report.md` (if exists)
2. `docs/audits/TST-{NNN}/flaky-report.md` (if exists)

### C4b. Generate Stories

1. Generate 3-15 stories under `docs/audits/TST-{NNN}/stories/`
2. Prioritize: critical gap fixes and quick-win flake fixes first
3. Each story handles one logical improvement
4. Name stories: `S01-{slug}.md`, `S02-{slug}.md`, etc.
5. Use the story template from `.sniper/templates/story.md`

### C4c. Update State

Update `state.test_audits[]`: `stories_total: {count}`

### C4d. Present Stories

```
============================================
  Test Improvement Stories: TST-{NNN}
============================================

  {count} stories generated:
    S01  {title}
    S02  {title}
    ...

  Stories: docs/audits/TST-{NNN}/stories/

  Options:
    yes    — Start test improvement sprint
    edit   — Edit stories, then say "continue"
    cancel — Pause

============================================
```

Wait for user response.

---

## C5. Review Gate

Run `/sniper-review` against the test audit artifacts using the checklist at `.sniper/checklists/test-review.md`.

---

## C6. Sprint Execution

### C6a. Transition to In-Progress

Update `state.test_audits[]` for this audit: `status: in-progress`

### C6b. Run Sprint

Execute the sprint using the standard sprint infrastructure with these adjustments:

1. **Story source:** Read stories from `docs/audits/TST-{NNN}/stories/`
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.test_audits[].stories_complete`.
3. **Team naming:** Team is named `sniper-test-sprint-TST-{NNN}`.
4. **Context:** Include coverage-report.md and flaky-report.md in spawn prompts.
5. **phase_log:** Append to `state.phase_log` with `context: "test-sprint-TST-{NNN}"`.

### C6c. On Completion

If all stories complete:
1. Update `state.test_audits[]`: `status: complete`, `completed_at: "{timestamp}"`

---

## C7. Present Final Results

```
============================================
  Test Audit Complete: TST-{NNN}
============================================

  {title}

  Coverage Gaps Fixed:  {count}
  Flaky Tests Fixed:    {count}
  Stories:              {complete}/{total}

  Artifacts:
    Coverage:  docs/audits/TST-{NNN}/coverage-report.md
    Flaky:     docs/audits/TST-{NNN}/flaky-report.md
    Stories:   docs/audits/TST-{NNN}/stories/

============================================
  Next Steps
============================================

  1. Run the full test suite to verify improvements
  2. Check coverage numbers against the original baseline
  3. Run /sniper-status to see overall project state

============================================
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Section D: Security (`--target security`)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## D0. Parse Security Arguments

1. **`--list`:** List all security audits with status. Print and STOP.
2. **`--resume SEC-{NNN}`:** Resume an in-progress security audit.
3. **`--focus {area}`:** `threats` (threat-modeler only) or `vulns` (vuln-scanner only).

### D0a. Handle `--list`

If `--list` was passed:

```
============================================
  SNIPER Security Audits
============================================

  Active Security Audits:
    SEC-{NNN}  {title}        {status} ({stories_complete}/{stories_total} stories)
    ...

  Completed Security Audits:
    SEC-{NNN}  {title}        complete {date} ({stories_total} stories, {critical} critical fixed)
    ...

  Total: {active} active, {completed} completed

============================================
```

Then STOP.

### D0b. Handle `--resume`

If `--resume SEC-{NNN}` was passed:

1. Find the security audit in `state.security_audits[]` by ID.
2. If not found, STOP: "Security audit SEC-{NNN} not found."
3. Jump to the corresponding phase:
   - `analyzing` → Step D1 (re-run analysis)
   - `planning` → Step D4 (generate stories)
   - `in-progress` → Step D6 (resume sprint)

---

## D1. Assign Security Audit ID

### D1a. Assign ID

1. Read `state.security_audit_counter` from config (default: 1).
2. Assign: `SEC-{NNN}` where NNN is zero-padded to 3 digits.
3. Increment `security_audit_counter` and write back to config.

### D1b. Record Security Audit in State

Add to `state.security_audits[]`:

```yaml
- id: "SEC-{NNN}"
  title: "{description or 'Full security audit'}"
  status: analyzing
  created_at: "{current ISO timestamp}"
  completed_at: null
  scope_dirs: ["{from --scope, or empty for full codebase}"]
  focus: "{null | threats | vulns}"
  findings_critical: 0
  findings_high: 0
  findings_medium: 0
  findings_low: 0
  stories_total: 0
  stories_complete: 0
```

### D1c. Create Audit Directory

```
docs/audits/SEC-{NNN}/
```

---

## D2. Analysis Phase (Team Spawn)

### D2a. Determine Agents to Spawn

- If `--focus threats`: spawn only `threat-modeler`
- If `--focus vulns`: spawn only `vuln-scanner`
- Otherwise: spawn both in parallel

### D2b. Read Context

1. `docs/architecture.md` (if exists) — component structure and data flows
2. `docs/conventions.md` (if exists) — auth/authz patterns
3. Source code in the scoped directories
4. `package.json` / dependency manifests

### D2c. Spawn Threat Modeler

Read persona layers:
1. `.sniper/personas/process/threat-modeler.md`
2. `.sniper/personas/technical/security.md`
3. `.sniper/personas/cognitive/systems-thinker.md`

**Instructions:**
1. Map all entry points (API endpoints, webhooks, file uploads, admin panels, WebSocket connections) with authentication requirements.
2. Identify trust boundaries (authenticated/unauthenticated, internal/external, user/admin).
3. Classify sensitive data (PII, credentials, tokens, financial data) and trace data flows.
4. Apply STRIDE methodology to identify threats.
5. Assess dependency risk from manifests.
6. Read `.sniper/templates/threat-model.md`.
7. Produce `docs/audits/SEC-{NNN}/threat-model.md` following the template.

### D2d. Spawn Vulnerability Scanner

Read persona layers:
1. `.sniper/personas/process/vuln-scanner.md`
2. `.sniper/personas/technical/security.md`
3. `.sniper/personas/cognitive/devils-advocate.md`

**Instructions:**
1. Search for common vulnerability patterns: SQL concatenation, unsanitized user input, missing auth checks, hardcoded secrets, insecure crypto, CORS misconfig.
2. Trace data flow from user input to database/response.
3. Check auth/authz middleware coverage on all routes.
4. Review error handling for information leakage.
5. Check dependency manifests for known vulnerable versions.
6. Read `.sniper/templates/vulnerability-report.md`.
7. Produce `docs/audits/SEC-{NNN}/vulnerability-report.md` following the template.

### D2e. Create Team, Tasks, and Spawn

```
TeamCreate:
  team_name: "sniper-security-audit-SEC-{NNN}"
  description: "Security audit SEC-{NNN}"
```

Create tasks (parallel, no dependencies):
1. "Threat Modeling" — assigned to threat-modeler (if not `--focus vulns`)
2. "Vulnerability Scanning" — assigned to vuln-scanner (if not `--focus threats`)

Spawn agents. Enter delegate mode.

### D2f. Present Analysis

When agents complete:

```
============================================
  Security Analysis: SEC-{NNN}
============================================

  Threat Model:
    Entry points mapped: {count}
    Trust boundaries: {count}
    Priority threats: {count}

  Vulnerabilities:
    Critical: {count}  |  High: {count}
    Medium: {count}    |  Low: {count}
    Patterns of concern: {count}

  Reports:
    docs/audits/SEC-{NNN}/threat-model.md
    docs/audits/SEC-{NNN}/vulnerability-report.md

  Options:
    yes    — Generate remediation stories
    edit   — Edit the reports, then say "continue"
    cancel — Pause (resume later with --resume)

============================================
```

Wait for user response.

If `--dry-run` was passed, STOP here after presenting the analysis.

---

## D3. Transition to Planning

Update `state.security_audits[]` for this audit: `status: planning`

Update finding counts: `findings_critical`, `findings_high`, `findings_medium`, `findings_low` from the vulnerability report.

Shut down the analysis team.

---

## D4. Story Generation (Lead Generates Directly)

### D4a. Read Context

1. `docs/audits/SEC-{NNN}/threat-model.md` (if exists)
2. `docs/audits/SEC-{NNN}/vulnerability-report.md` (if exists)

### D4b. Generate Stories

1. Generate 3-15 stories under `docs/audits/SEC-{NNN}/stories/`
2. Prioritize by severity: critical findings first, then high, medium, low
3. Systemic fixes (middleware, validation layers) before individual fixes
4. Each story handles one remediation
5. Name stories: `S01-{slug}.md`, `S02-{slug}.md`, etc.
6. Use the story template from `.sniper/templates/story.md`

### D4c. Update State

Update `state.security_audits[]`: `stories_total: {count}`

### D4d. Present Stories

```
============================================
  Remediation Stories: SEC-{NNN}
============================================

  {count} stories generated:
    S01  {title}  ({severity})
    S02  {title}  ({severity})
    ...

  Stories: docs/audits/SEC-{NNN}/stories/

  Options:
    yes    — Start remediation sprint
    edit   — Edit stories, then say "continue"
    cancel — Pause

============================================
```

Wait for user response.

---

## D5. Review Gate

Run `/sniper-review` against the security audit artifacts using the checklist at `.sniper/checklists/security-review.md`.

---

## D6. Sprint Execution

### D6a. Transition to In-Progress

Update `state.security_audits[]` for this audit: `status: in-progress`

### D6b. Run Sprint

Execute the sprint using the standard sprint infrastructure with these adjustments:

1. **Story source:** Read stories from `docs/audits/SEC-{NNN}/stories/`
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.security_audits[].stories_complete`.
3. **Team naming:** Team is named `sniper-security-sprint-SEC-{NNN}`.
4. **Context:** Include threat-model.md and vulnerability-report.md in spawn prompts.
5. **phase_log:** Append to `state.phase_log` with `context: "security-sprint-SEC-{NNN}"`.

### D6c. On Completion

If all stories complete:
1. Update `state.security_audits[]`: `status: complete`, `completed_at: "{timestamp}"`

---

## D7. Present Final Results

```
============================================
  Security Audit Complete: SEC-{NNN}
============================================

  {title}

  Findings Remediated:
    Critical: {count}  |  High: {count}
    Medium: {count}    |  Low: {count}
  Stories:  {complete}/{total}

  Artifacts:
    Threat Model:     docs/audits/SEC-{NNN}/threat-model.md
    Vulnerabilities:  docs/audits/SEC-{NNN}/vulnerability-report.md
    Stories:          docs/audits/SEC-{NNN}/stories/

============================================
  Next Steps
============================================

  1. Run the full test suite to verify remediations
  2. Re-run /sniper-audit --target security to verify no regressions
  3. Run /sniper-status to see overall project state

============================================
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Section E: Performance (`--target performance`)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## E0. Parse Performance Arguments

1. **Performance description** (positional): Specific concern to investigate (e.g., "Checkout API is slow"). Optional — if omitted, runs a general performance audit.
2. **`--list`:** List all performance audits with status. Print and STOP.
3. **`--resume PERF-{NNN}`:** Resume an in-progress performance audit.
4. **`--focus {area}`:** `profile` (profiling only) or `benchmarks` (benchmark gap analysis only).

### E0a. Handle `--list`

If `--list` was passed:

```
============================================
  SNIPER Performance Audits
============================================

  Active Performance Audits:
    PERF-{NNN}  {title}        {status} ({stories_complete}/{stories_total} stories)
    ...

  Completed Performance Audits:
    PERF-{NNN}  {title}        complete {date} ({stories_total} stories)
    ...

  Total: {active} active, {completed} completed

============================================
```

Then STOP.

### E0b. Handle `--resume`

If `--resume PERF-{NNN}` was passed:

1. Find the performance audit in `state.perf_audits[]` by ID.
2. If not found, STOP: "Performance audit PERF-{NNN} not found."
3. Jump to the corresponding phase:
   - `analyzing` → Step E1 (re-run profiling)
   - `planning` → Step E4 (optimization planning)
   - `in-progress` → Step E7 (resume sprint)

---

## E1. Assign Performance Audit ID

### E1a. Assign ID

1. Read `state.perf_audit_counter` from config (default: 1).
2. Assign: `PERF-{NNN}` where NNN is zero-padded to 3 digits.
3. Increment `perf_audit_counter` and write back to config.

### E1b. Record Performance Audit in State

Add to `state.perf_audits[]`:

```yaml
- id: "PERF-{NNN}"
  title: "{description or 'Full performance audit'}"
  status: analyzing
  created_at: "{current ISO timestamp}"
  completed_at: null
  scope_dirs: ["{from --scope, or empty for full codebase}"]
  focus: "{null | profile | benchmarks}"
  stories_total: 0
  stories_complete: 0
```

### E1c. Create Audit Directory

```
docs/audits/PERF-{NNN}/
```

---

## E2. Profiling Phase (Single Agent — You Do This Directly)

**Note:** Unlike tests and security audits which use 2-agent teams for analysis, performance auditing uses a single profiler agent. This is because performance analysis is more sequential than parallel — the optimization plan depends heavily on a coherent profiling analysis.

### E2a. Read Context

1. Performance concern description (if provided by user)
2. `docs/architecture.md` (if exists) — to identify performance-critical paths
3. Source code in the scoped directories
4. Database schema and query files (if identifiable)
5. Route/endpoint definitions
6. Any existing benchmark files

### E2b. Compose Profiler Persona

Read persona layers:
1. `.sniper/personas/process/perf-profiler.md`
2. `.sniper/personas/technical/backend.md`
3. `.sniper/personas/cognitive/systems-thinker.md`

Apply these perspectives as you produce the analysis.

### E2c. Produce Profile Report

Read the template at `.sniper/templates/performance-profile.md`.

Write `docs/audits/PERF-{NNN}/profile-report.md` following the template:
- **Performance Context** — what was investigated and why
- **Critical Path Analysis** — performance-sensitive paths (request chains, data pipelines, background jobs)
- **Bottleneck Inventory** — each bottleneck with location, category, evidence, impact, complexity
- **Resource Usage Patterns** — memory allocation, connection pools, compute patterns
- **Existing Optimizations** — caching, indexing, and optimization already in place
- **Benchmark Coverage** — which critical paths have benchmarks and which don't

**Profiling approach (static code analysis):**
1. Identify all request handling paths and trace their execution
2. Search for N+1 query patterns (loops containing database calls)
3. Identify missing database indexes by cross-referencing queries with schema
4. Find synchronous I/O in async contexts
5. Detect unbounded data processing (no pagination, full-table scans)
6. Check for missing caching on frequently-accessed, rarely-changed data
7. Identify large object serialization/deserialization
8. If a specific concern is provided, trace that path in detail

### E2d. Present Profile

```
============================================
  Performance Profile: PERF-{NNN}
============================================

  Context: {description or 'General performance audit'}
  Bottlenecks Found: {count}
    Critical: {count}  |  High: {count}
    Medium: {count}    |  Low: {count}
  Benchmark Coverage: {count}/{total} critical paths

  Full profile: docs/audits/PERF-{NNN}/profile-report.md

  Options:
    yes    — Continue to optimization planning
    edit   — Edit the profile, then say "continue"
    cancel — Pause (resume later with --resume)

============================================
```

Wait for user response.

If `--dry-run` was passed, STOP here after presenting the profile.
If `--focus profile` was passed, STOP here.

---

## E3. Transition to Planning

Update `state.perf_audits[]` for this audit: `status: planning`

---

## E4. Optimization Planning (Single Agent — You Do This Directly)

### E4a. Read Context

1. `docs/audits/PERF-{NNN}/profile-report.md`
2. `docs/architecture.md` (if exists)

### E4b. Produce Optimization Plan

Read the template at `.sniper/templates/optimization-plan.md`.

Write `docs/audits/PERF-{NNN}/optimization-plan.md` following the template:
- **Priority Matrix** — bottlenecks ranked by impact / effort ratio
- **Optimization Recommendations** — what to change, expected improvement, approach, risks
- **Benchmark Requirements** — what benchmarks to write to verify each optimization
- **Quick Wins** — low-effort, high-impact optimizations
- **Monitoring Recommendations** — metrics to track for regression prevention

### E4c. Present Plan

```
============================================
  Optimization Plan: PERF-{NNN}
============================================

  Quick Wins: {count}
  Total Optimizations: {count}
  Benchmark Stories: {count}

  Full plan: docs/audits/PERF-{NNN}/optimization-plan.md

  Options:
    yes    — Generate stories
    edit   — Edit the plan, then say "continue"
    cancel — Pause

============================================
```

Wait for user response.

---

## E5. Story Generation

### E5a. Generate Stories

1. Read the optimization plan at `docs/audits/PERF-{NNN}/optimization-plan.md`
2. Generate 3-12 stories under `docs/audits/PERF-{NNN}/stories/`
3. Each optimization gets a story, plus a companion benchmark story if needed
4. Quick wins come first, then higher-effort optimizations
5. Name stories: `S01-{slug}.md`, `S02-{slug}.md`, etc.
6. Use the story template from `.sniper/templates/story.md`

If `--focus benchmarks` was passed, generate benchmark-only stories (skip optimization stories).

### E5b. Update State

Update `state.perf_audits[]`: `stories_total: {count}`

### E5c. Present Stories

```
============================================
  Performance Stories: PERF-{NNN}
============================================

  {count} stories generated:
    S01  {title}
    S02  {title}
    ...

  Stories: docs/audits/PERF-{NNN}/stories/

  Options:
    yes    — Start optimization sprint
    edit   — Edit stories, then say "continue"
    cancel — Pause

============================================
```

Wait for user response.

---

## E6. Review Gate

Run `/sniper-review` against the performance audit artifacts using the checklist at `.sniper/checklists/perf-review.md`.

---

## E7. Sprint Execution

### E7a. Transition to In-Progress

Update `state.perf_audits[]` for this audit: `status: in-progress`

### E7b. Run Sprint

Execute the sprint using the standard sprint infrastructure with these adjustments:

1. **Story source:** Read stories from `docs/audits/PERF-{NNN}/stories/`
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.perf_audits[].stories_complete`.
3. **Team naming:** Team is named `sniper-perf-sprint-PERF-{NNN}`.
4. **Context:** Include profile-report.md and optimization-plan.md in spawn prompts.
5. **phase_log:** Append to `state.phase_log` with `context: "perf-sprint-PERF-{NNN}"`.

### E7c. On Completion

If all stories complete:
1. Update `state.perf_audits[]`: `status: complete`, `completed_at: "{timestamp}"`

---

## E8. Present Final Results

```
============================================
  Performance Audit Complete: PERF-{NNN}
============================================

  {title}

  Optimizations:    {count}
  Benchmarks Added: {count}
  Stories:          {complete}/{total}

  Artifacts:
    Profile:        docs/audits/PERF-{NNN}/profile-report.md
    Plan:           docs/audits/PERF-{NNN}/optimization-plan.md
    Stories:        docs/audits/PERF-{NNN}/stories/

============================================
  Next Steps
============================================

  1. Run benchmarks to verify performance improvements
  2. Compare against the original profile baseline
  3. Run /sniper-status to see overall project state

============================================
```

---

## IMPORTANT RULES

- This command does NOT write production code — it produces analysis reports and documentation only.
- Exception: `--target refactor` Phase 3, `--target tests` Phase 3, `--target security` Phase 3, and `--target performance` Phase 3 (sprint execution) write code through the standard sprint infrastructure.
- Reviews (`--target review`) do NOT post to GitHub automatically. They produce local reports.
- Reviews do NOT write to `state.phase_log`. They are tracked in `state.reviews[]` only.
- Refactor scoping and planning do NOT write to `state.phase_log`. Refactor sprints DO append to `state.phase_log` with `context: "refactor-sprint-REF-{NNN}"`.
- Test, security, and performance audits do NOT write to `state.phase_log` during analysis/planning. Their sprints DO append to `state.phase_log` with the appropriate context.
- Cancel at any checkpoint leaves the audit in its current status for later `--resume`.
- Resume restarts from the beginning of the current phase (agent state is ephemeral).
- All file paths are relative to the project root.
- The `--dry-run` flag limits each mode to its first analysis step only.
