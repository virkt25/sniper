# SNIPER v3 Fixes & Improvements Plan

> **Date**: 2026-03-07
> **Status**: Planned
> **Branch**: `fix/v3-issues-plan`

---

## Issues Summary

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Hooks format broken — Claude Code rejects scaffolded `settings.json` | **Critical** | Low |
| 2 | Retro/velocity learning not automatic — requires manual trigger | High | Medium |
| 3 | Subagent vs. team spawn strategy too aggressive (always teams) | Medium | Medium |
| 4 | No user review/approval of plan before build starts | High | Medium |
| 5 | No continuous docs/architecture updates during builds | Medium | Medium |
| 6 | Protocol selection reads too many files | Medium | Low |
| 7 | Docs overwritten on each run — no versioned artifact tracking | High | Medium |

---

## Issue 1: Hooks Format Broken

### Problem

When `sniper init` scaffolds `.claude/settings.json`, it generates hooks in the **old** format. Claude Code's current hooks API expects the **new matcher-based** format. The result: a "Settings Error" on every `claude` launch.

**Current format** (in `packages/core/hooks/settings-hooks.json`):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "description": "...",
        "command": "..."
      }
    ]
  }
}
```

**Expected format** (Claude Code current API):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": { "tools": ["Write"] },
        "hooks": [
          { "type": "command", "command": "...", "description": "..." }
        ]
      }
    ]
  }
}
```

The key differences:
1. `matcher` must be an **object** with a `tools` array (not a string)
2. The actual hook commands go in a `hooks` **array** on the entry (not at the top level)
3. Each hook in the array has a `type` field (`"command"`, `"prompt"`, or `"agent"`)

The `signal-hooks.json` file has the same issue.

### Root Cause

The hook format in `packages/core/hooks/settings-hooks.json` and `signal-hooks.json` was written to match an older Claude Code hooks spec. The `mergeHooks()` function in `packages/cli/src/scaffolder.ts` also deduplicates by `description` at the entry level, which is correct, but the entries themselves are wrong.

### Fix

**Files to change:**
- `packages/core/hooks/settings-hooks.json` — Rewrite to new format
- `packages/core/hooks/signal-hooks.json` — Rewrite to new format
- `packages/cli/src/scaffolder.ts` — Update `mergeHooks()` to handle the new nested structure (dedup by matcher + description). Also add logic to process and merge plugin hooks from `plugin.yaml` during scaffolding (currently only core hooks are merged — plugin hooks in `plugin.yaml` are parsed but NOT written to `settings.json`)
- `packages/plugins/plugin-typescript/plugin.yaml` — Hooks are simple string arrays (`PreToolUse: ["npx tsc --noEmit"]`), need full object format
- `packages/plugins/plugin-python/plugin.yaml` — Same issue
- `packages/plugins/plugin-go/plugin.yaml` — Same issue

