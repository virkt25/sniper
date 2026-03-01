---
title: Core Concepts
description: Protocols, agents, phases, gates, and the primitives that make SNIPER work
---

# Core Concepts

SNIPER is built on a set of interlocking concepts. Understanding these will help you get the most out of the framework.

## Phases

A phase is a distinct stage in the project lifecycle. Each phase has a specific purpose, agents assigned to it, defined outputs, and a review gate.

All phases are executed through `/sniper-flow`, the core protocol engine. There are no standalone phase commands -- `/sniper-flow` auto-detects the appropriate protocol or you specify one explicitly with `--protocol <name>`.

### Phase Catalog

| Phase | Used In | Agents | Outputs | Gate |
|-------|---------|--------|---------|------|
| **discover** | full, explore | analyst | spec, codebase overview | Flexible |
| **plan** | full, feature | architect, product-manager | architecture, PRD, stories | Strict |
| **implement** | full, feature, patch, refactor, hotfix | fullstack-dev, qa-engineer | source code, tests | Flexible |
| **review** | full, feature, patch, refactor | code-reviewer | review report | Strict |
| **scan** | ingest | analyst | codebase overview | Auto |
| **document** | ingest | analyst | spec | Auto |
| **extract** | ingest | analyst | conventions | Auto |
| **analyze** | refactor | analyst | spec | Auto |

Phases are tracked in the `state.phase_log` array in `.sniper/config.yaml`. Each entry records when it started, when it completed, and who approved it.

## Protocols

A protocol is a YAML state machine that chains phases together into a complete workflow. SNIPER ships seven built-in protocols:

| Protocol | Command | Phases | Use Case |
|----------|---------|--------|----------|
| **full** | `/sniper-flow` | discover &rarr; plan &rarr; implement &rarr; review | Greenfield projects, major features |
| **feature** | `/sniper-flow --protocol feature` | plan &rarr; implement &rarr; review | Incremental feature on an existing codebase |
| **patch** | `/sniper-flow --protocol patch` | implement &rarr; review | Bug fix or small change |
| **ingest** | `/sniper-flow --protocol ingest` | scan &rarr; document &rarr; extract | Reverse-engineer artifacts from existing code |
| **explore** | `/sniper-flow --protocol explore` | discover | Read-only codebase analysis |
| **refactor** | `/sniper-flow --protocol refactor` | analyze &rarr; implement &rarr; review | Code improvement and cleanup |
| **hotfix** | `/sniper-flow --protocol hotfix` | implement | Critical fix, no gates |

When you run `/sniper-flow` without `--protocol`, the lead-orchestrator auto-detects the best protocol based on your intent. Use `--protocol <name>` to override. Interrupted protocols can be resumed with `/sniper-flow --resume`.

See [Custom Protocols](/guide/custom-protocols) for how to define your own.

## Agents

In v3, agents are defined as standalone files in `packages/core/agents/`. Each agent has a YAML frontmatter specifying its model, tools, and constraints, followed by Markdown instructions. The 11 built-in agents are:

- **lead-orchestrator** — coordinates agent teams, read-only (only writes to `.sniper/`)
- **analyst** — researches markets, competitors, and user needs during discovery
- **architect** — designs system architecture and component boundaries
- **product-manager** — writes PRDs and requirement specifications
- **backend-dev** — implements backend logic, APIs, and data layers
- **frontend-dev** — implements UI components, client-side logic
- **fullstack-dev** — handles cross-cutting concerns spanning front and back
- **qa-engineer** — writes and runs tests, validates acceptance criteria
- **code-reviewer** — reviews code quality, patterns, and standards
- **gate-reviewer** — evaluates phase artifacts against quality checklists
- **retro-analyst** — records execution metrics and produces retrospectives

## Cognitive Personas

Cognitive personas are optional mixins that shape _how_ an agent thinks. They overlay a reasoning style onto any agent:

- [**devils-advocate**](/reference/personas/cognitive/devils-advocate) — challenges assumptions, identifies what could go wrong
- [**security-first**](/reference/personas/cognitive/security-first) — evaluates every decision through a security lens
- [**performance-focused**](/reference/personas/cognitive/performance-focused) — optimizes for speed, efficiency, and resource usage

### Domain Packs

Domain packs inject industry-specific knowledge into agents. For example, the `sales-dialer` pack provides telephony, CRM integration, and compliance context.

### Applying Cognitive Personas

