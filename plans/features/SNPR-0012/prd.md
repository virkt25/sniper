# SNPR-0012: Agent Memory & Learning

> **Status:** Draft
> **Phase:** D — Advanced
> **Dependencies:** None (operates alongside existing framework infrastructure)
> **Soft Dependencies:** SNPR-0011 (domain packs provide a composition model that memory extends), SNPR-0013 (workspace-level memory requires multi-project orchestration)

## Problem Statement

SNIPER agent teams today are stateless across sessions. Every sprint starts from zero context — agents re-discover patterns, repeat mistakes, and have no awareness of conventions that emerged from prior work. This creates three problems:

1. **No learning from mistakes** — a review gate catches "raw SQL in route handlers" in Sprint 3. Sprint 4 agents have no memory of this and may repeat the same anti-pattern, wasting review cycles.
2. **Convention drift** — over multiple sprints, different agents make different style/pattern choices. Without a living memory of "we decided to use Zod for validation" or "all API responses use this envelope format," codebases accumulate inconsistencies.
3. **No knowledge transfer** — an organization running SNIPER across 10 projects learns the same lessons 10 times. "Our team always uses barrel exports" or "we prefer explicit error types over string messages" never propagates.
4. **Sprint retrospectives are manual** — after a sprint, there's no structured analysis of what patterns emerged, what review gates flagged, or what stories were underestimated. Learnings evaporate.

A memory system that accumulates knowledge, enforces conventions, and transfers learnings across projects and repositories would make SNIPER agent teams compound in quality over time.

## Solution Overview

A three-tier memory system that operates at project, workspace, and organization levels:

```
Tier 1 — Project Memory       .sniper/memory/         Per-repo conventions, anti-patterns, decisions
Tier 2 — Sprint Retrospectives  Automatic              Post-sprint analysis → memory updates
Tier 3 — Workspace Memory     sniper-workspace/memory/ Cross-repo conventions, shared learnings
```

Memory is **structured YAML** (machine-parseable, injected into spawn prompts) backed by **human-readable markdown summaries** (for developer review). The spawn prompt composer (`/sniper-compose`) treats memory as an additional persona layer — conventions and anti-patterns are injected into the right agents contextually.

## Detailed Requirements

### 1. Project Memory Store (`.sniper/memory/`)

Each project maintains a structured memory directory:

```
.sniper/memory/
├── conventions.yaml      # Codified patterns and standards
├── anti-patterns.yaml    # Known mistakes to avoid
├── decisions.yaml        # Architecture/design decisions with rationale
├── estimates.yaml        # Story estimation calibration data
└── summary.md            # Human-readable summary (auto-generated)
```

#### `conventions.yaml`

```yaml
conventions:
  - id: conv-001
    rule: "All API routes use Zod validation middleware"
    rationale: "Established in Sprint 2 after inconsistent validation caused 3 bugs"
    source:
      type: review_gate          # review_gate | retro | manual | imported
      ref: "sprint-2-review"
      date: "2026-02-15"
    applies_to:                  # Which agent roles receive this in their prompt
      - backend-engineer
      - api-designer
    enforcement: review_gate     # review_gate | spawn_prompt | both
    scope: project               # project | workspace
    examples:
      positive: "router.post('/users', validate(CreateUserSchema), handler)"
      negative: "router.post('/users', (req, res) => { /* manual validation */ })"

  - id: conv-002
    rule: "All React components use named exports, no default exports"
    rationale: "Improves IDE auto-import and grep-ability"
    source:
      type: manual
      ref: "developer-preference"
      date: "2026-02-10"
    applies_to:
      - frontend-engineer
    enforcement: both
```

#### `anti-patterns.yaml`

```yaml
anti_patterns:
  - id: ap-001
    description: "Direct database queries in route handlers"
    why_bad: "Violates separation of concerns, makes testing difficult, leads to query duplication"
    fix_pattern: "Use repository/service layer pattern"
    source:
      type: review_gate
      ref: "sprint-3-review"
      story: "STORY-042"
      date: "2026-02-18"
    detection_hint: "imports from prisma/drizzle/knex in files under routes/ or handlers/"
    applies_to:
      - backend-engineer
    severity: high               # high | medium | low

  - id: ap-002
    description: "Catching errors silently without logging"
    why_bad: "Makes debugging impossible in production"
    fix_pattern: "Always log caught errors with context before handling"
    source:
      type: retro
      ref: "sprint-4-retro"
      date: "2026-02-20"
    detection_hint: "catch blocks with empty bodies or only user-facing error returns"
    applies_to:
      - backend-engineer
      - frontend-engineer
    severity: medium
```