**New `settings-hooks.json`:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": { "tools": ["Write"] },
        "hooks": [
          {
            "type": "command",
            "description": "Enforce lead orchestrator write scope restriction",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q '\"file_path\"' && ! echo \"$CLAUDE_TOOL_INPUT\" | grep -q '.sniper/'; then echo 'BLOCK: Lead orchestrator can only write to .sniper/ directory' >&2; exit 2; fi"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": { "tools": ["Bash"] },
        "hooks": [
          {
            "type": "command",
            "description": "Self-healing CI: detect test/lint failures and instruct agent to fix",
            "command": "if echo \"$CLAUDE_TOOL_OUTPUT\" | grep -qiE '(FAIL|FAILED|ERROR|AssertionError|SyntaxError|TypeError|ReferenceError|lint.*error|eslint.*error|tsc.*error)'; then echo 'WARN: Test or lint failure detected. Fix the failing test/lint issue before proceeding to the next task.'; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": {},
        "hooks": [
          {
            "type": "command",
            "description": "Run gate reviewer at phase boundaries",
            "command": "if [ -f .sniper/pending-gate.yaml ]; then echo 'Gate review pending — spawning gate-reviewer agent'; fi"
          },
          {
            "type": "command",
            "description": "Run retro analyst after protocol completion",
            "command": "if [ -f .sniper/protocol-complete.yaml ]; then echo 'Protocol complete — spawning retro-analyst agent'; fi"
          }
        ]
      }
    ]
  }
}
```

> **Note on Stop hooks with `agent` type:** The old format used `"agent": "gate-reviewer"` and `"agent": "retro-analyst"` to specify agent-type hooks. Verify if the current Claude Code API supports `"type": "agent"` hooks in the new format. If so, the Stop hooks should use that type. If not, the Stop hook command should output instructions that the orchestrator picks up on to spawn those agents, or we use a `"type": "prompt"` hook that triggers agent spawning.

**`mergeHooks()` update:** The dedup logic needs to compare by `matcher` object (JSON-stringified for comparison) rather than by top-level `description`. Each matcher entry contains a `hooks` array that should be merged (not replaced).

---

## Issue 2: Retro/Velocity Learning Not Automatic

### Problem

The v3 plan (Section 9.1) explicitly states: "A `Stop` hook fires after every protocol completion. This hook runs the retro-analyst agent automatically." However:

1. The Stop hook in `settings-hooks.json` only checks for `.sniper/protocol-complete.yaml` — but nothing writes this file automatically
2. Even if the hook fires, it just echoes a message — it doesn't actually spawn the retro-analyst agent
3. The `/sniper-flow` skill says "If `auto_retro: true` in the protocol, trigger retro-analyst" (line 198) but this is just an instruction to the lead orchestrator, not an automated mechanism
4. Velocity calibration (`.sniper/memory/velocity.yaml`) is never populated automatically

### Design: Automatic Retro Pipeline

The retro should fire automatically at the end of every protocol that has `auto_retro: true`. It should not depend on a Stop hook (which is fragile — depends on the file existing, the hook format being correct, etc.). Instead, make it a **mandatory final step in `/sniper-flow`**.

### Fix

**A. Make retro a built-in step in `/sniper-flow` (not a hook):**

Add a "## Protocol Completion" section to the `/sniper-flow` skill that explicitly:
1. Checks if the protocol has `auto_retro: true`
2. Spawns the `retro-analyst` agent as a Task with the execution context
3. The retro-analyst writes to `.sniper/memory/retros/<protocol-id>.yaml`
4. The retro-analyst also updates `.sniper/memory/velocity.yaml`

This is more reliable than a Stop hook because:
- It runs within the orchestrator's context (has access to all execution state)
- It doesn't depend on file existence checks
- It's part of the defined flow, not a side-effect

**B. Update retro-analyst agent to record velocity data:**

The retro-analyst agent (`packages/core/agents/retro-analyst.md`) should:
1. Read all checkpoints for the completed protocol
2. Calculate: total tokens used, wall-clock duration, agents spawned, gate pass/fail counts
3. Write retro findings to `.sniper/memory/retros/<protocol-id>.yaml`
4. **Append** to `.sniper/memory/velocity.yaml` with the new data point
5. If 5+ data points exist for this protocol type, calculate a `calibrated_budget` (p75 of actuals)

**C. Update velocity schema:**

```yaml
# .sniper/memory/velocity.yaml
protocol_history:
  feature:
    executions:
      - id: feat-042
        tokens: 285000
        duration_minutes: 47
        agents: 3
        gate_passes: 2
        gate_failures: 0
        timestamp: 2026-03-07T10:00:00Z
    calibrated_budget: null  # Set after 5+ executions (p75)
    average_tokens: 285000
    count: 1
