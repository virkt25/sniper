---
title: Core Concepts
description: Protocols, agents, phases, gates, and the primitives that make SNIPER work
---

# Core Concepts

SNIPER is built on a set of interlocking concepts. Understanding these will help you get the most out of the framework.

## Phases

A phase is a distinct stage in the project lifecycle. Each phase has a specific purpose, a team composition, defined outputs, and a review gate.

### Standard Phases

All phases are executed through `/sniper-flow`, the core protocol engine. Individual phase commands (`/sniper-discover`, `/sniper-plan`, etc.) are convenience shortcuts.

| Phase | Command | Team Size | Outputs | Gate |
|-------|---------|-----------|---------|------|
| **Discover** | `/sniper-flow` or `/sniper-discover` | 3 agents (parallel) | brief, risks, personas | Flexible |
| **Plan** | `/sniper-flow` or `/sniper-plan` | 4 agents (with dependencies) | PRD, architecture, UX spec, security | Strict |
| **Solve** | `/sniper-flow` or `/sniper-solve` | 1 agent (sequential) | epics, stories | Flexible |
| **Sprint** | `/sniper-flow` or `/sniper-sprint` | 2-5 agents (parallel) | source code, tests | Strict |

### Additional Phases

| Phase | Command | Purpose |
|-------|---------|---------|
| **Ingest** | `/sniper-ingest` | Reverse-engineer artifacts from existing code |
| **Feature** | `/sniper-feature` | Scoped mini-lifecycle for a single feature |
| **Debug** | `/sniper-debug` | Structured bug investigation and fix |
| **Audit** | `/sniper-audit` | Refactoring, reviews, tests, security, performance |

Phases are tracked in the `state.phase_log` array in `.sniper/config.yaml`. Each entry records when it started, when it completed, and who approved it.

## Personas

Personas define who an agent is. They are composed from four independent layers, each stored as a markdown file:

### Process Layer (Required)

Defines the agent's role in the project lifecycle. Examples:

- [**analyst**](/reference/personas/process/analyst) -- researches markets, competitors, and user needs
- [**architect**](/reference/personas/process/architect) -- designs system architecture and component boundaries
- [**developer**](/reference/personas/process/developer) -- implements stories following architecture patterns
- [**qa-engineer**](/reference/personas/process/qa-engineer) -- writes and runs tests, validates acceptance criteria
- [**product-manager**](/reference/personas/process/product-manager) -- writes PRDs and requirement specifications
- [**scrum-master**](/reference/personas/process/scrum-master) -- shards PRDs into epics and stories
- [**ux-designer**](/reference/personas/process/ux-designer) -- defines information architecture and user flows

### Technical Layer (Optional)

Adds domain-specific technical expertise:

- [**backend**](/reference/personas/technical/backend) -- Node.js/TypeScript, Express, PostgreSQL, Redis, queues
- [**frontend**](/reference/personas/technical/frontend) -- React, component hierarchy, responsive design
- [**infrastructure**](/reference/personas/technical/infrastructure) -- Docker, Terraform, CI/CD, cloud providers
- [**security**](/reference/personas/technical/security) -- auth models, encryption, compliance, threat modeling
- [**ai-ml**](/reference/personas/technical/ai-ml) -- AI pipelines, model integration, real-time APIs
- [**database**](/reference/personas/technical/database) -- schema design, migrations, query optimization
- [**api-design**](/reference/personas/technical/api-design) -- REST contracts, versioning, validation

### Cognitive Layer (Optional)

Shapes how the agent thinks and prioritizes:

- [**systems-thinker**](/reference/personas/cognitive/systems-thinker) -- focuses on boundaries, interfaces, dependencies, and scaling
- [**devils-advocate**](/reference/personas/cognitive/devils-advocate) -- challenges assumptions, identifies what could go wrong
- [**user-empathetic**](/reference/personas/cognitive/user-empathetic) -- prioritizes user experience, friction points, accessibility
- [**security-first**](/reference/personas/cognitive/security-first) -- evaluates every decision through a security lens
- [**performance-focused**](/reference/personas/cognitive/performance-focused) -- optimizes for speed, efficiency, and resource usage
- [**mentor-explainer**](/reference/personas/cognitive/mentor-explainer) -- produces clear, educational documentation

### Domain Layer (Optional)

Injects industry-specific knowledge from a domain pack. For example, the `sales-dialer` pack provides telephony, CRM integration, and compliance context.

### Composition

The `/sniper-compose` command merges these layers into a single spawn prompt using a template:

```
/sniper-compose --process architect --technical backend --cognitive security-first --name "Backend Architect" --ownership backend
```

This reads each persona file, fills the spawn prompt template, and saves the composed prompt to `.sniper/spawn-prompts/backend-architect.md`.

## Teams

A team is a YAML definition that specifies which agents to spawn for a phase, what tasks they perform, and how they coordinate.

```yaml
# Example: discover.yaml
team_name: sniper-discover
phase: discover

teammates:
  - name: analyst
    compose:
      process: analyst
      technical: null
      cognitive: systems-thinker
      domain: null
    tasks:
      - id: market-research
        name: "Market Research & Competitive Analysis"
        output: "docs/brief.md"
        template: ".sniper/templates/brief.md"

  - name: risk-researcher
    compose:
      process: analyst
      technical: infrastructure
      cognitive: devils-advocate
      domain: null
    tasks:
      - id: risk-assessment
        output: "docs/risks.md"
```

Key fields:

- **compose** -- which persona layers to merge for this teammate
- **tasks** -- what they produce, with output paths and template references
- **blocked_by** -- task dependencies (the architect is blocked by the PRD)
- **plan_approval** -- whether the team lead must approve the agent's approach first
- **coordination** -- pairs of teammates that need to align (e.g., architect and security analyst)

## Spawn Prompts

A spawn prompt is the fully assembled instruction given to an agent when it is created. It contains:

1. The merged persona layers (process + technical + cognitive + domain)
2. Project memory (conventions, anti-patterns, decisions)
3. File ownership boundaries
4. Task-specific instructions and context
5. Sprint rules and coordination partners

The spawn prompt template lives at `.sniper/spawn-prompts/_template.md` and has placeholders like `{process_layer}`, `{technical_layer}`, `{ownership}` that get filled during composition.

## Artifacts

Artifacts are the documents and code produced by each phase. They persist on disk in the `docs/` directory:

| Phase | Artifacts |
|-------|-----------|
| Discover | `docs/brief.md`, `docs/risks.md`, `docs/personas.md` |
| Plan | `docs/prd.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/security.md` |
| Solve | `docs/epics/E01-*.md` through `docs/epics/ENN-*.md`, `docs/stories/S01-*.md` through `docs/stories/SNN-*.md` |
| Sprint | Source code and test files in the project's source directories |
| Ingest | `docs/brief.md`, `docs/architecture.md`, `docs/conventions.md` |

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

The default configuration uses **strict** gates for planning and sprint phases (where bad decisions are costly) and **flexible** gates for discovery and solve phases (where output can be refined later).

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

When a sprint teammate is spawned, their ownership boundaries are injected into their spawn prompt. The agent is instructed to only modify files within those boundaries.

## Next Steps

- [Configuration](/guide/configuration) -- customize every section of config.yaml
- [Full Lifecycle](/guide/full-lifecycle) -- detailed walkthrough of all phases
- [Personas](/guide/personas) -- deep dive into the persona composition system
- [Teams](/guide/teams) -- understand team YAML structure and coordination
