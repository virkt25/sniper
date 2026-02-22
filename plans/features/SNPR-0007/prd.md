# SNPR-0007: Audit: Review & QA (`/sniper-audit --target review`)

> **Status:** Draft
> **Phase:** B — Production Lifecycle
> **Dependencies:** SNPR-0006 (shares the `/sniper-audit` umbrella command)

## Problem Statement

Code review and release readiness are critical quality gates, but they're often rushed or inconsistent:

1. **PR reviews** miss issues because a single reviewer can't check code quality, security, test coverage, and architecture compliance simultaneously
2. **Release readiness** is assessed informally — no structured checklist of breaking changes, migration needs, or documentation updates
3. **Knowledge is lost** — review comments are buried in PR threads and never captured as learnable patterns

SNIPER can provide structured, multi-perspective review and release readiness assessment using specialized agent teams.

## Solution Overview

Two sub-modes under `/sniper-audit --target review`:

```
/sniper-audit --target review --pr 42           # Review a specific PR
/sniper-audit --target review --release v2.5.0  # Release readiness assessment
```

### PR Review Mode

A 3-agent review team examines a PR from different perspectives:

| Reviewer | Focus | Checks |
|----------|-------|--------|
| Code Reviewer | Logic, patterns, maintainability | Code quality, naming, complexity, DRY, architecture compliance |
| Security Reviewer | Vulnerabilities, data handling | OWASP top 10, auth, input validation, secrets, SQL injection |
| Test Reviewer | Test quality, coverage | Missing tests, edge cases, test naming, mock patterns |

### Release Readiness Mode

A 3-agent release team assesses readiness:

| Reviewer | Focus | Output |
|----------|-------|--------|
| Release Manager | Changelog, versioning | Release notes, version bump recommendation |
| Breaking Change Analyst | API compatibility | Breaking change report, migration guide |
| Doc Reviewer | Documentation freshness | Doc update checklist |

## Detailed Requirements

### 1. PR Review Mode

**Usage:**
```
/sniper-audit --target review --pr 42
/sniper-audit --target review --pr 42 --focus security   # deep-dive on one area
```

**Orchestration:**
1. Read the PR diff (using git or GitHub API)
2. Read `docs/architecture.md` and `docs/conventions.md` for context
3. Spawn 3 review agents in parallel
4. Each produces findings in a structured format
5. Compile into a single review report

**Output: `docs/reviews/PR-{NNN}-review.md`**

Content:
- **Summary** — overall PR assessment (approve/request-changes/comment)
- **Code Quality** — findings from code reviewer
- **Security** — findings from security reviewer
- **Test Coverage** — findings from test reviewer
- **Recommendation** — approve, request changes, or block with specific items

Each finding has: severity (critical/warning/suggestion), file:line, description, suggested fix.

**The review does NOT automatically post to GitHub.** It produces a local report. The user decides whether to post comments.

**PR diff retrieval:** Uses `gh pr diff {number}` to get the diff. Requires the `gh` CLI to be installed and authenticated. If `gh` is not available, falls back to `git diff main...HEAD` for the current branch.

**`--dry-run`:** For PR review, runs only the code-reviewer (single perspective preview). For release review, produces a changelog only (no breaking change analysis or migration guide).

### 2. Release Readiness Mode

**Usage:**
```
/sniper-audit --target review --release v2.5.0
/sniper-audit --target review --release v2.5.0 --since v2.4.0   # compare against previous
```

**Orchestration:**
1. Read git log since the last release tag (or `--since`)
2. Read all changed files
3. Read `docs/architecture.md` for API contracts
4. Spawn 3 release agents in parallel
5. Each produces their section of the release readiness report

**Output: `docs/releases/v{X.Y.Z}-readiness.md`**

Content:
- **Version** — recommended version bump (major/minor/patch) with justification
- **Changelog** — categorized list of changes (features, fixes, breaking, internal)
- **Breaking Changes** — detailed analysis of API/schema/behavior changes
- **Migration Guide** — steps users need to take to upgrade (if breaking changes exist)
- **Documentation Status** — which docs need updating for this release
- **Release Checklist** — final pre-release verification items

### 3. State Model

Reviews are lightweight — they produce a report but don't have a multi-phase lifecycle like features or refactors. The state model is simpler:

```yaml
state:
  reviews:
    - id: "PR-042"
      type: pr                  # pr | release
      target: "42"             # PR number or version tag
      recommendation: approve   # approve | request-changes | comment | null
      created_at: "2026-02-22T..."
    - id: "REL-v2.5.0"
      type: release
      target: "v2.5.0"
      recommendation: ready     # ready | not-ready | null
      created_at: "2026-02-22T..."
```

Reviews do NOT have a counter (IDs are derived from the target: `PR-{number}` or `REL-{tag}`).

