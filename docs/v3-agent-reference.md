# SNIPER v3 Agent Reference

Agents are the workers in SNIPER v3. Each agent is a `.claude/agents/<name>.md` file with YAML frontmatter that Claude Code reads as a subagent definition.

---

## Agent Architecture

v3 agents map directly to Claude Code's native subagent system. An agent file is a Markdown document with frontmatter that defines the agent's capabilities, and body text that defines its instructions.

```markdown
---
name: backend-dev
description: Implements backend code — API routes, database, services, middleware.
permissionMode: bypassPermissions
memory: project
isolation: worktree
skills:
  - code-conventions
  - api-patterns
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, Task
---

You are a senior backend engineer. You implement server-side code following project conventions.

## Expertise
- Primary: API routes, services, middleware, database, auth
- Always: write tests alongside implementation, validate against API contracts

## Output
- Working, tested code committed to your worktree branch
- Update .sniper/checkpoints/ after each completed unit of work
```

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Agent identifier. Used in routing, status, checkpoints. |
| `description` | Yes | One-line summary. Shown in `/sniper-status`. |
| `permissionMode` | No | `bypassPermissions` for autonomous agents. Omit for interactive. |
| `memory` | No | `project` for persistent cross-run memory. `local` for session-only. |
| `isolation` | No | `worktree` to run in a dedicated git worktree. |
| `skills` | No | List of skill names the agent can invoke. |
| `allowed-tools` | No | Whitelist of Claude Code tools. Restricts what the agent can do. |

## Agent Composition

Agents are composed at scaffold time from a **base agent** plus zero or more **cognitive mixins**.

Configuration in `.sniper/config.yaml`:

```yaml
agents:
  backend-dev:
    base: backend-dev          # from @sniper.ai/core agents/
    mixins:
      - security-first         # cognitive mixin
      - telephony              # domain mixin from plugin
```

When `sniper init` (or `sniper init --refresh`) runs, the scaffolder:
1. Reads the base agent from `@sniper.ai/core`
2. Reads each mixin file
3. Concatenates mixin content after the base agent's body
4. Writes the composed result to `.claude/agents/<name>.md`

The composed agent is a single file — no runtime assembly.

## Core Agents

These ship with `@sniper.ai/core` and are available in every SNIPER project.

### lead-orchestrator

The coordinator. Delegates work, tracks progress, manages gates. Never implements code.

| Property | Value |
|---|---|
| Isolation | None (runs in main worktree) |
| Allowed tools | Task, SendMessage, Read, Glob, Grep, Write (scoped to `.sniper/` only) |
| Key constraint | **No Edit, no Bash.** Cannot modify project code or run commands. |

The lead orchestrator follows the zero-capability pattern: it can only delegate via `Task` and coordinate via `SendMessage`. The `Write` tool is scoped to `.sniper/` paths via a `PreToolUse` hook so the lead can update checkpoints and status files without being able to touch project code.

Why: Prevents context poisoning. If the lead starts reading diffs and implementation details, its planning ability degrades as the context window fills with low-level code. The lead reads artifacts and specs for routing decisions, not source code.

### analyst

Discovery and research. Competitive analysis, market validation, domain research.

| Property | Value |
|---|---|
| Isolation | None |
| Allowed tools | Read, Grep, Glob, Bash, WebSearch, Task |
| Used in | `full` (discover), `explore` (discover), `ingest` (extract) |

### architect

System design. API contracts, data models, technology decisions, component architecture.

| Property | Value |
|---|---|
| Isolation | None |
| Allowed tools | Read, Grep, Glob, Write, Task |
| Used in | `full` (plan), `feature` (plan), `refactor` (analyze) |

### product-manager

Requirements and decomposition. Specs, user stories, acceptance criteria using EARS notation.

| Property | Value |
|---|---|
| Isolation | None |
| Allowed tools | Read, Grep, Glob, Write, Task |
| Used in | `full` (discover, plan, decompose), `feature` (plan), `ingest` (extract) |

### backend-dev

Server-side implementation. API routes, services, middleware, database, authentication.

| Property | Value |
|---|---|
| Isolation | `worktree` |
| Memory | `project` |
| Allowed tools | Read, Edit, Write, Bash, Grep, Glob, Task |
| Self-review | Mandatory before marking task complete |

### frontend-dev

Client-side implementation. Components, pages, styles, state management, API integration.

| Property | Value |
|---|---|
| Isolation | `worktree` |
| Memory | `project` |
| Allowed tools | Read, Edit, Write, Bash, Grep, Glob, Task |
| Self-review | Mandatory before marking task complete |

### fullstack-dev

Both sides. Used for smaller projects where separate frontend/backend agents add unnecessary overhead.

| Property | Value |
|---|---|
| Isolation | `worktree` |
| Memory | `project` |
| Allowed tools | Read, Edit, Write, Bash, Grep, Glob, Task |
| Self-review | Mandatory before marking task complete |

### qa-engineer

Test writing. Unit tests, integration tests, coverage analysis, regression testing.

| Property | Value |
|---|---|
| Isolation | `worktree` |
| Allowed tools | Read, Edit, Write, Bash, Grep, Glob |
| Used in | `full` (implement), `feature` (implement) |

### code-reviewer

PR review and quality assessment. Reviews diffs against specs and conventions.

| Property | Value |
|---|---|
| Isolation | None |
| Memory | `project` |
| Allowed tools | Read, Grep, Glob, Bash |
| Used in | `full` (review), `feature` (review), `refactor` (analyze, review) |

### gate-reviewer

Validates phase completion. Runs as a `Stop` hook agent, not spawned by the lead.

