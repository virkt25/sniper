---
title: Teams
description: Pre-configured agent team compositions for each lifecycle phase
---

# Teams

In v3, there are no standalone team YAML files. Instead, **protocols define which agents are spawned for each phase**. Team composition is declared directly in protocol YAML files (e.g., `full.yaml`, `feature.yaml`) alongside spawn strategy and gate configuration.

## Protocol-Driven Team Composition

Each phase in a protocol YAML defines its team inline:

```yaml
# Example from full.yaml
phases:
  discover:
    agents: [analyst]
    spawn_strategy: single
    gate:
      human_approval: false
      checklist: discover.yaml

  define:
    agents: [product-manager]
    spawn_strategy: single
    gate:
      human_approval: true
      checklist: define.yaml

  design:
    agents: [architect]
    spawn_strategy: single
    gate:
      human_approval: true
      checklist: design.yaml

  solve:
    agents: [product-manager]
    spawn_strategy: single
    gate:
      human_approval: true
      checklist: solve.yaml

  implement:
    agents: [fullstack-dev, qa-engineer]
    spawn_strategy: team
    gate:
      human_approval: false
      checklist: implement.yaml

  review:
    agents: [code-reviewer]
    spawn_strategy: single
    gate:
      human_approval: true
      checklist: review.yaml

  retro:
    agents: [retro-analyst]
    spawn_strategy: single
    gate:
      human_approval: false
      checklist: retro.yaml
```

### Phase Fields

| Field | Description |
|-------|-------------|
| `agents` | List of agent names to spawn for this phase |
| `spawn_strategy` | `single` (one agent) or `team` (multiple agents working together) |
| `gate.human_approval` | `true` = human must approve; `false` = auto-advance if no critical failures |
| `gate.checklist` | Checklist YAML file used for gate evaluation |

### Agent Definitions

Agent definitions live in `.claude/agents/` as Markdown files with YAML frontmatter specifying model, tools, and constraints. The `agents.base` list in `config.yaml` controls which agents are available to protocols.

### Cognitive Mixins

Mixins are assigned to agents via the `agents.mixins` map in `config.yaml`:

```yaml
agents:
  mixins:
    architect:
      - security-first
    code-reviewer:
      - devils-advocate
```

Mixins are short Markdown snippets in `packages/core/personas/cognitive/` that modify an agent's thinking style (e.g., `security-first`, `performance-focused`, `devils-advocate`).

## Standard Protocol Teams

### Full Protocol (`full.yaml`)

The full protocol defines seven phases with distinct team compositions:

| Phase | Agents | Spawn Strategy | Outputs |
|-------|--------|---------------|---------|
| discover | analyst | single | `docs/discovery-brief.md`, `docs/codebase-overview.md` |
| define | product-manager | single | `docs/prd.md` |
| design | architect | single | `docs/architecture.md` |
| solve | product-manager | single | `docs/stories/` |
| implement | fullstack-dev, qa-engineer | team | Code changes, tests |
| review | code-reviewer | single | Review report with scope, standards, and risk scoring |
| retro | retro-analyst | single | Retrospective report, memory updates |

### Feature Protocol (`feature.yaml`)

A scoped mini-lifecycle for single features. Skips discovery:

| Phase | Agents | Spawn Strategy |
|-------|--------|---------------|
| define | product-manager | single |
| design | architect | single |
| solve | product-manager | single |
| implement | fullstack-dev, qa-engineer | team |
| review | code-reviewer | single |
| retro | retro-analyst | single |

### Patch Protocol (`patch.yaml`)

Quick fixes that skip planning:

| Phase | Agents | Spawn Strategy |
|-------|--------|---------------|
| implement | fullstack-dev, qa-engineer | team |
| review | code-reviewer | single |

### Other Protocols

- **ingest** -- scan, document, extract phases for existing codebases
- **explore** -- discover phase only (no implementation)
- **refactor** -- analyze, implement, review for refactoring work
- **hotfix** -- implement only, no gates

## Available Agents

SNIPER v3 includes 13 agent definitions:

| Agent | Typical Role |
|-------|-------------|
| analyst | Discovery research and codebase analysis |
| architect | System architecture and technical design |
| backend-dev | Backend implementation |
| code-reviewer | Multi-faceted code review |
| doc-writer | Incremental documentation updates |
| frontend-dev | Frontend implementation |
| fullstack-dev | Full-stack implementation |
| gate-reviewer | Gate evaluation |
| lead-orchestrator | Orchestration and delegation (read-only, scoped to `.sniper/`) |
| product-manager | Requirements, PRD, and story creation |
| qa-engineer | Test writing and quality assurance |
| retro-analyst | Retrospective analysis and learning capture |
| memory-curator | Curates and maintains project memory |

## Agent Spawn Strategy

The lead orchestrator chooses how many agents to spawn based on protocol and scope:

| Work Size | Strategy | Mechanism |
|-----------|----------|-----------|
| Small (patch, hotfix) | Single subagent | `Task` tool, inline context |
| Medium (feature, refactor) | 2--3 subagents | `Task` tool with `isolation: worktree`, background execution |
| Large (full, ingest) | Full agent team | `TeamCreate`, shared task list, inter-agent messaging |

This prevents the overhead of spinning up a full team for a small fix.

## Developer Agent Patterns

### Worktree Isolation

All implementation agents (`backend-dev`, `frontend-dev`, `fullstack-dev`) run in isolated git worktrees. Each agent gets its own branch and working directory, enabling parallel implementation without merge conflicts during execution.

Merge happens after agents complete. The framework handles three-layer merge resolution:

1. **Conflict avoidance** -- The routing table assigns tasks to minimize file overlap across agents.
2. **Automated merge** -- `git merge --no-commit` of each worktree branch back to the main branch.
3. **Agent-assisted resolution** -- If conflicts are detected, a merge-resolver agent resolves them using the specs from both tasks.

### Self-Review Mandate

Every implementation agent must self-review before marking a task complete:

1. Re-read every modified file (run `git diff` to identify changes)
2. Run the project's test command
3. Run the project's lint command
4. Check changes against story acceptance criteria
5. Write a self-review summary to `.sniper/self-reviews/<agent-name>-<timestamp>.md`

This is enforced by agent instructions. The gate-reviewer validates that self-review artifacts exist for every completed task.

## File Ownership

Agents are scoped by the `ownership` section in `config.yaml`. Each ownership key maps to a list of directory paths:

```yaml
ownership:
  backend:
    - "src/backend/"
    - "src/api/"
  frontend:
    - "src/frontend/"
    - "src/components/"
```

During implementation, agents can only modify files within their assigned ownership boundaries.

## Customizing Team Composition

To customize which agents participate in a phase, modify the protocol YAML file in `packages/core/protocols/`. You can:

- **Change the agent list** -- add or remove agents from a phase
- **Change spawn strategy** -- switch between `single` and `team`
- **Adjust gate config** -- toggle `human_approval` or change the checklist
- **Add cognitive mixins** -- assign mixins to agents via `agents.mixins` in config

::: tip
Plugins can extend agent behavior via agent mixins defined in their `plugin.yaml` manifest.
:::

## Next Steps

- [Personas](/guide/personas) -- understand the persona layers that compose into teammates
- [Full Lifecycle](/guide/full-lifecycle) -- see teams in action across the lifecycle
- [Architecture](/guide/architecture) -- how agents map to Claude Code primitives