**phase_log entries:** Reviews do NOT write to `state.phase_log`. They are tracked in `state.reviews[]`.

**Output directories:** Created on first use:
- `docs/reviews/` — PR review reports
- `docs/releases/` — release readiness reports

### 4. Team Composition

**PR Review Team (`teams/review-pr.yaml`):**

```yaml
teammates:
  - name: code-reviewer
    compose:
      process: code-reviewer
      technical: null         # adapts based on file types in PR
      cognitive: devils-advocate
    tasks:
      - id: code-review
        output: code quality section of review report
        blocked_by: []

  - name: security-reviewer
    compose:
      process: code-reviewer
      technical: null
      cognitive: security-first
    tasks:
      - id: security-review
        output: security section of review report
        blocked_by: []

  - name: test-reviewer
    compose:
      process: qa-engineer
      technical: null
      cognitive: systems-thinker
    tasks:
      - id: test-review
        output: test coverage section of review report
        blocked_by: []
```

**Release Readiness Team (`teams/review-release.yaml`):**

```yaml
teammates:
  - name: release-manager
    compose:
      process: release-manager
      technical: null
      cognitive: systems-thinker
    tasks:
      - id: changelog
        output: changelog and version recommendation
        blocked_by: []

  - name: breaking-change-analyst
    compose:
      process: code-reviewer
      technical: null
      cognitive: devils-advocate
    tasks:
      - id: breaking-changes
        output: breaking change report and migration guide
        blocked_by: []

  - name: doc-reviewer
    compose:
      process: doc-writer          # reuses existing doc-writer persona (from /sniper-doc)
      technical: null
      cognitive: user-empathetic
    tasks:
      - id: doc-review
        output: documentation status
        blocked_by: []
```

### 5. New Persona Files

**`personas/process/code-reviewer.md`**
Role: Code review specialist. Examine code for clarity, correctness, maintainability, and adherence to conventions. Think like a senior developer doing a thorough code review — not just catching bugs but ensuring the code is the best it can be.

**`personas/process/release-manager.md`**
Role: Release coordinator. Assess release readiness by evaluating all changes since the last release. Categorize changes, identify risks, produce clear changelogs and migration guides. Think like a release engineer who owns the deploy button.

### 6. New Templates

**`templates/pr-review.md`** — PR review report with summary, code quality, security, test coverage, and recommendation sections.

**`templates/release-readiness.md`** — Release readiness report with version recommendation, changelog, breaking changes, migration guide, documentation status, and release checklist.

### 7. `/sniper-status` Integration

Status should show recent reviews:

```
Recent Reviews:
  PR-42   Add webhook endpoint     reviewed 2026-02-22 (approve with comments)
  v2.5.0  Release readiness        reviewed 2026-02-21 (ready, 2 breaking changes)
```

## Acceptance Criteria

1. **Given** `/sniper-audit --target review --pr 42`, **When** the PR contains a SQL injection vulnerability, **Then** the security reviewer flags it as critical with file:line and suggested fix.

2. **Given** `/sniper-audit --target review --release v2.5.0`, **When** the release contains breaking API changes, **Then** the report includes a migration guide and recommends a major version bump.

3. **Given** a PR review report, **When** all findings are suggestions (no criticals or warnings), **Then** the recommendation is "approve."

4. **Given** `/sniper-audit --target review --pr 42 --focus security`, **When** the review runs, **Then** only the security reviewer runs (deep-dive mode).

## Implementation Scope

### In Scope
- `/sniper-audit --target review --pr` mode
- `/sniper-audit --target review --release` mode
- PR review team YAML (3 agents)
- Release readiness team YAML (3 agents)
- 2 new persona files (code-reviewer, release-manager)
- 2 new templates (pr-review, release-readiness)
- Review output directories (`docs/reviews/`, `docs/releases/`)
- `--focus` flag for single-reviewer deep-dive
- `--since` flag for release comparison

### Out of Scope
- Automatic GitHub PR comment posting (user decides whether to post)
- Automated version bumping or tag creation
- CI/CD integration
- Automated deployment after release approval

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-audit.md` | UPDATE — add `review` target dispatch |
| `packages/core/framework/teams/review-pr.yaml` | NEW — PR review team |
| `packages/core/framework/teams/review-release.yaml` | NEW — release readiness team |
| `packages/core/framework/personas/process/code-reviewer.md` | NEW — persona |
| `packages/core/framework/personas/process/release-manager.md` | NEW — persona |
| `packages/core/framework/templates/pr-review.md` | NEW — template |
| `packages/core/framework/templates/release-readiness.md` | NEW — template |
| `packages/core/framework/commands/sniper-status.md` | Update to show reviews |
| `packages/core/framework/config.template.yaml` | Add `reviews` array to state |
