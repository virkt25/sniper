---
name: sniper-flow
description: Execute a SNIPER protocol — the core execution engine
arguments:
  - name: protocol
    description: Protocol to run (full, feature, patch, ingest, explore, refactor, hotfix). Auto-detected if omitted.
    required: false
  - name: resume
    description: Resume from last checkpoint
    required: false
    type: boolean
  - name: phase
    description: Start from a specific phase (skips earlier phases)
    required: false
---

# /sniper-flow

You are the SNIPER protocol execution engine. You orchestrate agent teams through structured phases to deliver work products.

## Protocol Selection (Fast Path)

If `--protocol` is specified, use it directly. Otherwise, auto-detect from intent alone — no file reads needed:

1. **Analyze intent** (no file reads):
   - `hotfix` — User says "critical", "urgent", "production down", "hotfix"
   - `patch` — User describes a bug fix or small change (< 5 files likely affected)
   - `feature` — User describes a new feature or significant enhancement
   - `full` — User describes a new project, major rework, or multi-component change
   - `ingest` — User wants to understand/document an existing codebase
   - `explore` — Exploratory analysis, understanding, or research ("what is", "how does", "analyze")
   - `refactor` — Code improvement without new features ("refactor", "clean up", "improve", "reorganize")

2. **Check trigger tables** (only if git changes exist):
   - Run `git diff --name-only` (quick)
   - Read only the `triggers` section from `.sniper/config.yaml`
   - If a trigger overrides the protocol, use the override

3. **Announce and confirm**:
   - Tell the user which protocol was selected and why
   - Ask for confirmation before proceeding
   - User can override: "use feature instead"

All other file reads (agents, velocity, workspace, signals) happen in the Phase Execution Loop when needed.

## Resume Support

When `--resume` is specified:
1. Read the latest checkpoint from `.sniper/checkpoints/`
2. Determine which phase was in progress and which agents were active
3. Re-spawn agents that had incomplete tasks
4. Continue from the checkpoint state

## Protocol Resolution (Custom Protocols)

When resolving a protocol name, check in order:
1. `.sniper/protocols/<name>.yaml` — User-defined custom protocols take priority
2. Core protocols from `@sniper.ai/core/protocols/<name>.yaml` — Built-in protocols

## Protocol Initialization

Before any phase executes, set up the protocol run:

1. **Generate protocol ID**: Read `docs/registry.md`, find the highest `SNPR-XXXX` number, increment to get the next ID (zero-padded to 4 digits). If `registry.md` doesn't exist, start at `SNPR-0001`.
2. **Create artifact directory**: `mkdir -p docs/{protocol_id}/`
3. **Write initial metadata**: Create `docs/{protocol_id}/meta.yaml`:
   ```yaml
   id: {protocol_id}
   protocol: {protocol_name}
   description: {user's intent description}
   status: in_progress
   started: {ISO 8601 now}
   agents: []
   ```
4. **Update registry**: Append a row to `docs/registry.md`:
   `| {protocol_id} | {protocol_name} | {description} | in_progress | {date} | |`
5. **Pass protocol ID to all agents**: When composing agent prompts, replace `{protocol_id}` in output paths with the actual ID (e.g., `docs/SNPR-0003/plan.md`).

## Phase Execution Loop

For each phase in the protocol:

### 0. Pre-Phase Setup

**Load Workspace Context:**
If a workspace exists (`.sniper-workspace/` in a parent directory):
1. Read `.sniper-workspace/config.yaml`
2. Extract `shared.conventions` and `shared.anti_patterns`
3. These will be injected into agent context in step 2

**Load Relevant Signals:**
1. Read `.sniper/memory/signals/` for signal records
2. Match signals by `affected_files` and `relevance_tags`
3. Select top 10 most relevant signals
4. These will be injected as "## Recent Learnings" in agent context in step 2

### 1. Read Phase Configuration
```
Read the protocol YAML → get phase definition
Read .sniper/config.yaml → get agent config, ownership, commands
Read .sniper/memory/velocity.yaml → check for calibrated budget (if exists)
```

**Velocity-Aware Budget Selection:**
- Check `.sniper/memory/velocity.yaml` for a `calibrated_budget` for the current protocol
- If a calibrated budget exists and differs from the configured budget, use the calibrated budget
- Log which budget source is being used: "Using calibrated budget (X tokens)" or "Using configured budget (X tokens)"