#### `decisions.yaml`

```yaml
decisions:
  - id: dec-001
    title: "Use PostgreSQL over MongoDB for primary datastore"
    context: "Relational data model with complex joins, ACID requirements"
    decision: "PostgreSQL with Drizzle ORM"
    alternatives_considered:
      - "MongoDB — rejected due to relational query complexity"
      - "MySQL — viable but team has more PG experience"
    source:
      type: review_gate
      ref: "plan-review"
      date: "2026-02-12"
    applies_to:
      - backend-engineer
      - architect
    status: active               # active | superseded | deprecated
    superseded_by: null
```

#### `estimates.yaml`

```yaml
calibration:
  velocity_factor: 0.85          # stories take ~15% longer than estimated
  common_underestimates:
    - pattern: "Stories involving auth/permission changes"
      typical_miss: "+40%"
      reason: "Testing matrix for permission combinations is larger than expected"
    - pattern: "Stories with database migrations"
      typical_miss: "+25%"
      reason: "Rollback scripts and data migration testing add time"
  last_updated: "2026-02-20"
  sprints_analyzed: 4
```

### 2. Memory Injection into Spawn Prompts

The spawn prompt composer (`/sniper-compose`) gains a `memory` layer:

```
Spawn Prompt = Role Persona + Cognitive Persona + Process Persona + Domain Knowledge + Memory Layer
```

**Memory layer composition:**
1. Filter conventions where `applies_to` includes the target agent's role
2. Filter anti-patterns where `applies_to` includes the target agent's role
3. Include relevant decisions for context
4. Format as a structured section in the spawn prompt

**Example injected memory section:**

```markdown
## Project Memory — Conventions You Must Follow

- **conv-001:** All API routes use Zod validation middleware.
  Example: `router.post('/users', validate(CreateUserSchema), handler)`
  NOT: `router.post('/users', (req, res) => { /* manual validation */ })`

- **conv-002:** Use named exports, no default exports for React components.

## Anti-Patterns — Do NOT Do These

- **ap-001 (HIGH):** No direct database queries in route handlers. Use repository/service layer.
- **ap-002 (MEDIUM):** Never catch errors silently. Always log with context.

## Key Decisions

- **dec-001:** PostgreSQL with Drizzle ORM is the primary datastore (not MongoDB).
```

**Size management:**
- If the memory layer exceeds 2000 tokens, prioritize: high-severity anti-patterns → conventions with `enforcement: both` → decisions → low-severity items
- The summary is truncated, not the source YAML — agents can reference the full YAML if needed

### 3. Sprint Retrospectives (Automatic Learning)

After each `/sniper-sprint` completes and passes `/sniper-review`, a **retro agent** runs automatically:

**Retro agent responsibilities:**
1. **Pattern analysis** — scan the code produced in the sprint for recurring patterns (both good and concerning)
2. **Review gate analysis** — examine what the review gate flagged (failures become anti-pattern candidates)
3. **Convention extraction** — identify new conventions that emerged (e.g., all new files use a consistent import ordering)
4. **Estimation analysis** — compare story point estimates to actual complexity (measured by files changed, lines of code, number of review iterations)

**Retro output:**

```yaml
# .sniper/memory/retros/sprint-{N}-retro.yaml
sprint: 5
date: "2026-02-22"
stories_completed: 8
stories_carried_over: 1

findings:
  new_conventions:
    - rule: "All service functions return Result<T, AppError> instead of throwing"
      confidence: high            # high | medium — based on consistency across stories
      evidence: "7 of 8 stories followed this pattern"
      recommendation: codify      # codify | monitor | ignore
      applies_to: [backend-engineer]

  new_anti_patterns:
    - description: "Using `any` type for API response bodies"
      occurrences: 3
      stories: ["STORY-051", "STORY-055", "STORY-058"]
      recommendation: codify
      severity: medium
      applies_to: [backend-engineer, frontend-engineer]

  review_gate_failures:
    - check: "Error handling completeness"
      failures: 2
      pattern: "Missing error handling in webhook delivery retry logic"
      already_tracked: false       # is this already in anti-patterns?

  estimation_calibration:
    overestimates: ["STORY-052"]   # finished faster than expected
    underestimates: ["STORY-054", "STORY-057"]
    patterns:
      - "Stories involving external API integration consistently underestimated by ~30%"

  positive_patterns:
    - "Consistent use of dependency injection across all new services"
    - "All new endpoints have corresponding integration tests"
```

