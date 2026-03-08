# SNIPER Self-Learning System

> **Date**: 2026-03-07
> **Status**: Draft
> **Branch**: `feat/self-learning-system`

---

## Problem Statement

SNIPER's current memory system has three disconnected stores that don't form a feedback loop:

| Store | Writes to | Reads from | Lifecycle |
|-------|-----------|------------|-----------|
| `.sniper/memory/signals/` | Hooks (CI failures, PR comments) | Agent Composition (Layer 5) | None — accumulates forever |
| `.sniper/retros/{id}.yaml` | retro-analyst | **Nothing** | None — dead on arrival |
| `.sniper/memory/velocity.yaml` | retro-analyst | Budget calibration | Append-only |

**Specific failures:**

1. **Retro never runs** — it's step 6 of 6 in Protocol Completion, a soft instruction that Claude drops after the summary feels like the natural endpoint. No enforcement mechanism.
2. **Retro learnings are write-only** — `findings.action_items` and `needs_improvement` are written to `.sniper/retros/` but nothing ever reads them back into agent prompts.
3. **No human feedback path** — when a user rejects a sprint or reports a bug, there's no mechanism to capture _why_ and feed it into future runs.
4. **No learning invalidation** — signals and learnings persist forever. A learning about "always use Express middleware" stays active even after the project migrates to Fastify.
5. **No effectiveness tracking** — no way to know if a learning actually prevented the problem from recurring.
6. **No consolidation** — 50 signal files accumulate, many saying the same thing, diluting the useful ones.

---

## Design: Unified Learning Store

Replace signals + retro findings with a single store: `.sniper/memory/learnings/`. Velocity data stays separate (quantitative, not a "learning").

### The Learning Record

Each learning is a YAML file in `.sniper/memory/learnings/`:

```yaml
# .sniper/memory/learnings/L-20260307-a3f2.yaml
id: L-20260307-a3f2
status: active                        # draft | active | validated | deprecated
confidence: 0.7                       # 0.0–1.0, changes over time
created_at: 2026-03-07T10:00:00Z
updated_at: 2026-03-07T15:00:00Z
expires_at: 2026-06-07T10:00:00Z      # null = never

# Origin
source:
  type: retro                          # retro | human | ci_failure | pr_review | gate_failure
  protocol_id: SNPR-20260307-c1a9     # null for human-submitted
  detail: "Gate failed twice — agents wrote integration tests as unit tests"

# The learning itself
learning: "When stories specify 'integration tests', test against real API routes, not mock handlers"
anti_pattern: "Mocking the handler layer in tests labeled as 'integration'"
correction: "Use supertest/request against the running server for integration tests"

# Who should see this
scope:
  agents: [qa-engineer, fullstack-dev]  # null = all agents
  phases: [implement]                   # null = all phases
  files: ["src/tests/**"]              # glob patterns, null = all files

# Effectiveness tracking
applied_in: []                          # protocol IDs where this was composed into prompts
reinforced_by: []                       # events/learning IDs that confirm this
contradicted_by: []                     # learning IDs that contradict this
superseded_by: null                     # if deprecated, which learning replaced it

# Audit trail
history:
  - timestamp: 2026-03-07T10:00:00Z
    event: created
    actor: retro-analyst
  - timestamp: 2026-03-08T14:00:00Z
    event: reinforced
    detail: "Same pattern in SNPR-20260308-b1c4"
    confidence_delta: +0.1
```

### How Learnings Enter the System

There are five ingestion paths, each with a different starting confidence:

| Source | Trigger | Starting Confidence | Rationale |
|--------|---------|---------------------|-----------|
| **Human feedback** | `/sniper-learn`, review gate rejection annotation | 0.9 | Human said it explicitly |
| **Gate failure delta** | Gate fails then passes on retry — diff between attempts is the learning | 0.6 | Directly observed cause/fix |
| **Retro analysis** | retro-analyst extracts patterns from checkpoints and gate results | 0.5 | Inferred, not directly observed |
| **CI/hook signals** | Self-healing hook catches test/lint failure | 0.4 | Noisy, needs reinforcement |
| **PR review comments** | Hook captures reviewer feedback | 0.4 | External, may not generalize |