```

**D. Remove the retro Stop hook entries from `settings-hooks.json`:**

The Stop hook for retro is redundant if `/sniper-flow` handles it. Keep the gate-reviewer Stop hook for phase boundaries (that serves a different purpose), but remove the retro hook since it never worked as designed.

**Files to change:**
- `packages/core/skills/sniper-flow/SKILL.md` — Add explicit retro step in Protocol Completion
- `packages/core/agents/retro-analyst.md` — Add velocity recording instructions
- `packages/core/schemas/velocity.yaml` — Add/update schema
- `packages/core/hooks/settings-hooks.json` — Remove the retro Stop hook entry

---

## Issue 3: Subagent vs. Team Spawn Strategy

### Problem

The v3 plan (Section 3.4) defines clear spawn strategy tiers:
- **Small work (patch, hotfix):** Single subagent via Task tool
- **Medium work (feature, refactor):** 2-3 subagents via Task tool with worktree isolation
- **Large work (full, ingest):** Full Agent Team via TeamCreate

But the current protocol YAMLs use `spawn_strategy: team` for almost everything — even the `feature` protocol's plan phase uses `team` for architect + product-manager. This means every feature request spins up a full Agent Team, which adds overhead and cost.

### Design: Smarter Spawn Strategy

The protocols should follow the v3 plan's tiered approach:

| Protocol | Phase | Current Strategy | Correct Strategy | Rationale |
|----------|-------|-----------------|-----------------|-----------|
| `full` | discover | `single` | `single` | One analyst, correct |
| `full` | plan | `team` | `team` | Architect + PM need coordination, correct |
| `full` | implement | `team` | `team` | Multiple devs in parallel, correct |
| `full` | review | `single` | `single` | One reviewer, correct |
| `feature` | plan | `team` | **`sequential`** | Architect designs first, PM writes stories from that. No parallel coordination needed — sequential handoff is simpler and cheaper |
| `feature` | implement | `team` | **`parallel`** | Multiple subagents via Task (not TeamCreate). Worktree isolation. No team overhead |
| `feature` | review | `single` | `single` | Correct |
| `patch` | implement | N/A | `single` | One dev, correct |
| `patch` | review | N/A | `single` | One reviewer, correct |
| `refactor` | analyze | N/A | `single` | One analyst, correct |
| `refactor` | implement | N/A | **`parallel`** | Subagents, not full team |
| `refactor` | review | N/A | `single` | Correct |

### New Spawn Strategy: `sequential` and `parallel`

Add two new spawn strategies to the protocol YAML vocabulary:

- **`single`** — One agent via Task tool (unchanged)
- **`sequential`** — Multiple agents run one-after-another via Task tool. Output from each feeds into the next. No TeamCreate overhead
- **`parallel`** — Multiple agents run concurrently via Task tool with `run_in_background: true`. No TeamCreate — just parallel Task spawns with worktree isolation
- **`team`** — Full Agent Team via TeamCreate + shared task list + messaging. Reserved for large work where inter-agent coordination is needed during execution

### Fix

**Files to change:**
- `packages/core/protocols/feature.yaml` — Change plan to `sequential`, implement to `parallel`
- `packages/core/protocols/full.yaml` — Keep as-is (team is correct for large work)
- `packages/core/protocols/refactor.yaml` — Change implement to `parallel`
- `packages/core/protocols/patch.yaml` — Verify it's `single`
- `packages/core/protocols/hotfix.yaml` — Verify it's `single`
- `packages/core/skills/sniper-flow/SKILL.md` — Update "Determine Spawn Strategy" section to handle `sequential` and `parallel`

---

## Issue 4: No User Plan Review Before Build

### Problem

The protocol YAMLs have `human_approval: true` on plan phase gates, and the `/sniper-flow` skill says "present results to user, wait for approval." The *intent* is correct, but the implementation is insufficient:

- The gate runs **after** the plan is complete — it validates checklist items (architecture has Context section, stories have EARS criteria, etc.), not plan **content quality or user alignment**
- The approval step is a binary pass/reject — there's no structured way to **request specific changes** and iterate
- The user doesn't get a **summary** of key decisions — they have to read multiple artifact files to understand what was planned
- There's no loop for the user to say "change X" and have the architect revise — they'd have to reject, explain, and hope the agent understands
- The user can't **edit the plan directly** and have the framework pick up their changes

### Design: Interactive Plan Review

Add an explicit **plan consultation** step where:
1. The architect/PM produce a draft plan
2. The plan is presented to the user with a structured summary
3. The user can: approve, request changes, or edit the plan directly
4. If changes are requested, the architect revises and re-presents
5. Only after explicit approval does the flow advance to implementation

This should apply to any protocol with a `plan` phase that has `human_approval: true`.

### Fix

**A. Update `/sniper-flow` skill — add explicit plan review loop:**

After Step 6 (Write Checkpoint) and before Step 7 (Run Gate), add a new step for phases with `human_approval: true`:

```
### 6.5. User Review (for phases with human_approval: true)

If the current phase has `human_approval: true`:

1. Read the produced artifacts (plan, architecture, PRD, stories)
2. Present a **structured summary** to the user:
   - Key decisions made
   - Architecture overview (1-2 paragraphs)
   - Story count and scope
   - Any open questions or trade-offs that need user input