| Property | Value |
|---|---|
| Isolation | None |
| Allowed tools | Read, Glob, Grep, Bash |
| Key behavior | Reads checklist, validates items, exits 0 (pass) or 2 (block) |

### retro-analyst

Sprint retrospective analysis. Runs automatically after every protocol completion via `Stop` hook.

| Property | Value |
|---|---|
| Isolation | None |
| Allowed tools | Read, Glob, Grep |
| Output | `.sniper/memory/retros/<protocol-id>.yaml` |

### code-archaeologist

Brownfield codebase analysis. Directory structure, dependencies, patterns, risk areas.

| Property | Value |
|---|---|
| Isolation | None |
| Allowed tools | Read, Grep, Glob, Bash |
| Used in | `ingest` (scan, document) |

## Developer Agent Patterns

### Worktree Isolation

All implementation agents (`backend-dev`, `frontend-dev`, `fullstack-dev`, `qa-engineer`) run in isolated git worktrees. Each agent gets its own branch and working directory. This enables parallel implementation without merge conflicts during execution.

Merge happens after agents complete. The framework handles three-layer merge resolution:
1. **Conflict avoidance**: The routing table assigns tasks to minimize file overlap.
2. **Automated merge**: `git merge --no-commit` of each worktree branch.
3. **Agent-assisted resolution**: If conflicts are detected, a merge-resolver agent resolves them using the specs from both tasks.

### Self-Review Mandate

Every implementation agent must self-review before marking a task complete:

1. Re-read every modified file
2. Run `{commands.test}` (from language plugin)
3. Run `{commands.lint}` (from language plugin)
4. Check changes against story acceptance criteria
5. Write a self-review summary to `.sniper/artifacts/<id>/<task-id>-self-review.md`

This is enforced by agent instructions. The gate-reviewer validates that self-review artifacts exist for every completed task.

### Agent Memory

Agents with `memory: project` build persistent memory across protocol runs. Over time:
- `backend-dev` learns codebase patterns and conventions
- `code-reviewer` learns recurring issues and focuses attention
- `architect` learns which technical decisions worked

Memory is stored in `.claude/agent-memory/<name>/` using Claude Code's native persistent memory feature.

## Cognitive Mixins

Mixins are short Markdown snippets concatenated to an agent's instructions during scaffolding. They modify behavior without changing the base agent.

### Available Mixins

| Mixin | Effect | Typical targets |
|---|---|---|
| `security-first` | Prioritizes input validation, auth checks, injection prevention, secrets management | backend-dev, fullstack-dev |
| `performance-focused` | Optimizes for query performance, bundle size, caching, lazy loading | backend-dev, frontend-dev |
| `user-empathetic` | Centers UX — loading states, error messages, accessibility, progressive disclosure | frontend-dev |
| `devils-advocate` | Challenges assumptions, finds edge cases, asks "what if this fails?" | architect, analyst |
| `mentor-explainer` | Explains decisions in code comments and artifacts, good for teams learning a codebase | all |

### Mixin Format

A mixin is a Markdown file in `packages/core/agents/mixins/`:

```markdown
# Security-First Mixin

## Additional Constraints
- Validate all external input with a schema (zod, joi, etc.) before processing
- Never log sensitive data (tokens, passwords, PII)
- Use parameterized queries — never string-concatenate SQL
- Check authentication and authorization on every route handler
- Default to deny — require explicit allow for permissions
- Run dependency audit as part of self-review
```

### Applying Mixins

In `.sniper/config.yaml`:

```yaml
agents:
  backend-dev:
    base: backend-dev
    mixins:
      - security-first
      - performance-focused
```

Run `sniper init --refresh` to regenerate the composed agent file.

## Custom Agents

Create your own agents for domain-specific roles.

### Step 1: Write the Agent File

Create `.claude/agents/payment-specialist.md`:

```markdown
---
name: payment-specialist
description: Implements payment flows, Stripe integrations, webhook handlers.
permissionMode: bypassPermissions
memory: project
isolation: worktree
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, Task
---

You are a payment systems specialist.

## Expertise
- Stripe API (PaymentIntents, Subscriptions, Webhooks, Connect)
- PCI compliance patterns
- Idempotency keys for all mutating operations
- Webhook signature verification

## Constraints
- Never log full card numbers or CVVs
- Always use Stripe's official SDK, not raw HTTP
- Webhook handlers must be idempotent

## Output
- Working, tested code committed to your worktree branch
- Update .sniper/checkpoints/ after each completed unit of work
```

### Step 2: Register in Config

Add to `.sniper/config.yaml`:

```yaml
agents:
  payment-specialist:
    base: null              # no base — using the file directly
    mixins:
      - security-first

routing:
  src/payments/**:    payment-specialist
  src/webhooks/**:    payment-specialist
```

### Step 3: Re-scaffold

```bash
sniper init --refresh
```

The new agent is now available for task routing. When a story touches `src/payments/`, the lead orchestrator assigns it to `payment-specialist`.

### Writing Effective Agent Instructions

- Keep it under 40 lines. Long instructions waste context window.
- State expertise as a bullet list, not prose.
- Include hard constraints (things the agent must never do).
- Specify output expectations (what "done" looks like).
- Do not repeat framework behavior (self-review, checkpointing) — these are already in the base agent.

## Agent Spawn Strategy

The lead orchestrator chooses how many agents to spawn based on protocol and scope:

| Work Size | Strategy | Mechanism |
|---|---|---|
| Small (patch, hotfix) | Single subagent | `Task` tool, inline context |
| Medium (feature, refactor) | 2-3 subagents | `Task` tool with `isolation: worktree`, background execution |
| Large (full, ingest) | Full Agent Team | `TeamCreate`, shared task list, inter-agent messaging |

This prevents the v2 problem of spinning up a full team for a 5-line fix.