Configure a cognitive persona on any agent in `.sniper/config.yaml`:

```yaml
agents:
  architect:
    cognitive: security-first
```

When a phase launches the architect agent, the lead-orchestrator merges the `security-first` cognitive mixin into the agent's spawn prompt at runtime.

## Teams

When a protocol phase requires multiple agents, SNIPER spawns a team using Claude Code's `TeamCreate` and `Task` tools. The protocol YAML defines which agents participate and how they coordinate.

```yaml
# From protocols/full.yaml — plan phase
- name: plan
  description: Architecture design, PRD creation, story breakdown
  agents:
    - architect
    - product-manager
  spawn_strategy: team  # Multiple agents, use TeamCreate
  coordination:
    - between: [architect, product-manager]
      topic: Architecture must be approved before stories reference it
  gate:
    checklist: plan
    human_approval: true
  outputs:
    - docs/architecture.md
    - docs/prd.md
    - docs/stories/
```

Key fields:

- **agents** -- which agent definitions to spawn for this phase
- **spawn_strategy** -- `single` (one agent, no team) or `team` (multiple agents via TeamCreate)
- **coordination** -- pairs of agents that must align before proceeding
- **plan_approval** -- whether the lead-orchestrator must approve each agent's approach before coding
- **gate** -- the quality checklist and whether human sign-off is required

## Spawn Prompts

A spawn prompt is the fully assembled instruction given to an agent when it is created. It combines:

1. The agent definition (from `packages/core/agents/`)
2. An optional cognitive mixin (e.g., `security-first`, `devils-advocate`)
3. An optional domain pack (e.g., `sales-dialer`)
4. Project memory (conventions, anti-patterns, decisions from `.sniper/memory/`)
5. File ownership boundaries
6. Task-specific instructions and context
7. Coordination partners from the protocol definition

The lead-orchestrator assembles spawn prompts at runtime when launching agents for each phase.

## Artifacts

Artifacts are the documents and code produced by each phase. They persist on disk in the `docs/` directory:

| Phase | Artifacts |
|-------|-----------|
| discover | `docs/spec.md`, `docs/codebase-overview.md` |
| plan | `docs/architecture.md`, `docs/prd.md`, `docs/stories/` |
| implement | Source code and test files in the project's source directories |
| review | `docs/review-report.md` |
| ingest (scan) | `docs/codebase-overview.md` |
| ingest (document) | `docs/spec.md` |
| ingest (extract) | `.sniper/conventions.yaml` |

Each artifact's status (null, draft, approved) and version number are tracked in `state.artifacts` in the config file.

::: tip
Artifacts persist on disk between phase runs. If a phase is re-run, agents enter amendment mode -- updating existing artifacts rather than starting from scratch. Completed stories are never overwritten.
:::

## Review Gates

Review gates are quality checkpoints between phases. Each gate has:

- **A checklist** -- markdown file with specific criteria to evaluate
- **A mode** -- strict, flexible, or auto
- **Evaluation results** -- PASS, WARN, or FAIL for each criterion

### Gate Modes

| Mode | Behavior |
|------|----------|
| **strict** | Full stop. Human must explicitly approve. Cannot be skipped. |
| **flexible** | Auto-advance if no failures. Human reviews asynchronously. |
| **auto** | No gate. Advances immediately. Not recommended for architecture or code. |

The default configuration uses **strict** gates for plan and review phases (where bad decisions are costly) and **flexible** gates for discover and implement phases (where output can be refined later).

See [Review Gates](/guide/review-gates) for detailed configuration and checklist examples.

## File Ownership

File ownership rules prevent agents from stepping on each other's work. Each teammate is assigned directories they can modify:

```yaml
ownership:
  backend:
    - "src/backend/"
    - "src/api/"
    - "src/services/"
    - "src/db/"
  frontend:
    - "src/frontend/"
    - "src/components/"
    - "src/hooks/"
  tests:
    - "tests/"
    - "*.test.*"
```

When an implement-phase agent is spawned, their ownership boundaries are injected into their spawn prompt. The agent is instructed to only modify files within those boundaries.

## Next Steps

- [Configuration](/guide/configuration) -- customize every section of config.yaml
- [Full Lifecycle](/guide/full-lifecycle) -- detailed walkthrough of all phases
- [Personas](/guide/personas) -- deep dive into the persona composition system
- [Teams](/guide/teams) -- understand team YAML structure and coordination
