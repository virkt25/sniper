# SNPR-0008: Audit: Test & Coverage (`/sniper-audit --target tests`)

> **Status:** Draft
> **Phase:** C — Quality & Depth
> **Dependencies:** SNPR-0006 (shares the `/sniper-audit` umbrella command)
> **Soft Dependencies:** SNPR-0003 (architecture doc from ingest provides better context for identifying coverage gaps)

## Problem Statement

Test suites in growing projects suffer from predictable quality problems:

1. **Coverage blind spots** — developers write tests for the code they just wrote, but miss edge cases, error paths, and integration boundaries. Coverage reports show numbers, but nobody systematically analyzes *what* is uncovered and *why* it matters.
2. **Flaky tests** — intermittent failures erode trust in the test suite. Teams start ignoring red CI, which masks real regressions. Flaky tests often have subtle root causes (timing, shared state, network dependencies) that require focused investigation.
3. **Missing integration tests** — unit tests pass, but the system breaks at service boundaries. Nobody systematically identifies where integration tests are needed based on the architecture.
4. **Inconsistent test patterns** — different parts of the codebase use different testing approaches, assertion styles, and mock strategies. This makes tests harder to maintain and onboard into.

SNIPER can bring structured, multi-agent analysis to test quality — systematically identifying gaps, fixing flaky tests, and improving coverage where it matters most.

## Solution Overview

`/sniper-audit --target tests` spawns a test quality team that analyzes and improves the test suite:

```
/sniper-audit --target tests                           # full test suite analysis
/sniper-audit --target tests --scope "src/api/"        # scope to specific directories
/sniper-audit --target tests --focus coverage          # coverage analysis only
/sniper-audit --target tests --focus flaky             # flaky test investigation only
/sniper-audit --target tests --resume TST-002          # resume a test audit
/sniper-audit --target tests --list                    # list test audits
```

The team produces artifacts under `docs/audits/TST-{NNN}/`:
- `coverage-report.md` — coverage analysis with prioritized gaps
- `flaky-report.md` — flaky test investigation with root causes
- `stories/` — implementation stories for test improvements

**`--dry-run`:** Runs coverage analysis and flaky test investigation only. Produces both reports but does not generate improvement stories or proceed to sprint.

## Detailed Requirements

### 1. Integration with `/sniper-audit` Umbrella

Add a `tests` section to `sniper-audit.md` (Section C). The shared pre-flight checks (Step 0) already handle initialization, config migration, and argument parsing.

Update the target dispatch table to mark `tests` as `Available`:

| Target | Description | Team YAML | Status |
|--------|-------------|-----------|--------|
| `tests` | Test & coverage analysis | `test.yaml` | Available |

Remove the "Phase C" placeholder message for `--target tests`.

### 2. Test Audit Numbering

Test audits use `TST-{NNN}` format:

```yaml
state:
  test_audit_counter: 1
  test_audits:
    - id: "TST-001"
      title: "Full test suite analysis"
      status: analyzing         # analyzing | planning | in-progress | complete
      created_at: "2026-02-22T..."
      completed_at: null
      scope_dirs: []
      focus: null               # null (full) | coverage | flaky
      stories_total: 0
      stories_complete: 0
```

### 3. Test Audit Directory Structure

```
docs/audits/TST-001/
├── coverage-report.md      # Coverage analysis (analyzing phase)
├── flaky-report.md         # Flaky test investigation (analyzing phase)
└── stories/
    ├── S01-add-api-auth-tests.md
    ├── S02-fix-flaky-db-test.md
    └── S03-add-payment-integration.md
```

### 4. Team Composition

**Phase 1: Analysis (2-Agent Team, Parallel)**

| Teammate | Persona Layers | Output | Purpose |
|----------|---------------|--------|---------|
| `coverage-analyst` | process: coverage-analyst, cognitive: systems-thinker | `coverage-report.md` | Identify coverage gaps, prioritize by risk |
| `flake-hunter` | process: flake-hunter, cognitive: devils-advocate | `flaky-report.md` | Identify flaky tests, diagnose root causes |

**Phase 2: Planning (Single Agent — Lead)**

The lead reads both reports and generates improvement stories under `stories/`.

**Phase 3: Execution (Parallel Team — reuses sprint infrastructure)**

