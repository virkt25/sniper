# SNPR-0006: Audit: Refactoring (`/sniper-audit --target refactor`)

> **Status:** Draft
> **Phase:** B — Production Lifecycle
> **Dependencies:** SNPR-0001 (versioned architecture doc for merge-back), SNPR-0003 (conventions doc for pattern enforcement)

## Problem Statement

Large-scale refactoring — framework migrations, architectural pattern changes, dependency upgrades — is one of the most risk-prone activities in software engineering. Common issues:

1. **No impact analysis** — developers start changing code without understanding the blast radius
2. **Inconsistent migration** — half the codebase uses the new pattern, half uses the old
3. **No compatibility verification** — breaking changes are discovered in production
4. **Lost context** — the rationale for the refactoring is not documented

SNIPER can bring structured planning and parallel execution to refactoring, ensuring complete migration with compatibility verification.

## Solution Overview

`/sniper-audit --target refactor` spawns a refactoring team that runs a structured refactor lifecycle:

```
/sniper-audit --target refactor "Migrate from Express to Fastify"
/sniper-audit --target refactor "Replace class components with hooks" --scope "src/components/"
/sniper-audit --target refactor --list                # list active refactors
/sniper-audit --target refactor --resume REF-002      # resume a refactor
```

The team produces artifacts under `docs/refactors/REF-{NNN}/`:
- `scope.md` — impact analysis and migration scope
- `plan.md` — migration plan with step-by-step approach
- `stories/` — implementation stories for the refactor

## Detailed Requirements

### 1. The `/sniper-audit` Umbrella Command

SNPR-0006 introduces the `/sniper-audit` command as an extensible umbrella. The `sniper-audit.md` file contains:

**Shared pre-flight checks (all targets):**
- Verify SNIPER is initialized
- Config migration check (schema_version)
- Parse `--target` argument (required)
- Dispatch to target-specific logic

**Target dispatch table:**

| Target | Description | Team YAML | Phase |
|--------|-------------|-----------|-------|
| `refactor` | Large-scale code changes | `refactor.yaml` | B (this PRD) |
| `review` | PR review / release readiness | `review-pr.yaml` / `review-release.yaml` | B (SNPR-0007) |
| `security` | Security audit | `security.yaml` | C (SNPR-0009) |
| `tests` | Test & coverage analysis | `test.yaml` | C (SNPR-0008) |
| `performance` | Performance analysis | `perf.yaml` | C (SNPR-0010) |

**When `--target` is missing:** Print the target table above and ask the user to specify one.

**Extensibility:** Each target mode has its own section in `sniper-audit.md`. Future targets (Phase C) simply add a new section and team YAML. The shared pre-flight checks are always run first.

**Shared arguments across all targets:**
- `--target {name}` — required, selects the audit mode
- `--dry-run` — run scoping/analysis only without proceeding to implementation
- `--scope "dir1/ dir2/"` — limit analysis to specific directories

This PRD specifies the `--target refactor` mode. SNPR-0007 specifies `--target review`.

### 2. Refactor Numbering

Refactors use `REF-{NNN}` format:

```yaml
state:
  refactor_counter: 1
  refactors:
    - id: "REF-001"
      title: "Migrate from Express to Fastify"
      status: scoping        # scoping | planning | in-progress | complete
      created_at: "2026-02-22T..."
      completed_at: null
      scope_dirs: ["src/api/", "src/middleware/"]
      stories_total: 0
      stories_complete: 0
```

### 3. Refactor Directory Structure

```
docs/refactors/REF-001/
├── scope.md              # Impact analysis (scoping phase)
├── plan.md               # Migration plan (planning phase)
└── stories/
    ├── S01-update-deps.md
    ├── S02-migrate-routes.md
    └── S03-update-tests.md
```

### 4. Team Composition

**Phase 1: Impact Analysis (Single Agent)**

| Teammate | Persona Layers | Output | Purpose |
|----------|---------------|--------|---------|
| `impact-analyst` | process: impact-analyst, cognitive: devils-advocate | `scope.md` | Analyze blast radius, identify all affected files and patterns |

**Phase 2: Migration Planning (Single Agent)**

| Teammate | Persona Layers | Output | Purpose |
|----------|---------------|--------|---------|
| `migration-architect` | process: migration-architect, technical: backend, cognitive: systems-thinker | `plan.md` | Design the step-by-step migration approach |

**Phase 3: Execution (Parallel Team — reuses sprint infrastructure)**

Stories generated from the migration plan are executed via the standard sprint mechanism (same as `/sniper-sprint`).

### 5. Impact Analyst

**Agent reads:**
- The refactor description
- `docs/architecture.md` — to understand component structure
- `docs/conventions.md` — to understand current patterns
- Source code in the affected scope (uses `--scope` or analyzes full codebase)

**Agent produces: `docs/refactors/REF-{NNN}/scope.md`**

Content:
- **Refactor Summary** — what is being changed and why
- **Blast Radius** — complete list of files, modules, and components affected
- **Pattern Inventory** — count of each pattern instance that needs migration (e.g., "47 Express route handlers across 12 files")
- **Risk Assessment** — what could go wrong, breaking change potential
- **Compatibility Concerns** — API consumers, downstream dependencies, database migrations
- **Estimated Effort** — S/M/L/XL based on file count and complexity

### 6. Migration Architect

**Agent reads:**
- `docs/refactors/REF-{NNN}/scope.md`
- `docs/architecture.md`
- `docs/conventions.md`
- Target framework/pattern documentation (if the user provides links)

