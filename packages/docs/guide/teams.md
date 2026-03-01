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

  plan:
    agents: [architect, product-manager]
    spawn_strategy: team
    gate:
      human_approval: true
      checklist: plan.yaml

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

The full protocol defines four phases with distinct team compositions:

| Phase | Agents | Spawn Strategy | Outputs |
|-------|--------|---------------|---------|
| discover | analyst | single | `docs/spec.md`, `docs/codebase-overview.md` |
| plan | architect, product-manager | team | `docs/architecture.md`, `docs/prd.md`, `docs/stories/` |
| implement | fullstack-dev, qa-engineer | team | Code changes, tests |
| review | code-reviewer | single | Review report with scope, standards, and risk scoring |

### Feature Protocol (`feature.yaml`)

A scoped mini-lifecycle for single features. Skips discovery:

| Phase | Agents | Spawn Strategy |
|-------|--------|---------------|
| plan | architect, product-manager | team |
| implement | fullstack-dev, qa-engineer | team |
| review | code-reviewer | single |

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

SNIPER v3 includes 11 agent definitions:

| Agent | Typical Role |
|-------|-------------|
| analyst | Discovery research and codebase analysis |
| architect | System architecture and technical design |
| backend-dev | Backend implementation |
| code-reviewer | Multi-faceted code review |
| frontend-dev | Frontend implementation |
| fullstack-dev | Full-stack implementation |
| gate-reviewer | Gate evaluation |
| lead-orchestrator | Orchestration and delegation (read-only, scoped to `.sniper/`) |
| product-manager | Requirements, PRD, and story creation |
| qa-engineer | Test writing and quality assurance |
| retro-analyst | Retrospective analysis and velocity tracking |

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
