# Skills Analysis & Improvement Plan

## Current State

5 skills in `packages/core/skills/`:

| Skill | Lines | Purpose | Verdict |
|-------|-------|---------|---------|
| `sniper-flow` | ~330 | Core protocol execution engine | Overloaded — doing too much |
| `sniper-flow-headless` | ~106 | CI/CD variant of sniper-flow | Redundant — should be a mode, not a separate skill |
| `sniper-init` | ~104 | Project scaffolding | Good — focused and well-structured |
| `sniper-review` | ~50 | Manual gate trigger | Good — clean and simple |
| `sniper-status` | ~80 | Read-only status display | Good — clean and simple |

---

## Analysis

### 1. `sniper-flow` is doing too much (Critical)

This single skill file contains:
- Protocol selection & auto-detection (lines 23-44)
- Resume support (lines 46-53)
- Custom protocol resolution (lines 55-59)
- Protocol initialization with ID generation (lines 61-77)
- Pre-phase setup: workspace context + signal loading (lines 83-96)
- Phase config loading + velocity-aware budgets (lines 98-108)
- Agent composition with mixins + domain knowledge + workspace conventions + signals (lines 109-134)
- Spawn strategy selection (4 strategies) (lines 136-141)
- Agent spawning (4 code blocks) (lines 143-178)
- Progress monitoring (lines 180-184)
- Checkpoint writing (lines 186-197)
- Interactive review loop (lines 199-231)
- Gate execution + processing (lines 233-244)
- Doc sync (lines 246-258)
- Phase advancement (lines 259-260)
- Protocol completion + registry update (lines 262-269)
- Automatic retrospective (lines 271-283)
- Cost tracking with 3 thresholds (lines 285-293)
- Merge coordination for worktrees (lines 295-303)
- Live status updates (lines 305-310)
- Error handling (lines 312-317)
- 8 hard rules (lines 319-329)

That's **22 distinct responsibilities** in one prompt. An LLM reading this has to internalize a massive state machine and execute it step-by-step. This is the #1 reliability risk — steps get skipped, ordering gets confused, edge cases get missed.

### 2. `sniper-flow-headless` is 80% duplication (Medium)

The headless variant differs from `sniper-flow` in only 4 ways:
1. No interactive prompts (protocol must be specified)
2. Auto-approve gates when `--auto-approve` is set
3. Structured output to stdout
4. Exit codes for CI/CD

Everything else — phase loop, agent composition, checkpoint, gate execution — is identical. Maintaining two copies means fixes/improvements must be applied twice.

### 3. Registered skills don't match actual skills (Medium)

The system prompt registers these skills (from `.claude/settings.json` or similar):
- `sniper-sprint`, `sniper-discover`, `sniper-plan`, `sniper-doc`, `sniper-compose`, `sniper-solve`

But these correspond to the **v2 multi-command model** (5 phase-specific commands). In v3, these were consolidated into `sniper-flow`. The old registrations still exist, creating confusion — a user might invoke `/sniper-discover` expecting it to work, but it would execute a v2-era prompt that conflicts with v3's single-engine design.

### 4. Missing operational skills (Low-Medium)

Several operations referenced by the framework have no dedicated skill:
- **Knowledge management** — `sniper-flow` references `.sniper/knowledge/manifest.yaml` but there's no skill to add/remove/list knowledge sources
- **Workspace management** — The lead-orchestrator references `.sniper-workspace/` but there's no skill to set up or manage workspaces
- **Protocol customization** — The flow supports custom protocols in `.sniper/protocols/` but there's no skill to create them from the template

### 5. Agent composition instructions are fragile (Medium)

Step 2 of the Phase Execution Loop describes a 5-layer composition:
1. Base agent definition
2. Config-specified mixins
3. Domain knowledge from manifest
4. Workspace conventions
5. Signal injection

This is described narratively. If any layer fails (file not found, manifest missing), the instructions don't specify what to do — the agent might silently skip it or hallucinate content.

### 6. Protocol initialization is busywork-heavy (Low)

The protocol init section asks the LLM to:
1. Read `docs/registry.md`
2. Parse the highest `SNPR-XXXX` number
3. Increment it
4. Zero-pad to 4 digits
5. Create directory
6. Write `meta.yaml`
7. Update registry

This is sequential mechanical work that's easy to get wrong (off-by-one, formatting errors). It should be simplified or made more resilient.

---

## Decisions

These were discussed and resolved:

1. **Timestamp IDs** — Switch from sequential `SNPR-XXXX` to timestamp-based `SNPR-YYYYMMDD-XXXX` (random suffix). Eliminates fragile registry parsing.
2. **Remove v2 skills entirely** — Delete `sniper-sprint`, `sniper-discover`, `sniper-plan`, `sniper-doc`, `sniper-compose`, `sniper-solve`. No aliases.
3. **Delete headless skill** — Remove `sniper-flow-headless` entirely. No proven use case yet; can be re-added later if needed.
4. **Skip new skills** — Don't build `/sniper-knowledge`, `/sniper-workspace`, `/sniper-protocol`. Not needed now.
5. **Skill size** — ~150 lines for the main execution path. Reference sections can push the total higher as long as the main loop stays compact.

---

## Implementation Plan

### Step 1: Delete `sniper-flow-headless` (Quick win)

- Delete `packages/core/skills/sniper-flow-headless/SKILL.md`
- Remove any references to it in CLAUDE.md, settings, or other docs

### Step 2: Remove v2 skill registrations (Quick win)

- Audit and remove all registrations/files for: `sniper-sprint`, `sniper-discover`, `sniper-plan`, `sniper-doc`, `sniper-compose`, `sniper-solve`
- Check: `.claude/settings.json`, CLAUDE.md, any skill trigger configs, CLI command registrations

### Step 3: Restructure `sniper-flow` (High impact)

**Goal:** Reduce cognitive load while preserving all functionality.

**3a. Simplify protocol initialization:**
- Replace 7-step registry parsing with timestamp ID generation (`SNPR-YYYYMMDD-XXXX`)
- Still create `docs/{protocol_id}/` and `meta.yaml`
- Still append to `docs/registry.md` (but no need to parse it for the next ID)

**3b. Compact the main execution loop:**
Collapse the current 9+ steps into 5 clear phases:

| Step | Combines | Description |
|------|----------|-------------|
| **Setup** | Pre-phase setup, read config, compose agents | Load config, velocity, workspace, signals; compose agent prompts with mixins/knowledge |
| **Execute** | Spawn strategy, spawn agents, monitor | Pick strategy from protocol YAML, spawn via Task/TeamCreate, monitor via TaskList |
| **Checkpoint** | Write checkpoint | Persist phase state to `.sniper/checkpoints/` |
| **Gate** | Run gate, process result, interactive review | Spawn gate-reviewer, handle pass/fail, present interactive review if configured |
| **Advance** | Doc sync, advance phase | Run doc-writer if `doc_sync: true`, move to next phase or complete |

**3c. Extract reference sections:**
Move detailed procedures out of the main loop into labeled reference sections at the bottom:

- **Reference: Agent Composition** — The 5-layer composition process (base + mixins + knowledge + workspace + signals)
- **Reference: Spawn Strategies** — Detailed instructions for `single`, `sequential`, `parallel`, `team`
- **Reference: Interactive Review** — The review/feedback loop for `interactive_review: true` phases
- **Reference: Protocol Completion** — Final checkpoint, registry update, retro trigger

The main loop references these by name: "Compose agents per Reference: Agent Composition"

**3d. Add inline error handling:**
Each step gets a one-line fallback instead of a generic section at the end:
- Setup: "If base agent file missing → abort phase with error"
- Setup: "If mixin/knowledge/workspace/signals missing → skip that layer, continue"
- Execute: "If agent crashes → note failure, continue with remaining agents"
- Gate: "If gate fails 3 times → escalate to user"
- Cost: "If hard cap hit → checkpoint and stop"

### Step 4: Harden agent composition (Medium impact)

Formalize the 5-layer composition as a checklist with explicit outcomes:

| Layer | Source | If missing |
|-------|--------|------------|
| Base agent | `.claude/agents/<name>.md` | FATAL — abort phase |
| Mixins | `.claude/personas/cognitive/<mixin>.md` | WARN — skip, continue |
| Domain knowledge | `.sniper/knowledge/manifest.yaml` + files | SKIP — no knowledge section |
| Workspace conventions | `.sniper-workspace/config.yaml` | SKIP — no workspace section |
| Signals | `.sniper/memory/signals/` | SKIP — no signals section |

---

## Execution Order

| Order | Step | Effort | Impact |
|-------|------|--------|--------|
| 1 | Delete headless skill | Trivial | Reduces surface area |
| 2 | Remove v2 skill registrations | Low | Removes confusion |
| 3 | Restructure sniper-flow | Medium | Core reliability improvement |
| 4 | Harden agent composition | Low | Reduces silent failures |