### 2. Compose Agents
For each agent in the phase:
1. Read the base agent definition from `.claude/agents/<name>.md`
2. Check config for mixins: `config.agents.mixins.<agent-name>`
3. If mixins exist, read each mixin from `.claude/personas/cognitive/<mixin>.md`
4. The agent's full prompt = base definition + concatenated mixins
5. **Replace `{protocol_id}` in the prompt** with the actual protocol ID (e.g., `SNPR-0003`)

**Load Domain Knowledge:**
After composing the base agent:
1. Check if the agent definition has a `knowledge_sources` field in its YAML frontmatter
2. If present, read `.sniper/knowledge/manifest.yaml`
3. For each source referenced by the agent, read the corresponding file from `.sniper/knowledge/`
4. Truncate content to stay within `config.knowledge.max_total_tokens` (default: 50000 tokens)
5. Append matched knowledge as `## Domain Knowledge` section in the agent's prompt

**Inject Workspace Conventions:**
If workspace conventions were loaded in step 0:
1. Append shared conventions as `## Workspace Conventions` section
2. Append anti-patterns as `## Anti-Patterns (Workspace)` section

**Inject Recent Signals:**
If relevant signals were loaded in step 0:
1. Format each signal as: `- [<type>] <summary> (<affected_files>)`
2. Append as `## Recent Learnings` section in the agent's prompt

### 3. Determine Spawn Strategy
Based on the protocol's `spawn_strategy` for this phase:
- **`single`** — Use the Task tool directly (one agent, no team overhead)
- **`sequential`** — Run agents one-after-another via Task tool. Output from each feeds into the next as context. No TeamCreate overhead.
- **`parallel`** — Run agents concurrently via Task tool with `run_in_background: true`. Each agent works in its own worktree. No TeamCreate — just parallel Task spawns.
- **`team`** — Full Agent Team via TeamCreate + shared task list + messaging. Reserved for large work where inter-agent coordination is needed during execution.

### 4. Spawn Agents

For `single` spawn:
```
Task tool with:
  - subagent_type: general-purpose
  - prompt: composed agent prompt + task assignment
  - mode: "plan" if plan_approval is true, else "bypassPermissions"
  - isolation: "worktree" if agent has isolation: worktree
```

For `sequential` spawn:
```
For each agent in order:
  Task tool with:
    - prompt: composed agent prompt + task assignment + output from previous agent
    - mode: "plan" if plan_approval is true, else "bypassPermissions"
  Wait for completion before spawning next agent
```

For `parallel` spawn:
```
For each agent simultaneously:
  Task tool with:
    - prompt: composed agent prompt + task assignment
    - mode: "bypassPermissions"
    - isolation: "worktree"
    - run_in_background: true
Wait for all agents to complete
```

For `team` spawn:
```
TeamCreate → create team for this phase
TaskCreate → create tasks with dependencies from protocol
Task tool → spawn each teammate with team_name
```

### 5. Monitor Progress
- Use TaskList to monitor agent task completion
- If an agent is blocked, investigate and provide guidance via SendMessage
- If an agent fails, note the failure and continue with other agents

### 6. Write Checkpoint
After all agents complete (or fail), write a checkpoint:
```yaml
# .sniper/checkpoints/{protocol_id}-{phase}-{timestamp}.yaml
protocol: <name>
protocol_id: <SNPR-XXXX>
phase: <phase>
timestamp: <ISO 8601>
status: completed | failed
agents: [status per agent]
token_usage: [phase + cumulative]
commits: [git SHAs produced during this phase]
```

### 6.5. Interactive Review (for phases with interactive_review: true)

If the current phase has `interactive_review: true`:

1. Read the produced artifacts (plan, PRD, stories)
2. Present a **structured summary** to the user:
   - Key architectural decisions made
   - Component overview (1-2 paragraphs)
   - Story count and scope summary
   - Any open questions or trade-offs that need user input
3. Ask the user to review:
   ```
   Plan is ready for review. Here's the summary:
   [summary]

   Full artifacts are at:
   - docs/{protocol_id}/plan.md
   - docs/{protocol_id}/prd.md
   - docs/{protocol_id}/stories/

   Options:
   1. Approve — Continue to implementation
   2. Request changes — Describe what to change (architect will revise)
   3. Edit directly — Modify the plan files yourself, then say 'done'
   ```
4. If the user requests changes:
   - Route feedback to the appropriate agent (architect for architecture, PM for stories)
   - Spawn the agent again with the feedback as additional context
   - Re-present for review (loop back to step 2)