### Confidence Dynamics

Confidence changes based on evidence over time:

| Event | Change |
|-------|--------|
| Same problem observed again (reinforcement) | +0.15 |
| Human explicitly confirms | → 0.9 |
| Human explicitly invalidates | → 0.0, status → `deprecated` |
| Applied in protocol, no related failure | +0.05 |
| Applied in protocol, related failure recurred | -0.2, flag for review |
| Contradicting learning created | -0.1 on the older learning |
| No activity for 90 days | -0.05 per month (time decay) |
| Spec/architecture changed (detected via git diff) | flag for review, no auto-change |

When confidence drops below **0.2**, the learning is auto-deprecated.

### Learning Composition into Agent Prompts

Replace the current "top 10 signals by relevance" (Layer 5 in Agent Composition) with scoped, confidence-ranked selection:

```
Filter: status IN (active, validated), confidence >= 0.4
Match:  scope.agents includes <current_agent> OR scope.agents is null
Match:  scope.phases includes <current_phase> OR scope.phases is null
Match:  scope.files overlaps with <agent_ownership_paths> OR scope.files is null
Rank:   confidence DESC, updated_at DESC
Limit:  10
```

Composed into the agent prompt as:

```markdown
## Learnings

- [HIGH] When stories specify 'integration tests', test against real API routes, not mock handlers.
  Anti-pattern: Mocking the handler layer in tests labeled as 'integration'.
  Instead: Use supertest/request against the running server.

- [MEDIUM] API error responses must include a `code` field for client-side error handling.
```

Confidence bands: `>= 0.7` = HIGH, `0.4–0.7` = MEDIUM. Below 0.4 is excluded.

When a learning is composed into a prompt, record the protocol ID in `applied_in` for effectiveness tracking.

### Learning Review: The Memory Curator

A new agent, **memory-curator**, handles the lifecycle of learnings. It runs:

- As an optional `curate` phase in protocols (after retro)
- On-demand via `/sniper-learn --review`
- Automatically when active learning count exceeds 30

**Curator responsibilities:**

1. **Consolidation** — merge learnings that describe the same pattern. Five CI failure signals about "missing error handling in API routes" become one learning with boosted confidence.

2. **Contradiction detection** — if learning A says "always use mocks" and learning B says "never mock integration tests", flag the conflict. If both are high-confidence, present to user for resolution.

3. **Staleness check** — learnings not applied or reinforced in the last N protocols (default: 5) are flagged. The curator reads current spec/architecture and checks if the learning still applies.

4. **Spec drift detection** — when `docs/spec.md` or `docs/architecture.md` has changed since the learning was last updated, the curator reviews scoped learnings against the new spec. Learnings that no longer apply are flagged for deprecation.

5. **Pruning** — deprecated learnings older than 6 months are archived to `.sniper/memory/archive/`.

### Effectiveness Tracking

After each protocol completes, the retro-analyst performs a learning effectiveness check:

1. Read all learnings with `applied_in` containing the current protocol ID
2. For each, check if a related problem recurred:
   - Gate failures in the learning's scoped phase?
   - CI failures in the learning's scoped files?
   - Human rejection feedback mentioning the same pattern?
3. No recurrence → confidence +0.05, add to history as `validated_by_absence`
4. Recurrence despite the learning → confidence -0.2, add to history as `recurrence_detected`, flag for human review

---

## Implementation Plan

### Phase 1: Foundation — Learning Schema and Store

**Goal:** Define the learning record format and migrate existing signals.

#### 1a. Create learning schema

**New file:** `packages/core/schemas/learning.schema.yaml`

Define the schema based on the learning record format above. Required fields: `id`, `status`, `confidence`, `created_at`, `source`, `learning`. All other fields optional.

#### 1b. Create migration note for signals