**Agent produces: `docs/refactors/REF-{NNN}/plan.md`**

Content:
- **Migration Strategy** — big-bang vs incremental vs strangler fig
- **Step-by-Step Approach** — ordered phases for the migration
- **Coexistence Plan** — how old and new patterns coexist during migration
- **Compatibility Layer** — adapter patterns needed during transition
- **Verification Strategy** — how to verify each step (tests, canary, etc.)
- **Rollback Plan** — how to undo if something goes wrong

### 7. Story Generation

After the migration plan is approved, stories are generated using the scoped solve mechanism (similar to `/sniper-feature` Phase 3):
- Read the migration plan
- Generate 3-12 stories under `docs/refactors/REF-{NNN}/stories/`
- Stories follow the migration order from the plan
- Each story handles one logical migration step

### 8. Sprint Integration (Phase 3: Execution)

Refactor stories reuse the standard sprint infrastructure with these adjustments (same pattern as `/sniper-feature`):

1. **Story source:** Read stories from `docs/refactors/REF-{NNN}/stories/` instead of `docs/stories/`.
2. **State tracking:** Does NOT increment `state.current_sprint`. Updates `state.refactors[].stories_complete`.
3. **Team naming:** Team is named `sniper-refactor-sprint-{refactor_id}`.
4. **Architecture context:** Include migration plan (`docs/refactors/REF-{NNN}/plan.md`) in spawn prompts.
5. **On completion:** If all stories complete, optionally update `docs/conventions.md` to reflect new patterns.

### 9. `/sniper-status` Integration

Status should show active refactors:

```
Active Refactors:
  REF-001  Migrate to Fastify       in-progress (3/7 stories done)
  REF-002  Replace class components  planning

Completed Refactors:
  REF-003  Upgrade to TypeScript 5   completed 2026-02-18 (5 stories)
```

**phase_log entries:** Refactor sprints append to `state.phase_log` with `context: "refactor-sprint-REF-{NNN}"`. Scoping and planning phases do NOT write to phase_log — tracked in `state.refactors[]`.

**Resume behavior:** `--resume REF-{NNN}` reads the refactor's current status and restarts from the beginning of that phase.

**Cancel behavior:** If the user cancels at any checkpoint, the refactor stays in its current status.

### 10. Orchestration Flow

```
Step 1: Assign refactor ID (REF-{NNN})
Step 2: Run impact analysis (single agent → scope.md)
Step 3: Present scope → "Review impact analysis. Continue to planning? (yes/edit/cancel)"
Step 4: Run migration planning (single agent → plan.md)
Step 5: Present plan → "Review migration plan. Generate stories? (yes/edit/cancel)"
Step 6: Generate stories (scoped solve → stories/)
Step 7: Present stories → "Review stories. Start refactoring sprint? (yes/edit/cancel)"
Step 8: Run sprint (standard sprint infrastructure with refactor stories)
Step 9: On completion, update conventions.md if patterns changed
Step 10: Update refactor status to complete
```

### 11. New Persona Files

**`personas/process/impact-analyst.md`**
Role: Blast radius analyst. Methodically inventory every instance of a pattern, every consumer of an API, every downstream dependency. Think like a safety engineer assessing change impact. Miss nothing.

**`personas/process/migration-architect.md`**
Role: Migration strategy designer. Design safe, incremental migration paths with coexistence, compatibility layers, and rollback plans. Think like a bridge engineer — the old and new must coexist safely during transition.

### 12. New Templates

**`templates/refactor-scope.md`** — Impact analysis with blast radius, pattern inventory, risk assessment, compatibility concerns.

**`templates/migration-plan.md`** — Step-by-step migration plan with strategy, coexistence, verification, and rollback.

## Acceptance Criteria

1. **Given** `/sniper-audit --target refactor "Migrate to Fastify"`, **When** the command starts, **Then** it runs impact analysis and produces a scope doc.

2. **Given** a scope doc showing 47 route handlers across 12 files, **When** the migration architect runs, **Then** the plan addresses all 47 handlers with a clear migration order.

3. **Given** a completed migration plan, **When** stories are generated, **Then** they follow the migration order and each story handles one logical step.

4. **Given** a completed refactor, **When** conventions.md exists, **Then** it is updated to reflect the new patterns.

## Implementation Scope

### In Scope
- `/sniper-audit --target refactor` command logic
- Refactor numbering and directory creation
- 2 new persona files (impact-analyst, migration-architect)
- 2 new templates (refactor-scope, migration-plan)
- Refactor review checklist
- Story generation for refactors
- Sprint execution for refactors
- Config state tracking for refactors
- `--scope`, `--list`, `--resume` flags

### Out of Scope
- Automated code transformation (AST-based codemods)
- Automated dependency upgrade (e.g., running npm update)
- Multi-repo refactoring coordination
- Performance benchmarking before/after refactor

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-audit.md` | NEW — umbrella audit command (shared by all audit targets) |
| `packages/core/framework/teams/refactor.yaml` | NEW — team composition |
| `packages/core/framework/personas/process/impact-analyst.md` | NEW — persona |
| `packages/core/framework/personas/process/migration-architect.md` | NEW — persona |
| `packages/core/framework/templates/refactor-scope.md` | NEW — template |
| `packages/core/framework/templates/migration-plan.md` | NEW — template |
| `packages/core/framework/checklists/refactor-review.md` | NEW — checklist |
| `packages/core/framework/commands/sniper-status.md` | Update to show refactors |
| `packages/core/framework/config.template.yaml` | Add `refactor_counter` and `refactors` array |