3. Ask the user to review:
   "Plan is ready for review. Here's the summary:
   [summary]

   Full artifacts:
   - docs/architecture.md
   - docs/prd.md
   - docs/stories/

   Options:
   1. **Approve** — Continue to implementation
   2. **Request changes** — Describe what to change (architect will revise)
   3. **Edit directly** — Modify the plan files yourself, then say 'done'"
4. If the user requests changes:
   - Route feedback to the appropriate agent (architect for architecture, PM for stories)
   - Agent revises the artifacts
   - Re-present for review (loop back to step 2)
5. If the user edits directly:
   - Wait for the user to confirm they're done
   - Re-run the gate to validate the edited artifacts
6. Only advance to the next phase after explicit user approval
```

**B. Update protocol YAMLs to mark which phases need interactive review:**

Add a `interactive_review: true` flag (distinct from `human_approval`) to indicate the plan review loop should run. `human_approval` on the gate is the final sign-off; `interactive_review` is the consultation step.

```yaml
# feature.yaml plan phase
- name: plan
  description: Feature design and story creation
  agents:
    - architect
    - product-manager
  spawn_strategy: sequential
  interactive_review: true  # Present plan to user for review/feedback
  gate:
    checklist: plan
    human_approval: true
```

**Files to change:**
- `packages/core/skills/sniper-flow/SKILL.md` — Add the interactive review loop
- `packages/core/protocols/full.yaml` — Add `interactive_review: true` to plan phase
- `packages/core/protocols/feature.yaml` — Add `interactive_review: true` to plan phase
- `packages/core/protocols/refactor.yaml` — Add `interactive_review: true` to analyze phase (if it produces a plan)

---

## Issue 5: No Continuous Docs/Architecture Updates During Builds

### Problem

SNIPER builds code but doesn't update the project's architecture docs, CLAUDE.md, or README.md as it goes. The code-reviewer agent does have **spec reconciliation** (updating `docs/spec.md` after review — Kiro pattern), but this only covers the spec, not the broader project docs. This means:
- Architecture docs drift from reality after the first build
- CLAUDE.md doesn't learn from the code that was written
- New sessions start without knowledge of what was built
- README.md doesn't reflect new features

> **Note:** There's already a comprehensive `/sniper-doc` plan in `plans/sniper-doc.md` covering full documentation generation with managed sections (`<!-- sniper:managed -->`). This issue is about **incremental updates during builds** — a lighter-weight complement to the full `/sniper-doc` feature.

### Design: Continuous Documentation Updates

Add a **doc-sync** step that runs automatically after the implement phase (before or during review). This is lightweight — not a full documentation rewrite, just incremental updates.

### Fix

**A. Add a `doc-sync` step to `/sniper-flow` after implementation:**

After the implement phase completes and passes its gate, before advancing to review:

1. Spawn the `doc-writer` agent with instructions to:
   - Read the git diff of all changes made during implementation
   - Read the current `CLAUDE.md`, `README.md`, and `docs/architecture.md`
   - Update CLAUDE.md with any new patterns, conventions, or key files discovered
   - Update README.md if new features or setup steps were added
   - Update `docs/architecture.md` if the architecture changed
   - Keep changes minimal and focused — only update what actually changed
2. This runs as a `single` spawn (one agent, quick pass)
3. The doc-writer's changes go through the review gate along with the implementation

**B. Add `doc_sync` flag to protocol phases:**

```yaml
# In protocol YAML — implement phase
- name: implement
  description: Feature implementation
  agents:
    - fullstack-dev
    - qa-engineer
  spawn_strategy: parallel
  doc_sync: true  # Run doc-writer after this phase
  gate:
    checklist: implement
    human_approval: false