**Edit:** `packages/core/schemas/signal.schema.yaml`

Add a deprecation notice at the top. The signal schema is superseded by the learning schema. Existing signal files in `.sniper/memory/signals/` will be consumed by the memory-curator and converted to learnings on first run.

#### 1c. Update sniper-init scaffolding

**Edit:** `packages/core/skills/sniper-init/SKILL.md`

Update the scaffold structure:
```
.sniper/
  memory/
    learnings/      ← NEW (replaces signals/)
    velocity.yaml
    archive/        ← NEW (for deprecated learnings)
  retros/           ← Keep for retro reports (they reference learnings now)
```

Keep `signals/` in scaffold for backward compat — the curator migrates them.

---

### Phase 2: Retro as a Real Phase

**Goal:** Make retro execution mandatory, not a skippable instruction.

#### 2a. Add retro phase to protocol YAMLs

**Edit:** `packages/core/protocols/full.yaml`, `feature.yaml`, `refactor.yaml`

Add after the final review phase:

```yaml
  - name: retro
    description: Retrospective — extract learnings, update velocity, check learning effectiveness
    agents:
      - retro-analyst
    spawn_strategy: single
    gate:
      checklist: retro
      human_approval: false
    outputs:
      - .sniper/retros/{protocol_id}.yaml
      - .sniper/memory/velocity.yaml
      - .sniper/memory/learnings/   # new learnings from this run
```

Remove `auto_retro: true` from these files.

#### 2b. Create retro checklist

**New file:** `packages/core/checklists/retro.yaml`

Minimal checklist (auto-pass gate):
- Retro report file exists at `.sniper/retros/{protocol_id}.yaml`
- Velocity data updated in `.sniper/memory/velocity.yaml`

#### 2c. Update sniper-flow Protocol Completion

**Edit:** `packages/core/skills/sniper-flow/SKILL.md`

Remove step 6 ("If `auto_retro: true`...") from Protocol Completion. Remove the "Reference: Retrospective" section. The retro is now just another phase in the loop — no special handling needed.

Add backward-compat fallback: "If the protocol has `auto_retro: true` but no `retro` phase in its phases list (custom protocols), spawn retro-analyst as a single-agent phase before completing."

#### 2d. Update protocol schema

**Edit:** `packages/core/schemas/protocol.schema.yaml`

Mark `auto_retro` as deprecated with a description noting that a `retro` phase is the preferred approach.

---

### Phase 3: Retro-Analyst Produces Learnings

**Goal:** retro-analyst writes to the learning store instead of (only) writing findings as inert text.

#### 3a. Update retro-analyst agent

**Edit:** `packages/core/agents/retro-analyst.md`

Add a new section: **"Learning Extraction"** (after the existing Analysis Process):

1. For each `action_item` in the retro findings, create a learning record:
   - `source.type: retro`, `source.protocol_id: {protocol_id}`
   - `confidence: 0.5`
   - `learning`: the action item text
   - `scope`: infer from context (which phase failed, which agents were involved, which files were touched)
   - Write to `.sniper/memory/learnings/L-{date}-{hash}.yaml`

2. For each `needs_improvement` item that is specific and actionable (not vague), create a learning at `confidence: 0.4`.

3. Cap at 5 learnings per retro to avoid noise.

Add a new section: **"Learning Effectiveness Check"**:

1. Read all active learnings where `applied_in` contains any recent protocol ID
2. Cross-reference with this protocol's gate results and CI signals
3. Update confidence per the dynamics table
4. Record in learning history

#### 3b. Update retro-analyst signal analysis

**Edit:** `packages/core/agents/retro-analyst.md`

Update the existing "Signal Analysis" section to also read `.sniper/memory/learnings/` and check for learnings that were applied but didn't prevent recurrence.

---

### Phase 4: Human Feedback Path

**Goal:** Humans can submit learnings directly and annotate review gate rejections.

#### 4a. Create /sniper-learn skill

**New file:** `packages/core/skills/sniper-learn/SKILL.md`

Three modes:

**Submit mode** (default): `/sniper-learn "Always validate JWT expiry before checking permissions"`
- Ask clarifying questions: which agents? which phases? which files?
- Create a learning record with `source.type: human`, `confidence: 0.9`
- Write to `.sniper/memory/learnings/`

**Review mode**: `/sniper-learn --review`
- Spawn memory-curator agent
- Present summary of active learnings, flagged items, and suggested deprecations
- User can confirm/reject each suggestion

**Deprecate mode**: `/sniper-learn --deprecate L-20260307-a3f2`
- Set learning status to `deprecated`, confidence to 0.0
- Record in history with `actor: human`

#### 4b. Capture feedback from review gate rejections

**Edit:** `packages/core/skills/sniper-flow/SKILL.md`

In the Interactive Review reference section, when the user selects "Request changes":

1. Ask: "What should be changed and why?"
2. Parse the response for actionable learnings
3. If the feedback describes a pattern (not just "fix line 42"), create a learning with `source.type: human`, `confidence: 0.9`
4. Include the learning in the agent prompt when the phase reruns

Also update `/sniper-review` and `/sniper-sprint` review gate sections similarly.

---

### Phase 5: Agent Composition Update

**Goal:** Replace flat signal composition with scoped, confidence-ranked learning composition.

#### 5a. Update Agent Composition reference

**Edit:** `packages/core/skills/sniper-flow/SKILL.md`

Replace Layer 5 in the composition table:

```
| 5. Learnings | .sniper/memory/learnings/ → scoped, confidence-ranked, top 10 | SKIP — no learnings |
```

Update the composition description:

```
Filter: status IN (active, validated), confidence >= 0.4
Match:  scope.agents includes <current_agent> OR null
Match:  scope.phases includes <current_phase> OR null
Match:  scope.files overlaps <ownership_paths> OR null
Rank:   confidence DESC, updated_at DESC
Limit:  10

Format: ## Learnings
- [HIGH] {learning}. Anti-pattern: {anti_pattern}. Instead: {correction}.
- [MEDIUM] {learning}.
```

After composition, record the protocol ID in each learning's `applied_in` array.

#### 5b. Backward compatibility for signals

If `.sniper/memory/signals/` contains files but `.sniper/memory/learnings/` is empty or doesn't exist, fall back to the old Layer 5 behavior (read signals). Log a warning: "Legacy signals detected. Run `/sniper-learn --review` to migrate."

---

### Phase 6: Memory Curator Agent

**Goal:** Periodic review, consolidation, and pruning of learnings.

#### 6a. Create memory-curator agent

**New file:** `packages/core/agents/memory-curator.md`

Responsibilities:

1. **Consolidation** — find learnings with overlapping `scope` and similar `learning` text. Merge into a single learning, sum reinforcement history, take highest confidence.

2. **Contradiction detection** — find learning pairs where `anti_pattern` of one matches `correction` of another. Flag both, present to user.

3. **Staleness check** — learnings not in any `applied_in` for last 5 protocols AND not reinforced in 90 days → flag for review. Read current spec/architecture, check if learning still applies.

4. **Spec drift** — `git diff` on `docs/spec.md` and `docs/architecture.md` since each learning's `updated_at`. If significant changes in scoped areas, flag learning for review.

5. **Signal migration** — read `.sniper/memory/signals/*.yaml`, convert each to a learning record, delete the original signal file.

6. **Pruning** — move deprecated learnings older than 6 months to `.sniper/memory/archive/`.

Write scope: `.sniper/memory/` only.

#### 6b. Add optional curate phase to protocols

**Edit:** `packages/core/protocols/full.yaml`

Add after retro phase (optional, only runs when learning count > 30 or last curation was > 5 protocols ago):

```yaml
  - name: curate
    description: Review and consolidate learnings (skipped if not needed)
    agents:
      - memory-curator
    spawn_strategy: single
    skip_if: learning_count < 30 AND last_curation_within_5_protocols
    gate:
      checklist: none
      human_approval: false
```

