# SNIPER v3 Getting Started

Set up SNIPER v3 in a new or existing project.

---

## Prerequisites

- **Node.js** 18+
- **pnpm** 9+
- **Claude Code CLI** installed and authenticated (`claude` command available)
- A git repository (SNIPER uses git worktrees for agent isolation)

## Install

```bash
pnpm add -D @sniper.ai/cli @sniper.ai/core
```

This installs the CLI (`sniper` binary) and the core framework content (agents, skills, protocols, checklists, hooks).

For language-specific support, install a plugin:

```bash
sniper plugin install typescript   # TypeScript/JavaScript
sniper plugin install python       # Python
sniper plugin install go           # Go
sniper plugin install rust         # Rust
```

## Initialize

Run the init command from your project root:

```bash
sniper init
```

The interactive setup asks:
1. **Project name** — used in status output and artifact paths
2. **Protocol preference** — default protocol for ambiguous scope (defaults to `feature`)
3. **Language plugins** — auto-detected from your project, confirm to install
4. **Agent customization** — which cognitive mixins to apply (security-first, performance-focused, etc.)
5. **Routing table** — maps file paths to agent expertise (auto-generated from project structure, editable)

### What `sniper init` Creates

```
.sniper/
  config.yaml              # Project configuration
  checkpoints/             # Protocol run state (empty initially)
  artifacts/               # Generated specs, plans, stories
  memory/                  # Conventions and retro findings

.claude/
  agents/                  # Agent definitions
    lead-orchestrator.md
    analyst.md
    architect.md
    product-manager.md
    backend-dev.md
    frontend-dev.md
    fullstack-dev.md
    qa-engineer.md
    code-reviewer.md
    gate-reviewer.md
    retro-analyst.md
  commands/                # Skill definitions
    sniper-flow/SKILL.md
    sniper-init/SKILL.md
    sniper-status/SKILL.md
    sniper-review/SKILL.md
  settings.json            # Hook configuration (merged with existing)
```

The `.claude/` directory is what Claude Code reads. The `.sniper/` directory is SNIPER's working state.

## Your First Protocol Run

Start Claude Code in your project directory, then invoke the flow skill:

```
/sniper-flow "Add a health check endpoint at GET /health that returns 200 with uptime and version"
```

### What Happens

1. **Protocol selection**: The framework analyzes your intent. A single endpoint is a small, scoped change — it selects the `patch` protocol (implement, review).

2. **Agent spawn**: For a patch, a single implementation agent (e.g., `backend-dev`) is spawned as a subagent. No team overhead.

3. **Implementation**: The agent creates the endpoint, writes tests, and self-reviews.

4. **Gate review**: A `Stop` hook fires the `gate-reviewer` agent. It runs your test suite and lint checks. If everything passes, the protocol completes.

5. **Checkpoint**: Final state is written to `.sniper/checkpoints/`.

For larger work:

```
/sniper-flow "Build a user authentication system with email/password and Google OAuth2"
```

This auto-selects the `feature` protocol (plan, implement, review), spawns multiple agents, and includes a plan-approval gate where you review the architecture before implementation begins.

## Protocol Override

If auto-selection picks wrong, override it:

```
/sniper-flow --protocol full "Build user authentication"
```

Available protocols: `full`, `feature`, `patch`, `hotfix`, `explore`, `refactor`, `ingest`.

## Understanding the Output

### Checkpoints

Every protocol run creates a checkpoint directory:

```
.sniper/checkpoints/
  feat-001/
    live-status.yaml     # Real-time progress (agents, tasks, budget)
    events.jsonl         # Append-only event log
    cost.yaml            # Token usage tracking
    gate-implement.yaml  # Gate results per phase
```

### Gates

Gate results appear in the checkpoint directory. A gate result looks like:

```yaml
gate: implement
result: PASS
checks:
  - name: tests_pass
    result: PASS
  - name: lint_clean
    result: PASS
  - name: self_reviews_exist
    result: PASS
```

If a gate fails, the lead orchestrator routes feedback to the failing agent automatically. You only intervene if the retry also fails.

### Status

Check progress anytime:

```
/sniper-status
```

This reads `live-status.yaml` and shows:
- Current protocol and phase
- Agent status (active, completed, waiting, stalled)
- Task progress (X of Y complete)
- Budget consumption (tokens used / allocated)
- Recent events

## Project Config

The config at `.sniper/config.yaml` controls framework behavior:

```yaml
project:
  name: my-project

agents:
  backend-dev:
    base: backend-dev
    mixins: [security-first]
  frontend-dev:
    base: frontend-dev
    mixins: [user-empathetic]

routing:
  src/api/**:        backend-dev
  src/components/**:  frontend-dev
  **/*.test.*:        qa-engineer

cost:
  budgets:
    full: 2000000
    feature: 800000
    patch: 200000

visibility:
  progress_interval_minutes: 10
  notify_on_task_complete: true
```

See [Protocol Reference](./v3-protocol-reference.md) for protocol details, [Agent Reference](./v3-agent-reference.md) for agent customization.

## Common Workflows

### Greenfield Project

```
/sniper-flow --protocol full "Build a task management API with user auth, projects, and tasks"
```

Runs: discover, plan (human approval gate), decompose, implement, review (human approval gate).

### Brownfield Onboarding

```
/sniper-flow --protocol ingest
```

Runs: scan (analyzes codebase), document (generates AI-optimized docs), extract (creates baseline specs). After ingest, use `feature` or `patch` protocols for changes.

### Quick Fix

```
/sniper-flow "Fix the 500 error on POST /users when email is missing"
```

Auto-selects `patch`. Single agent, fast turnaround, automatic review.

### Research / Investigation

```
/sniper-flow "Analyze our API response times and identify bottlenecks"
```

Auto-selects `explore`. Spawns an analyst agent, produces findings document, asks you to approve scope before switching to an implementation protocol.

## Next Steps

- [Protocol Reference](./v3-protocol-reference.md) — detailed protocol phases and gates
- [Agent Reference](./v3-agent-reference.md) — agent architecture and customization
- [Plugin Development](./v3-plugin-development.md) — creating language and domain plugins
- [Migration Guide](./v3-migration-guide.md) — upgrading from v2