```

**C. Update the doc-writer agent to support incremental updates:**

The doc-writer agent should have explicit instructions for incremental mode:
- Read the diff, not the entire codebase
- Only touch sections of docs that are affected by the changes
- Preserve user-written content in CLAUDE.md
- Use `Edit` (not `Write`) to make surgical updates

**Files to change:**
- `packages/core/skills/sniper-flow/SKILL.md` — Add doc-sync step
- `packages/core/agents/doc-writer.md` — Add incremental update mode
- `packages/core/protocols/full.yaml` — Add `doc_sync: true` to implement phase
- `packages/core/protocols/feature.yaml` — Add `doc_sync: true` to implement phase
- `packages/core/protocols/refactor.yaml` — Add `doc_sync: true` to implement phase

---

## Issue 6: Protocol Selection Reads Too Many Files

### Problem

When `/sniper-flow` auto-detects which protocol to use, it reads:
1. `.sniper/config.yaml` — routing rules
2. Protocol YAML files — to understand available protocols
3. Git status / git diff — to check changed files
4. Trigger tables — to match file patterns
5. Velocity data — to check calibrated budgets
6. Workspace config — if workspace exists
7. Signal records — for recent learnings

This is a lot of file I/O before any work starts. Most of this is needed for **phase execution**, not protocol selection.

### Design: Two-Phase Protocol Selection

Split protocol selection into a **fast path** and **deferred loading**:

**Fast path (protocol selection)** — Read only what's needed to pick a protocol:
1. Parse the user's intent (keywords and scope estimation) — **no file reads needed**
2. Read `.sniper/config.yaml` `triggers` section only (if changed files exist) — **1 file**
3. Select protocol based on intent analysis + trigger matches

**Deferred loading (phase execution)** — Load everything else when the phase actually starts:
- Agent definitions, mixins, velocity data, workspace config, signals, knowledge — all loaded at phase execution time (Step 1-2 of the phase loop), not at protocol selection time

### Fix

**A. Update `/sniper-flow` skill — restructure Protocol Selection section:**

Replace the current Protocol Selection section with a streamlined version:

```markdown
## Protocol Selection (Fast Path)

If `--protocol` is specified, use it directly. Otherwise, auto-detect:

1. **Analyze intent** (no file reads):
   - `hotfix` — User says "critical", "urgent", "production down", "hotfix"
   - `patch` — User describes a bug fix or small change
   - `feature` — User describes a new feature or enhancement
   - `full` — User describes a new project or major rework
   - `ingest` — User wants to understand/document an existing codebase
   - `explore` — User wants analysis or research
   - `refactor` — User wants code improvement without new features

2. **Check trigger tables** (only if git changes exist):
   - Run `git diff --name-only` (quick)
   - Read only the `triggers` section from `.sniper/config.yaml`
   - If a trigger overrides the protocol, use the override

3. **Announce and confirm**:
   - Tell the user which protocol was selected and why
   - Ask for confirmation before proceeding
   - User can override: "use feature instead"