---

### Phase 7: Schema and Template Cleanup

#### 7a. Deprecate signal schema

**Edit:** `packages/core/schemas/signal.schema.yaml`

Add `deprecated: true` and `superseded_by: learning.schema.yaml` in the description.

#### 7b. Update retro schema

**Edit:** `packages/core/schemas/retro.schema.yaml`

Add optional field to findings:

```yaml
learning_ids:
  type: array
  items: { type: string }
  description: IDs of learnings created from this retro's findings.
```

#### 7c. Update custom protocol template

**Edit:** `packages/core/templates/custom-protocol.yaml`

Replace `auto_retro: true` with a `retro` phase in the example. Add comment about optional `curate` phase.

#### 7d. Update config template

**Edit:** `packages/core/config.template.yaml`

Add learning store config section:

```yaml
learning:
  max_per_retro: 5              # cap learnings created per retro
  min_confidence: 0.4           # threshold for composition into prompts
  composition_limit: 10         # max learnings composed per agent
  staleness_threshold: 5        # protocols without application before flagging
  archive_after_days: 180       # days after deprecation before archiving
```

---

## Sequencing and Dependencies

```
Phase 1 (schema + scaffold)
  ↓
Phase 2 (retro as phase)  ←  no dependency on Phase 1, can run in parallel
  ↓
Phase 3 (retro-analyst emits learnings)  ←  depends on Phase 1 (schema) + Phase 2 (retro runs)
  ↓
Phase 4 (human feedback)  ←  depends on Phase 1 (schema)
Phase 5 (composition)     ←  depends on Phase 1 (schema)
  ↓
Phase 6 (curator)  ←  depends on Phase 1 + 3 (learnings exist to curate)
  ↓
Phase 7 (cleanup)  ←  last, low priority
```

Phases 1 and 2 can be done in parallel.
Phases 4 and 5 can be done in parallel (both only depend on Phase 1).

## Files Changed (Summary)

| File | Action |
|------|--------|
| `packages/core/schemas/learning.schema.yaml` | **New** |
| `packages/core/schemas/signal.schema.yaml` | Edit (deprecate) |
| `packages/core/schemas/retro.schema.yaml` | Edit (add `learning_ids`) |
| `packages/core/schemas/protocol.schema.yaml` | Edit (deprecate `auto_retro`) |
| `packages/core/protocols/full.yaml` | Edit (add retro + curate phases, remove `auto_retro`) |
| `packages/core/protocols/feature.yaml` | Edit (add retro phase, remove `auto_retro`) |
| `packages/core/protocols/refactor.yaml` | Edit (add retro phase, remove `auto_retro`) |
| `packages/core/checklists/retro.yaml` | **New** |
| `packages/core/agents/retro-analyst.md` | Edit (learning extraction, effectiveness check) |
| `packages/core/agents/memory-curator.md` | **New** |
| `packages/core/skills/sniper-flow/SKILL.md` | Edit (composition, remove soft retro, backward compat) |
| `packages/core/skills/sniper-learn/SKILL.md` | **New** |
| `packages/core/skills/sniper-init/SKILL.md` | Edit (scaffold learnings dir) |
| `packages/core/templates/custom-protocol.yaml` | Edit (retro phase example) |
| `packages/core/config.template.yaml` | Edit (learning config section) |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Learning noise — too many low-quality learnings dilute useful ones | Cap per retro (5), confidence threshold for composition (0.4), curator consolidation |
| Retro as synchronous phase slows down completion | Retro-analyst reads checkpoints and writes YAML — fast (<30s). Acceptable tradeoff for reliability. |
| Curator over-prunes valid learnings | Human-sourced learnings (confidence 0.9) are never auto-deprecated. Curator only flags for review, doesn't delete without archiving. |
| Backward compat with existing `.sniper/memory/signals/` | Curator migrates signals to learnings. Composition falls back to old behavior if no learnings exist. |
| Spec drift detection false positives | Flags for human review, doesn't auto-deprecate. Conservative approach. |