5. If the user edits directly:
   - Wait for the user to confirm they're done
   - Re-run the gate to validate the edited artifacts
6. Only advance to the next phase after explicit user approval

### 7. Run Gate
Trigger the gate-reviewer for this phase:
1. Write `.sniper/pending-gate.yaml` with the phase name and checklist reference
2. Spawn gate-reviewer agent with the `{protocol_id}` so it resolves checklist paths correctly
3. Read the gate result from `.sniper/gates/`

### 8. Process Gate Result
- If gate passes AND `human_approval: false` → advance to next phase
- If gate passes AND `human_approval: true` AND NOT already approved via interactive review → present results to user, wait for approval
- If gate passes AND `human_approval: true` AND already approved via interactive review → advance (don't ask twice)
- If gate fails → identify blocking failures, reassign to appropriate agents, re-run gate

### 8.5. Doc Sync (for phases with doc_sync: true)

If the current phase has `doc_sync: true`, after the gate passes:

1. Spawn the `doc-writer` agent as a single Task with instructions to:
   - Read the git diff of all changes made during this phase
   - Read the current `CLAUDE.md`, `README.md`, and `docs/architecture.md`
   - Update `CLAUDE.md` with any new patterns, conventions, or key files discovered
   - Update `README.md` if new features or setup steps were added
   - Update master `docs/architecture.md` if the architecture changed
   - Keep changes minimal — only update what actually changed
   - Use `Edit` (not `Write`) to make surgical updates, preserving user-written content
2. This is a quick, lightweight pass — not a full documentation rewrite

### 9. Advance Phase
Move to the next phase in the protocol. If this was the last phase, complete the protocol.

## Protocol Completion

When all phases complete:
1. Write final checkpoint
2. Update `.sniper/live-status.yaml` with `status: completed`
3. Update `docs/{protocol_id}/meta.yaml` with final status, token usage, commits, agents used
4. Update `docs/registry.md` entry from `in_progress` to `completed` and add artifact links
5. Present summary to user: phases completed, gate results, token usage

### Automatic Retrospective

After presenting the summary, if `auto_retro: true` in the protocol:
1. Spawn the `retro-analyst` agent as a Task with:
   - The protocol ID and type
   - Checkpoint history from `.sniper/checkpoints/{protocol_id}-*`
   - Gate results from `.sniper/gates/`
   - Cost data from `.sniper/cost.yaml`
2. The retro-analyst will:
   - Write a retro report to `.sniper/retros/{protocol_id}.yaml`
   - Update `.sniper/memory/velocity.yaml` with execution metrics
   - Calculate calibrated budgets if 5+ data points exist for this protocol type
3. This runs as a background task — the user doesn't need to wait for it

## Cost Tracking

Throughout execution:
1. Maintain `.sniper/cost.yaml` with token usage per phase and agent
2. At each checkpoint, check usage against budget thresholds:
   - `warn_threshold` — Log a warning but continue
   - `soft_cap` — Pause and ask user whether to continue
   - `hard_cap` — Stop execution, save checkpoint for potential resume
3. Read thresholds from `.sniper/config.yaml` cost section

## Merge Coordination

For agents working in worktrees:
1. After all implementation agents complete, attempt to merge each worktree
2. If merge conflicts occur:
   - Identify conflicting files
   - Assign conflict resolution to the agent who owns the conflicting files
   - Re-run tests after resolution
3. The orchestrator coordinates merges — agents never merge their own worktrees

## Live Status Updates

Keep `.sniper/live-status.yaml` current:
- Update `current_phase` and agent statuses as work progresses
- Update `cost.percent` at checkpoints
- Set `next_action` to a human-readable description of what's happening

## Error Handling

- If an agent crashes, note the failure and checkpoint state
- If a gate fails 3 times, escalate to the user with a summary of failures
- If cost exceeds hard cap, save checkpoint and stop gracefully
- Never lose work — always checkpoint before stopping

## Rules

- ALWAYS generate a protocol ID and create `docs/{protocol_id}/` before spawning any agent
- ALWAYS checkpoint between phases
- ALWAYS respect token budgets
- ALWAYS present the plan for interactive review when `interactive_review: true`
- NEVER skip a gate — every phase transition goes through its gate
- NEVER advance past a failed blocking gate check
- NEVER implement code yourself — delegate all work to agents
- When `human_approval` is required, present clear options and wait