Stories are executed via the standard sprint mechanism (same as `/sniper-sprint`).

**`--focus` flag:** When `--focus coverage` is passed, only the coverage-analyst runs in Phase 1 (skip flake-hunter). When `--focus flaky`, only the flake-hunter runs. Phase 2 and 3 proceed normally with whatever reports were produced.

### 5. Coverage Analyst

**Agent reads:**
- Test suite output (runs `{test_runner} --coverage` from config)
- `docs/architecture.md` (if exists) — to map coverage to architectural components
- `docs/conventions.md` (if exists) — to understand testing patterns
- Source code in the scoped directories

**Agent produces: `docs/audits/TST-{NNN}/coverage-report.md`**

Content:
- **Coverage Summary** — overall line/branch/function coverage percentages
- **Critical Gaps** — uncovered code ranked by risk (public APIs first, then business logic, then utilities). Each gap includes: file:line range, what's uncovered, why it matters, suggested test approach
- **Integration Boundaries** — places where services/modules interact that lack integration tests. Identified by cross-referencing architecture components with test file coverage
- **Test Pattern Analysis** — assessment of testing consistency (assertion styles, mock patterns, test structure)
- **Prioritized Recommendations** — ordered list of what to test next, with effort estimates (S/M/L)

**Coverage data retrieval:** Runs the test runner from `stack.test_runner` in config with coverage enabled. Common mappings:
- `vitest` → `npx vitest run --coverage`
- `jest` → `npx jest --coverage`
- `pytest` → `pytest --cov --cov-report=json`
- `go` → `go test -coverprofile=coverage.out ./...`

If coverage tooling is not configured or fails, the agent falls back to static analysis: scanning test files to identify which source files have corresponding test files and which don't.

### 6. Flake Hunter

**Agent reads:**
- Test suite output (runs `{test_runner}` twice to identify inconsistent results)
- CI logs (if `.github/workflows/` exists, reads for test-related job names and known failure patterns)
- Test source code for common flake patterns

**Agent produces: `docs/audits/TST-{NNN}/flaky-report.md`**

Content:
- **Flake Summary** — count of identified flaky tests, categorized by root cause
- **Flaky Test Inventory** — each flaky test with:
  - Test name and file:line
  - Root cause category: timing, shared state, network, race condition, non-deterministic data, environment dependency
  - Evidence: how the flakiness was detected or reproduced
  - Suggested fix approach
- **Systemic Issues** — patterns that cause multiple flaky tests (e.g., "12 tests share a database connection without cleanup")
- **Quick Wins** — flaky tests that can be fixed with minimal effort
- **Prevention Recommendations** — patterns and guardrails to prevent future flaky tests

**Flake detection strategy:**
1. Run the test suite twice in sequence. Tests that pass once and fail once (or vice versa) are flagged.
2. If dual-run is too slow for the test suite, fall back to static analysis: scan for common flake patterns (setTimeout in tests, shared mutable state, missing cleanup/teardown, hardcoded ports, Date.now() in assertions).
3. If CI logs are available, cross-reference with historically failing tests.

### 7. Story Generation

After the analysis reports are approved, the lead generates improvement stories:

1. Read both reports (coverage-report.md and/or flaky-report.md)
2. Generate 3-15 stories under `docs/audits/TST-{NNN}/stories/`
3. Stories are prioritized: critical gap fixes and quick-win flake fixes first
4. Each story handles one logical improvement (e.g., "Add auth middleware tests", "Fix flaky payment webhook test")
5. Name stories: `S01-{slug}.md`, `S02-{slug}.md`, etc.

### 8. Sprint Integration

Test improvement stories reuse the standard sprint infrastructure:

1. **Story source:** Read stories from `docs/audits/TST-{NNN}/stories/`
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.test_audits[].stories_complete`.
3. **Team naming:** Team is named `sniper-test-sprint-TST-{NNN}`.
4. **Context:** Include coverage-report.md and flaky-report.md in spawn prompts so agents understand the full picture.
5. **On completion:** Update test audit status to `complete`.

### 9. Orchestration Flow

```
Step 1: Assign test audit ID (TST-{NNN})
Step 2: Create audit directory
Step 3: Spawn analysis team (1-2 agents → coverage-report.md, flaky-report.md)
Step 4: Present findings → "Review analysis. Generate improvement stories? (yes/edit/cancel)"
Step 5: Generate stories (lead → stories/)
Step 6: Present stories → "Review stories. Start test improvement sprint? (yes/edit/cancel)"
Step 7: Run sprint (standard sprint infrastructure)
Step 8: Update audit status to complete
```

### 10. New Persona Files

**`personas/process/coverage-analyst.md`**
Role: Test coverage strategist. Analyze coverage data not just for percentage, but for *risk-weighted* gaps. A missing test on a payment handler matters more than a missing test on a logger utility. Think like a QA lead prioritizing where testing effort will prevent the most production incidents.

**`personas/process/flake-hunter.md`**
Role: Flaky test detective. Investigate intermittent test failures with the patience of a forensic analyst. Look for shared state, timing dependencies, race conditions, and environment coupling. Think like a reliability engineer who knows that a flaky test suite is worse than no tests — it teaches the team to ignore failures.

### 11. New Templates

**`templates/coverage-report.md`** — Coverage analysis with summary, critical gaps (with file:line, risk, and suggested approach), integration boundaries, pattern analysis, and prioritized recommendations.

**`templates/flaky-report.md`** — Flaky test investigation with inventory (test name, file:line, root cause category, evidence, suggested fix), systemic issues, quick wins, and prevention recommendations.

### 12. `/sniper-status` Integration

Status should show test audits:

```
Test Audits:
  TST-001  Full test suite analysis   in-progress (2/5 stories done)
  TST-002  API coverage gaps          analyzing

Completed Test Audits:
  TST-003  Auth module coverage       completed 2026-02-18 (4 stories)
```

### 13. New Checklist

**`checklists/test-review.md`** — Verify:
- Coverage analysis identified gaps in critical code paths
- Flaky tests have documented root causes (not just "retry" fixes)
- Stories are scoped to testable improvements
- Suggested tests follow project conventions
- Integration test gaps map to architecture component boundaries

## Acceptance Criteria

1. **Given** `/sniper-audit --target tests`, **When** the command runs, **Then** it spawns coverage-analyst and flake-hunter agents that produce analysis reports.

2. **Given** a codebase with 60% line coverage, **When** the coverage-analyst runs, **Then** the report identifies uncovered critical paths ranked by risk, not just by coverage percentage.

3. **Given** a test suite with flaky tests, **When** the flake-hunter runs the suite twice, **Then** inconsistent results are flagged with root cause categories.

4. **Given** `--focus coverage`, **When** the audit runs, **Then** only the coverage-analyst runs (no flake-hunter).

5. **Given** approved analysis reports, **When** stories are generated, **Then** they prioritize critical gaps and quick-win flake fixes.

6. **Given** `/sniper-audit --target tests --list`, **When** test audits exist, **Then** all audits are listed with status and progress.

## Implementation Scope

### In Scope
- `/sniper-audit --target tests` command logic (Section C in sniper-audit.md)
- Test audit numbering (TST-{NNN}) and directory creation
- 2 new persona files (coverage-analyst, flake-hunter)
- 2 new templates (coverage-report, flaky-report)
- Test review checklist
- Test team YAML
- Story generation for test improvements
- Sprint execution for test improvements
- Config state tracking for test audits
- `--focus`, `--list`, `--resume`, `--scope` flags

### Out of Scope
- Integration with external coverage tools (Codecov, Coveralls, SonarQube)
- Mutation testing
- Visual regression testing
- E2E/browser test generation
- Automated test generation via AI (stories are written for human/agent implementation, not auto-generated test code)

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-audit.md` | UPDATE — add `tests` target section (Section C) |
| `packages/core/framework/teams/test.yaml` | NEW — test analysis team composition |
| `packages/core/framework/personas/process/coverage-analyst.md` | NEW — persona |
| `packages/core/framework/personas/process/flake-hunter.md` | NEW — persona |
| `packages/core/framework/templates/coverage-report.md` | NEW — template |
| `packages/core/framework/templates/flaky-report.md` | NEW — template |
| `packages/core/framework/checklists/test-review.md` | NEW — checklist |
| `packages/core/framework/commands/sniper-status.md` | Update to show test audits |
| `packages/core/framework/config.template.yaml` | Add `test_audit_counter` and `test_audits` array |
