# Protocol Phase Reorder — PRD-First Lifecycle

**Status:** Draft
**Date:** 2026-03-07
**Scope:** `packages/core/protocols/`, `packages/core/checklists/`, `packages/core/skills/sniper-flow/`, `packages/core/agents/`

## Problem

The current `full` protocol runs discovery (producing a "spec") before planning (producing architecture + PRD). This is inverted from how real projects work:

1. **You can't architect before you've defined requirements.** The PRD defines *what* to build; architecture defines *how*. Currently the architect and PM run concurrently in the `plan` phase, with a coordination note that "architecture must be finalized before PRD is updated" — but this fights the natural dependency.

2. **The highest-leverage review point is scope, not architecture.** The PRD review is where you say "no" to things and kill scope creep. Architecture review catches technical risks. They serve different purposes but the PRD gate matters more for project success.

3. **"spec.md" naming is misleading.** The discover phase produces research/analysis output but calls it a "spec," implying design decisions have been made when all that's happened is landscape analysis.

4. **Story sharding has no human gate.** Bad story decomposition causes more implementation pain than bad architecture. The `solve` phase has `human_approval: false` — reviewing 8 stories takes 5 minutes and saves hours of rework.

## Design

### New Full Protocol Phases

```
discover → define → design → solve → implement → review → retro → curate
```

| # | Phase | What it does | Agents | Strategy | Human Gate |
|---|-------|-------------|--------|----------|------------|
| 1 | **discover** | Research problem space, analyze codebase, identify constraints | analyst | single | interactive_review + human_approval |
| 2 | **define** | Write PRD: requirements, success criteria, scope boundaries, out-of-scope | product-manager | single | interactive_review + human_approval |
| 3 | **design** | Architecture plan designed *against* approved PRD | architect | single | interactive_review + human_approval |
| 4 | **solve** | Shard approved architecture into stories | product-manager | single | human_approval |
| 5 | **implement** | Build it | fullstack-dev, qa-engineer | team | plan_approval per agent |
| 6 | **review** | Code review + spec reconciliation | code-reviewer | single | human_approval |
| 7 | **retro** | Extract learnings, update velocity | retro-analyst | single | — |
| 8 | **curate** | Consolidate learnings (conditional) | memory-curator | single | — |

### Key Changes from Current

| Change | Current | New | Why |
|--------|---------|-----|-----|
| PRD before architecture | plan phase: architect + PM concurrent | define (PM) → design (architect) sequential phases | Can't design without knowing requirements |
| Architect and PM decoupled | Same phase, team spawn, coordination hack | Separate phases, each single-agent | Eliminates coordination complexity, natural dependency |
| Stories get human review | solve: `human_approval: false` | solve: `human_approval: true` | Bad decomposition causes expensive rework |
| Discovery output renamed | `spec.md` | `discovery-brief.md` | Reflects what it actually is — research, not design |
| Define is the key gate | plan interactive_review treated same as discover | define gets `interactive_review: true` + `human_approval: true` | This is where scope gets locked |

### Cascade to Other Protocols

**`feature` protocol** — Same principle applies at smaller scale:
```
Current:  plan (architect + PM sequential) → solve → implement → review → retro
New:      define → design → solve → implement → review → retro
```
The feature protocol already runs architect and PM sequentially, so this is mostly a rename + split into explicit phases with independent gates.