All other file reads (agents, velocity, workspace, signals) happen in the Phase Execution Loop when needed.
```

**B. Move file reads out of protocol selection in the skill:**

The current skill has "Read Phase Configuration" as Step 1 of the phase loop, which already loads config, agents, and velocity. The protocol selection section should NOT duplicate these reads. Remove the instructions to read config/protocols during selection.

**Files to change:**
- `packages/core/skills/sniper-flow/SKILL.md` — Restructure Protocol Selection section

---

## Issue 7: Docs Overwritten — No Versioned Artifact Tracking

### Problem

Every protocol run writes to the same flat files: `docs/architecture.md`, `docs/prd.md`, `docs/spec.md`, `docs/review-report.md`, `docs/stories/*.md`. Running a second `feature` protocol **overwrites** the first one's plan artifacts. Sometimes agents create copies in new folders to avoid this, leading to an inconsistent mess.

This means:
- No history of plans — you can't review what was planned for feature A vs. feature B
- The review report from feature A is gone after feature B runs
- Stories from different features collide in `docs/stories/`
- No master index of all work that's been done
- No way to trace "which protocol produced which artifacts"

### Design: Numbered Protocol Artifacts + Master Registry

Inspired by **Google Conductor's track registry** pattern (`tracks.md` + `tracks/<track_id>/`) and **Codev's SPIR numbering**, introduce:

1. **Protocol IDs with sequential numbering**: Each protocol run gets a unique ID like `SNPR-0001`, `SNPR-0002`, etc.
2. **Per-protocol artifact directories**: Each run's docs go in `docs/SNPR-XXXX/` instead of flat `docs/`
3. **Master docs**: Living documents at `docs/architecture.md`, `docs/spec.md` that represent the **current state** — updated incrementally, never overwritten wholesale
4. **Protocol registry**: A `docs/registry.md` file that tracks all protocol runs with status

### Artifact Directory Structure

```
docs/
  registry.md                    # Master registry of all protocol runs
  architecture.md                # Living master architecture doc (incrementally updated)
  spec.md                        # Living master spec (current state of the project)
  codebase-overview.md           # Living codebase analysis
  SNPR-0001/                     # First protocol run (full — initial build)
    plan.md                      # Architecture plan for this run
    prd.md                       # PRD for this run
    stories/                     # Stories for this run
      001-user-auth.md
      002-dashboard.md
    review-report.md             # Review findings
    meta.yaml                    # Protocol metadata (type, dates, status, agents)
  SNPR-0002/                     # Second protocol run (feature — add OAuth)
    plan.md
    prd.md
    stories/
      001-oauth-google.md
      002-oauth-callback.md
    review-report.md
    meta.yaml
  SNPR-0003/                     # Third protocol run (patch — fix login bug)
    review-report.md             # Patches may only have a review report
    meta.yaml
```

### Registry Format

```markdown
# Protocol Registry

| ID | Protocol | Description | Status | Date | Artifacts |
|----|----------|-------------|--------|------|-----------|
| SNPR-0001 | full | Initial project build — user management system | completed | 2026-03-07 | [plan](SNPR-0001/plan.md), [prd](SNPR-0001/prd.md), [review](SNPR-0001/review-report.md) |
| SNPR-0002 | feature | Add OAuth2 Google sign-in | completed | 2026-03-08 | [plan](SNPR-0002/plan.md), [prd](SNPR-0002/prd.md), [review](SNPR-0002/review-report.md) |
| SNPR-0003 | patch | Fix login redirect loop | completed | 2026-03-09 | [review](SNPR-0003/review-report.md) |
| SNPR-0004 | feature | Add user preferences | in_progress | 2026-03-10 | [plan](SNPR-0004/plan.md) |
```

### Protocol Metadata (`meta.yaml`)

```yaml
id: SNPR-0002
protocol: feature
description: Add OAuth2 Google sign-in
status: completed
started: 2026-03-08T10:00:00Z
completed: 2026-03-08T11:47:00Z
agents: [architect, product-manager, fullstack-dev, qa-engineer, code-reviewer]
token_usage: 285000
gate_results:
  plan: pass
  implement: pass
  review: pass
stories_count: 2
commits: [abc123, def456, ghi789]
```

### Master Docs vs. Per-Protocol Docs

| Document | Per-Protocol (`docs/SNPR-XXXX/`) | Master (`docs/`) |
|----------|----------------------------------|-------------------|
| `plan.md` | Snapshot of the plan for this specific run | N/A — plans are per-run |
| `prd.md` | PRD for this specific feature/build | N/A — PRDs are per-run |
| `stories/` | Stories for this specific run | N/A — stories are per-run |
| `review-report.md` | Review findings for this run | N/A — reviews are per-run |
| `architecture.md` | N/A | Living doc — updated incrementally after each run |
| `spec.md` | N/A | Living doc — reconciled after each review phase |
| `codebase-overview.md` | N/A | Living doc — updated by ingest/explore protocols |
| `meta.yaml` | Protocol run metadata | N/A |
| `registry.md` | N/A | Master index of all runs |

**Key principle:** Per-protocol docs are **snapshots** (what was planned/reviewed for this run). Master docs are **living** (current state of the project). The code-reviewer's spec reconciliation updates the master `docs/spec.md`, not the per-protocol one.

### ID Generation

The next protocol ID is determined by reading `docs/registry.md` and incrementing:
1. Read `docs/registry.md`
2. Find the highest `SNPR-XXXX` number
3. Next ID = `SNPR-{max + 1}` (zero-padded to 4 digits)
4. If `registry.md` doesn't exist, start at `SNPR-0001`

### Fix

**A. Update `/sniper-flow` skill — protocol ID and directory creation:**

At protocol start (before any phase executes):
1. Generate the next `SNPR-XXXX` ID
2. Create `docs/SNPR-XXXX/` directory
3. Create `docs/SNPR-XXXX/meta.yaml` with initial metadata
4. Add an entry to `docs/registry.md` with status `in_progress`
5. Pass the protocol ID to all agents so they write to `docs/SNPR-XXXX/` instead of `docs/`

At protocol completion:
1. Update `docs/SNPR-XXXX/meta.yaml` with final status, token usage, commits
2. Update `docs/registry.md` entry to `completed`

**B. Update agent output paths:**

All agents that produce doc artifacts need to write to the protocol-specific directory:

| Agent | Current Output | New Output |
|-------|---------------|------------|
| architect | `docs/architecture.md` | `docs/{protocol_id}/plan.md` |
| product-manager | `docs/prd.md` | `docs/{protocol_id}/prd.md` |
| product-manager | `docs/stories/*.md` | `docs/{protocol_id}/stories/*.md` |
| analyst | `docs/spec.md` | Master `docs/spec.md` (this is a living doc) |
| analyst | `docs/codebase-overview.md` | Master `docs/codebase-overview.md` (living doc) |
| code-reviewer | `docs/review-report.md` | `docs/{protocol_id}/review-report.md` |
| code-reviewer | `docs/spec.md` (reconciliation) | Master `docs/spec.md` (living doc) |

**C. Update protocol YAML outputs:**

```yaml
# feature.yaml — before
outputs:
  - docs/architecture.md
  - docs/prd.md
  - docs/stories/

# feature.yaml — after
outputs:
  - docs/{protocol_id}/plan.md
  - docs/{protocol_id}/prd.md
  - docs/{protocol_id}/stories/
```

**D. Update checklists to use protocol-scoped paths:**

The plan checklist currently checks `docs/architecture.md` — needs to check `docs/{protocol_id}/plan.md` instead. The `{protocol_id}` is resolved at gate-review time from the active checkpoint.

**E. Create registry.md template:**

Add a `docs/registry.md` template to `packages/core/templates/` that gets created during `sniper init`.

**Files to change:**
- `packages/core/skills/sniper-flow/SKILL.md` — Add protocol ID generation, directory creation, registry management
- `packages/core/agents/architect.md` — Update output path to `docs/{protocol_id}/plan.md`
- `packages/core/agents/product-manager.md` — Update output paths
- `packages/core/agents/code-reviewer.md` — Update review-report output path (keep spec reconciliation on master)
- `packages/core/protocols/full.yaml` — Update `outputs` to use `{protocol_id}`
- `packages/core/protocols/feature.yaml` — Same
- `packages/core/protocols/patch.yaml` — Same
- `packages/core/protocols/refactor.yaml` — Same
- `packages/core/protocols/explore.yaml` — Same (spec goes to master, not per-protocol)
- `packages/core/protocols/ingest.yaml` — Same
- `packages/core/checklists/plan.yaml` — Update paths to `docs/{protocol_id}/plan.md`
- `packages/core/checklists/review.yaml` — Update review-report path
- `packages/core/checklists/multi-faceted-review.yaml` — Update paths
- `packages/core/templates/registry.md` — New template file
- `packages/core/schemas/` — Add `protocol-meta.schema.yaml` for `meta.yaml`
- `packages/cli/src/scaffolder.ts` — Create `docs/registry.md` during init

---

## Implementation Order

| Phase | Issues | Rationale |
|-------|--------|-----------|
| **1** | Issue 1 (hooks format) | Blocks all users from using SNIPER. Lowest effort, highest impact. |
| **2** | Issue 7 (versioned artifacts) + Issue 4 (plan review) | Issue 7 changes all artifact paths — do this before other changes that reference doc paths. Issue 4 is a skill change that naturally pairs with it. |
| **3** | Issue 6 (protocol selection) + Issue 3 (spawn strategy) | Both are skill + protocol YAML changes. Depends on Phase 2 path changes. |
| **4** | Issue 2 (auto retro) | Agent + skill changes. Independent but lower priority than build-blocking issues. |
| **5** | Issue 5 (continuous docs) | Agent + skill + protocol changes. Lowest priority — enhancement, not a fix. |

---

## Testing Strategy

- **Issue 1:** Run `sniper init` on a fresh project, then `claude` — no settings errors
- **Issue 2:** Run a `patch` protocol end-to-end — verify `.sniper/memory/retros/` and `velocity.yaml` are populated
- **Issue 3:** Run a `feature` protocol — verify it uses Task tool (not TeamCreate) for plan and implement
- **Issue 4:** Run a `feature` protocol — verify the plan is presented for user review before implementation starts
- **Issue 5:** Run a `feature` protocol — verify CLAUDE.md/README are updated after implementation
- **Issue 6:** Run `/sniper-flow` — observe that protocol selection happens with minimal file reads, deferred loading happens per-phase
- **Issue 7:** Run two `feature` protocols back-to-back — verify `docs/SNPR-0001/` and `docs/SNPR-0002/` exist with separate artifacts, `docs/registry.md` has both entries, and master `docs/spec.md` reflects the latest state
