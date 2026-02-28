---
title: Teams
description: Pre-configured agent team compositions for each lifecycle phase
---

# Teams

Teams define which agents are spawned for each phase, what tasks they perform, how they coordinate, and what review gate applies. Team definitions are YAML files in `.sniper/teams/`.

## Team YAML Structure

Every team YAML file follows this structure:

```yaml
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
        description: >
          Research the market landscape...

coordination: []

review_gate:
  checklist: ".sniper/checklists/discover-review.md"
  mode: flexible
```

### Top-Level Fields

| Field | Description |
|-------|-------------|
| `team_name` | Identifier for the team (used in TeamCreate) |
| `phase` | Which lifecycle phase this team serves |
| `model_override` | Optional model override for all teammates (e.g., `opus` for the plan phase) |

### Teammate Fields

| Field | Description |
|-------|-------------|
| `name` | Teammate identifier (used for messaging and task assignment) |
| `compose` | Persona layer selections for spawn prompt composition |
| `compose.process` | Process persona name (required) |
| `compose.technical` | Technical persona name (null if not needed) |
| `compose.cognitive` | Cognitive persona name |
| `compose.domain` | Domain context name (null or from pack) |
| `tasks` | List of tasks this teammate performs |
| `owns_from_config` | Ownership key from config.yaml (sprint teams only) |
| `model` | Model override for this specific teammate |

### Task Fields

| Field | Description |
|-------|-------------|
| `id` | Unique task identifier within the team |
| `name` | Human-readable task name |
| `output` | File path where the task's output is written |
| `template` | Path to the template the agent should follow |
| `reads` | Files the agent must read before starting |
| `blocked_by` | List of task IDs that must complete first |
| `plan_approval` | If true, agent must describe their approach and wait for lead approval |
| `description` | Detailed task instructions |

### Coordination

Coordination entries define which teammates need to align during execution:

```yaml
coordination:
  - between: [architect, security-analyst]
    topic: "Align security architecture with system architecture"
  - between: [architect, ux-designer]
    topic: "Align frontend component boundaries with backend API contracts"
```

The team lead facilitates these conversations by prompting teammates to share relevant work and provide feedback.

### Review Gate

```yaml
review_gate:
  checklist: ".sniper/checklists/plan-review.md"
  mode: strict
```

The `mode` in the team YAML is the default. It can be overridden by the `review_gates` section in `config.yaml`.

## Standard Teams

### Discover Team

**File:** `.sniper/teams/discover.yaml`

Three parallel agents with no inter-task dependencies:

- **analyst** (process/analyst + cognitive/systems-thinker) -- produces `docs/brief.md`
- **risk-researcher** (process/analyst + technical/infrastructure + cognitive/devils-advocate) -- produces `docs/risks.md`
- **user-researcher** (process/analyst + cognitive/user-empathetic) -- produces `docs/personas.md`

All tasks run independently. No coordination needed.

### Plan Team

**File:** `.sniper/teams/plan.yaml`

Four agents with dependency management:

- **product-manager** starts immediately, producing `docs/prd.md`
- **architect**, **ux-designer**, and **security-analyst** are all blocked by the PRD task
- The architect has `plan_approval: true`
- Two coordination pairs: architect/security-analyst and architect/ux-designer

Uses `model_override: opus` for higher-quality planning output.

### Solve Team

**File:** `.sniper/teams/solve.yaml`

Not a team -- a single agent definition. The solve phase runs as a single scrum master who produces epics and stories directly.

```yaml
team_name: null
phase: solve

agent:
  compose:
    process: scrum-master
    cognitive: systems-thinker
  tasks:
    - id: epic-sharding
      output: "docs/epics/"
    - id: story-creation
      output: "docs/stories/"
      blocked_by: [epic-sharding]
```

### Sprint Team

**File:** `.sniper/teams/sprint.yaml`

A pool of `available_teammates` from which the needed subset is selected:

- **backend-dev** (process/developer + technical/backend + cognitive/systems-thinker) -- owns backend dirs, uses sonnet
- **frontend-dev** (process/developer + technical/frontend + cognitive/user-empathetic) -- owns frontend dirs, uses sonnet
- **infra-dev** (process/developer + technical/infrastructure + cognitive/systems-thinker) -- owns infrastructure dirs, uses sonnet
- **ai-dev** (process/developer + technical/ai-ml + cognitive/performance-focused) -- owns ai dirs, uses opus
- **qa-engineer** (process/qa-engineer + technical/backend + cognitive/devils-advocate) -- owns test dirs, uses sonnet

Sprint teams are dynamic -- SNIPER determines which teammates are needed based on the selected stories' file ownership. QA engineer is always included.

The sprint team also defines `sprint_rules` that apply to all execution:

- Teammates read story files completely before writing code
- Backend and frontend agree on API contracts before implementing
- All new code must include tests
- QA is blocked until implementation completes

### Doc Team

**File:** `.sniper/teams/doc.yaml`

Three agents for documentation generation:

- **doc-analyst** -- scans codebase and produces a documentation index
- **doc-writer** -- generates README and guides (blocked by the analysis)
- **doc-reviewer** -- validates generated docs (blocked by the writing)

## Task Dependencies

Tasks can declare dependencies using `blocked_by`, which references other task IDs:

```yaml
tasks:
  - id: architecture
    blocked_by: [prd]
    plan_approval: true
```

The team lead manages these dependencies:
1. Blocked tasks start in `pending` status
2. When blocking tasks complete, the lead unblocks dependent tasks
3. Tasks transition to `in_progress` when unblocked

Dependencies must form a DAG (Directed Acyclic Graph) -- circular dependencies are not allowed.

## File Ownership in Sprint Teams

Sprint teammates have an `owns_from_config` field that maps to the `ownership` section in `config.yaml`:

```yaml
- name: backend-dev
  owns_from_config: backend    # Maps to ownership.backend paths
```

This means the backend-dev agent can only modify files in `src/backend/`, `src/api/`, `src/services/`, `src/db/`, and `src/workers/`.

## Customizing Teams

You can modify team YAML files to change:

- **Team composition** -- add or remove teammates
- **Persona layers** -- change which personas are composed
- **Task assignments** -- reassign work or add new tasks
- **Coordination pairs** -- define new alignment requirements
- **Dependencies** -- restructure the task execution order

::: tip
Domain packs can extend teams via `team_overrides` in their `pack.yaml`. For example, the sales-dialer pack adds a compliance-analyst to the plan team.
:::

## Next Steps

- [Personas](/guide/personas) -- understand the persona layers that compose into teammates
- [Full Lifecycle](/guide/full-lifecycle) -- see teams in action across the lifecycle
- [Architecture](/guide/architecture) -- how agents map to Claude Code primitives