**`refactor` protocol** — No change needed. It has `analyze → implement → review → retro` which is correct (refactors don't need a PRD — the problem is already well-defined).

**`patch`, `hotfix`, `explore`, `ingest`** — No changes. These are correctly scoped already.

---

## Implementation Plan

### Phase 1: Rename Discovery Output

**Files:**
- `packages/core/agents/analyst.md`
- `packages/core/checklists/discover.yaml`
- `packages/core/protocols/full.yaml`
- `packages/core/protocols/ingest.yaml` (uses same discover checklist)
- `packages/core/skills/sniper-flow/SKILL.md`

**Changes:**
1. In `analyst.md`: rename output artifact from `spec.md` to `discovery-brief.md`. Update all references in the agent prompt. The discovery brief should explicitly frame itself as research output, not a specification. Keep `codebase-overview.md` as-is.
2. In `discover.yaml` checklist: update `spec_produced` check to look for `discovery-brief.md` instead of `spec.md`. Update `scope_defined` to check for `## Findings` or `## Requirements` (both valid). Keep `out_of_scope_explicit` as-is (still valuable at discovery stage).
3. In `full.yaml`: update outputs list from `spec.md` to `discovery-brief.md`.
4. In `ingest.yaml`: the `document` phase also produces `spec.md` — leave this as-is since ingest is specifically about producing a spec of an existing codebase. But update the `scan` phase if it references spec.md.
5. In `SKILL.md`: update the interactive review reference for discover phase — summary should present "findings and constraints" not "spec."

### Phase 2: Split Plan Phase into Define + Design

**Files:**
- `packages/core/protocols/full.yaml`

**Changes:**
1. Replace the current `plan` phase with two new phases:

```yaml
- name: define
  description: Product requirements — what to build, success criteria, scope boundaries
  agents:
    - product-manager
  spawn_strategy: single
  interactive_review: true
  gate:
    checklist: define
    human_approval: true
  outputs:
    - .sniper/artifacts/{protocol_id}/prd.md

- name: design
  description: Architecture design against approved PRD requirements
  agents:
    - architect
  spawn_strategy: single
  interactive_review: true
  gate:
    checklist: design
    human_approval: true
  outputs:
    - .sniper/artifacts/{protocol_id}/plan.md
```

2. Remove the `coordination` block (no longer needed — sequential phases handle dependency naturally).

### Phase 3: Add Human Gate to Solve

**File:** `packages/core/protocols/full.yaml`

**Change:** Set `human_approval: true` on the solve phase gate.

```yaml
- name: solve
  description: Epic sharding and story creation from approved architecture
  agents:
    - product-manager
  spawn_strategy: single
  gate:
    checklist: solve
    human_approval: true  # Changed from false
  outputs:
    - .sniper/artifacts/{protocol_id}/stories/
```

### Phase 4: Create New Checklists

**New file:** `packages/core/checklists/define.yaml`

```yaml
name: define
description: PRD quality gate — requirements completeness and scope clarity
checks:
  - id: prd_produced
    description: PRD document exists
    type: file_exists
    path: .sniper/artifacts/{protocol_id}/prd.md
    blocking: true

  - id: requirements_defined
    description: PRD has a Requirements section
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/prd.md
    pattern: "## Requirements"
    blocking: true

  - id: success_criteria_defined
    description: PRD has measurable success criteria
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/prd.md
    pattern: "## Success Criteria"
    blocking: true

  - id: scope_boundaries
    description: PRD explicitly defines what's out of scope
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/prd.md
    pattern: "## Out of Scope"
    blocking: true  # Out of scope must be explicit — this is where scope creep dies

  - id: token_budget
    description: PRD is concise (under 12000 chars)
    type: file_max_chars
    path: .sniper/artifacts/{protocol_id}/prd.md
    max_chars: 12000
    blocking: false
```

**New file:** `packages/core/checklists/design.yaml`

```yaml
name: design
description: Architecture quality gate — design completeness
checks:
  - id: plan_produced
    description: Architecture plan exists
    type: file_exists
    path: .sniper/artifacts/{protocol_id}/plan.md
    blocking: true

  - id: has_context_section
    description: Plan includes context and constraints
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/plan.md
    pattern: "## Context"
    blocking: true

  - id: has_decisions_section
    description: Plan documents key architectural decisions
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/plan.md
    pattern: "## Decisions"
    blocking: true

  - id: has_components_section
    description: Plan breaks down into components
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/plan.md
    pattern: "## Components"
    blocking: true

  - id: has_data_model_section
    description: Plan defines data model
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/plan.md
    pattern: "## Data Model"
    blocking: true

  - id: references_prd
    description: Plan references the approved PRD
    type: file_contains
    path: .sniper/artifacts/{protocol_id}/plan.md
    pattern: "prd.md"
    blocking: false

  - id: open_questions
    description: No unresolved questions remain
    type: file_not_contains
    path: .sniper/artifacts/{protocol_id}/plan.md
    pattern: "(TBD|TODO|OPEN|\\?\\?)"
    blocking: false

  - id: token_budget
    description: Plan is concise (under 16000 chars)
    type: file_max_chars
    path: .sniper/artifacts/{protocol_id}/plan.md
    max_chars: 16000
    blocking: false
```

**Retire:** `packages/core/checklists/plan.yaml` — no longer referenced by any protocol. Keep the file but add a deprecation notice at the top for backward compat with custom protocols.

### Phase 5: Update Feature Protocol

**File:** `packages/core/protocols/feature.yaml`

**Changes:**
1. Replace `plan` phase (currently architect → PM sequential) with `define` + `design` phases, mirroring the full protocol structure but with smaller budgets.
2. Add `human_approval: true` to solve phase.

```yaml
phases:
  - name: define
    description: Product requirements for the feature
    agents:
      - product-manager
    spawn_strategy: single
    interactive_review: true
    gate:
      checklist: define
      human_approval: true
    outputs:
      - .sniper/artifacts/{protocol_id}/prd.md

  - name: design
    description: Technical design against approved requirements
    agents:
      - architect
    spawn_strategy: single
    interactive_review: true
    gate:
      checklist: design
      human_approval: true
    outputs:
      - .sniper/artifacts/{protocol_id}/plan.md

  - name: solve
    # ... existing, but with human_approval: true

  - name: implement
    # ... unchanged

  - name: review
    # ... unchanged

  - name: retro
    # ... unchanged
```

### Phase 6: Update SKILL.md

**File:** `packages/core/skills/sniper-flow/SKILL.md`

**Changes:**
1. Update the Interactive Review reference to include the new phases:
   - **discover:** findings, constraints, codebase landscape, open questions
   - **define:** requirements, success criteria, scope boundaries, out-of-scope items
   - **design:** key architectural decisions, component overview, data model, trade-offs
   - **solve:** story list, dependencies, acceptance criteria summary
2. No changes to the execution loop logic — it's already protocol-driven and will pick up the new phases from the YAML.

### Phase 7: Update Product Manager Agent

**File:** `packages/core/agents/product-manager.md`

**Changes:**
1. The PM agent currently expects to run alongside the architect. Update the prompt to clarify that the PM runs *before* the architect in full/feature protocols.
2. Add instruction: "Read the discovery brief (`.sniper/artifacts/discovery-brief.md`) as input when producing the PRD."
3. Add instruction: "The PRD must include a `## Out of Scope` section. This is not optional."
4. Remove any references to coordinating with the architect during PRD writing (they're now in separate phases).

### Phase 8: Update Architect Agent

**File:** `packages/core/agents/architect.md`

**Changes:**
1. Add instruction: "Read the approved PRD (`.sniper/artifacts/{protocol_id}/prd.md`) as your primary input. Design against these requirements — do not add requirements."
2. Add instruction: "Reference the PRD in your plan document."
3. The architect already works independently; minimal changes needed here.

---

## Migration & Backward Compatibility

- **Custom protocols using `plan` phase:** The `plan.yaml` checklist remains available (deprecated). Custom protocols referencing it will continue to work.
- **Existing `.sniper/artifacts/spec.md` files:** The analyst agent will write to `discovery-brief.md` going forward. Old `spec.md` files are untouched. The `ingest` protocol's `document` phase continues to produce `spec.md` (correct for that use case).
- **No config changes:** `.sniper/config.yaml` doesn't reference phase names directly — it references agents, commands, and ownership. No user config migration needed.
- **No CLI changes:** The CLI doesn't know about phases — it delegates to `/sniper-flow` which reads protocol YAML. No CLI code changes needed.

## Implementation Order

Phases 1-6 can be implemented as a single changeset since they're all in `packages/core` (no build step). The changes are:

- 3 modified YAML files (full.yaml, feature.yaml, discover.yaml)
- 2 new YAML files (define.yaml, design.yaml)
- 1 deprecated YAML file (plan.yaml — add notice)
- 2 modified agent files (analyst.md, product-manager.md, architect.md)
- 1 modified skill file (SKILL.md)

Total: ~10 files, all Markdown/YAML, no build impact.

## Risks

| Risk | Mitigation |
|------|------------|
| Adding a phase increases total protocol duration | define + design as single-agent phases are fast; current team-spawn plan phase has coordination overhead that's eliminated |
| More human gates = more friction | Each gate is reviewing a focused artifact (PRD alone, plan alone, stories alone) rather than a combined blob — faster to review |
| PM agent quality when running solo | PM already writes PRDs; removing architect coordination simplifies its job |
| Breaking custom protocols that reference `plan` phase | plan.yaml checklist preserved with deprecation notice |