**Memory update flow:**
1. Retro agent produces findings
2. Findings with `recommendation: codify` and `confidence: high` are **auto-added** to conventions/anti-patterns YAML
3. Findings with `confidence: medium` are added with a `status: candidate` flag — they require one more occurrence to be promoted
4. `summary.md` is regenerated
5. User is shown a retro summary and can override any auto-additions

### 4. Memory Management Commands

**New command: `/sniper-memory`**

```bash
/sniper-memory                    # Show memory summary
/sniper-memory --conventions      # List all conventions
/sniper-memory --anti-patterns    # List all anti-patterns
/sniper-memory --decisions        # List all decisions
/sniper-memory --add convention "Use barrel exports for all module directories"
/sniper-memory --add anti-pattern "Nested ternaries deeper than 2 levels"
/sniper-memory --add decision "Use React Query for server state" --rationale "..."
/sniper-memory --remove conv-003  # Remove a memory entry
/sniper-memory --promote ap-003   # Promote candidate to confirmed
/sniper-memory --export           # Export memory as a portable pack
/sniper-memory --import memory-pack.yaml  # Import from another project
/sniper-memory --retro            # Manually trigger a retrospective
```

### 5. Review Gate Integration

Review gates gain memory-aware checks:

1. **Convention compliance** — for each convention with `enforcement: review_gate` or `enforcement: both`, verify the sprint output doesn't violate it
2. **Anti-pattern scanning** — for each anti-pattern, check `detection_hint` against the codebase changes
3. **Decision consistency** — flag if new code contradicts a recorded decision (e.g., importing MongoDB when dec-001 says PostgreSQL)

Review gate output includes a memory section:

```
## Memory Compliance

### Convention Checks
✅ conv-001: Zod validation — all 4 new routes use validation middleware
✅ conv-002: Named exports — all 12 new components use named exports
⚠️  conv-003: Barrel exports — 2 new directories missing index.ts (services/auth/, utils/crypto/)

### Anti-Pattern Checks
✅ ap-001: No direct DB queries in handlers — clean
⚠️  ap-002: Silent error catch found in lib/webhook-delivery.ts:42

### Decision Consistency
✅ All decisions consistent
```

### 6. Workspace-Level Memory

When operating within a SNPR-0013 workspace, memory operates at two levels:

```
sniper-workspace/
├── memory/                       # Workspace-wide memory
│   ├── conventions.yaml          # Cross-repo conventions
│   ├── anti-patterns.yaml        # Cross-repo anti-patterns
│   ├── decisions.yaml            # Architecture decisions spanning repos
│   └── contracts.yaml            # Interface contracts (see SNPR-0013)
└── repositories/
    ├── api-service/
    │   └── .sniper/memory/       # Repo-specific memory
    ├── web-app/
    │   └── .sniper/memory/       # Repo-specific memory
    └── shared-lib/
        └── .sniper/memory/       # Repo-specific memory
```

**Memory inheritance:**
- Workspace conventions apply to ALL repos unless overridden
- Repo-specific conventions apply only to that repo
- If a repo convention contradicts a workspace convention, the repo convention wins (with a warning)
- Anti-patterns are additive — both workspace and repo anti-patterns are checked
- Decisions can be scoped to workspace (cross-cutting) or repo (local)

**Cross-repo learning:**
- When a retro in `api-service` discovers a convention, the retro agent checks if it's relevant to other repos
- If a pattern applies broadly (e.g., "all TypeScript projects use strict mode"), it's promoted to workspace memory
- The promotion requires user confirmation

**Spawn prompt injection for workspace memory:**
- Agents receive workspace conventions + repo-specific conventions
- Workspace conventions are labeled `[WORKSPACE]` to distinguish from repo-local ones

### 7. Memory Export/Import (Knowledge Transfer)

Memory can be exported as a portable YAML file for transfer between projects or organizations:

```yaml
# exported-memory.yaml
exported_from: "my-saas-api"
exported_at: "2026-02-22"
version: "1.0"

conventions:
  - rule: "Use barrel exports for all module directories"
    applies_to: [backend-engineer, frontend-engineer]
    enforcement: review_gate
    # source and project-specific fields stripped

anti_patterns:
  - description: "Direct database queries in route handlers"
    fix_pattern: "Use repository/service layer pattern"
    severity: high
    applies_to: [backend-engineer]

decisions: []   # decisions are typically project-specific, excluded by default
```

**Import behavior:**
- Imported entries get `source.type: imported` and `source.ref: "exported-memory.yaml"`
- Imported entries start as `status: candidate` — they must be confirmed by the user or by a review gate finding before becoming active
- No duplicate detection by content similarity (exact ID matches are skipped)

## Acceptance Criteria

1. **Given** a project with conventions in `.sniper/memory/conventions.yaml`, **When** `/sniper-compose` creates a spawn prompt for a backend-engineer, **Then** the prompt includes all conventions where `applies_to` includes `backend-engineer`.

2. **Given** a sprint that completes and passes review, **When** the retro agent runs, **Then** it produces a structured retro YAML with findings categorized as new conventions, anti-patterns, review gate failures, and estimation calibration.

3. **Given** a retro finding with `recommendation: codify` and `confidence: high`, **When** the retro completes, **Then** the finding is automatically added to the appropriate memory YAML.

4. **Given** conventions with `enforcement: review_gate`, **When** `/sniper-review` runs, **Then** the review gate checks convention compliance and reports violations.

5. **Given** a workspace with memory at both workspace and repo levels, **When** agents are spawned in a repo, **Then** they receive both workspace-level and repo-level memory in their prompts.

6. **Given** `/sniper-memory --export`, **When** the export runs, **Then** it produces a portable YAML file with project-specific metadata stripped.

7. **Given** `/sniper-memory --import pack.yaml`, **When** the import runs, **Then** entries are added as candidates requiring confirmation.

8. **Given** a memory layer exceeding 2000 tokens, **When** injected into a spawn prompt, **Then** it is truncated by priority (high-severity anti-patterns first, then enforced conventions, then decisions).

## Implementation Scope

### In Scope
- Memory YAML schema (conventions, anti-patterns, decisions, estimates)
- Memory directory structure (`.sniper/memory/`)
- Spawn prompt memory injection via `/sniper-compose`
- Automatic sprint retrospective agent
- Retro-to-memory pipeline (auto-codify high-confidence findings)
- `/sniper-memory` command (list, add, remove, promote, export, import)
- Review gate memory compliance checks
- Workspace-level memory (shared across repos)
- Memory inheritance and override rules
- `summary.md` auto-generation
- Memory size management (token-aware truncation)

### Out of Scope
- AI-powered semantic duplicate detection (use exact matching only)
- Memory versioning / history (memory files are tracked by git)
- Memory conflict resolution UI (use CLI flags)
- Organization-level memory registry (handle via export/import)
- Automated memory pruning (manual via `/sniper-memory --remove`)
- Memory analytics dashboard
- Integration with external knowledge bases (Notion, Confluence, etc.)

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-memory.md` | NEW — `/sniper-memory` command definition |
| `packages/core/framework/commands/sniper-compose.md` | UPDATE — add memory layer to composition pipeline |
| `packages/core/framework/commands/sniper-review.md` | UPDATE — add memory compliance checks to review gates |
| `packages/core/framework/commands/sniper-sprint.md` | UPDATE — trigger retro agent after sprint completion |
| `packages/core/framework/commands/sniper-status.md` | UPDATE — show memory stats |
| `packages/core/framework/personas/process/retro-analyst.md` | NEW — retro agent persona |
| `packages/core/framework/teams/retro.yaml` | NEW — retro team composition (single agent) |
| `packages/core/framework/templates/retro.yaml` | NEW — retro output template |
| `packages/core/framework/templates/memory-convention.yaml` | NEW — convention entry template |
| `packages/core/framework/templates/memory-anti-pattern.yaml` | NEW — anti-pattern entry template |
| `packages/core/framework/templates/memory-decision.yaml` | NEW — decision entry template |
| `packages/core/framework/config.template.yaml` | UPDATE — add memory configuration section |
| `packages/cli/src/commands/memory.ts` | NEW — CLI `sniper memory` command |
| `packages/cli/src/scaffolder/` | UPDATE — scaffold `.sniper/memory/` directory during init |
