---
title: Configuration
---

# Configuration

All SNIPER configuration lives in `.sniper/config.yaml`. This file is created by `/sniper-init` and updated automatically as you progress through the lifecycle.

## Project Section

Basic project identity:

```yaml
project:
  name: "my-project"         # Set during /sniper-init
  type: saas                  # saas | api | mobile | cli | library | monorepo
  description: "One-line description of the project"
```

The `type` field influences how agents approach planning and architecture. For example, a `cli` project will not generate UX specifications for browser interfaces.

## Stack Section

Defines your technology choices. Agents use this to tailor their output:

```yaml
stack:
  language: typescript        # Primary language
  frontend: react             # Frontend framework (null if none)
  backend: node-express       # Backend framework
  database: postgresql        # Primary database
  cache: redis                # Cache layer (null if none)
  infrastructure: aws         # Cloud provider
  test_runner: vitest         # Test framework
  package_manager: pnpm       # Package manager
```

Set any field to `null` if it does not apply (e.g., `frontend: null` for a CLI project).

## Review Gates

Controls how quality gates behave at each phase transition:

```yaml
review_gates:
  after_ingest: flexible      # Low risk -- auto-advance
  after_discover: flexible    # Low risk -- auto-advance
  after_plan: strict          # HIGH RISK -- bad architecture cascades
  after_solve: flexible       # Low risk -- stories can be refined later
  after_sprint: strict        # HIGH RISK -- code must be reviewed
```

Three modes are available:

| Mode | Behavior | When to Use |
|------|----------|-------------|
| `strict` | Full stop. Human must approve before next phase. | Architecture, code review |
| `flexible` | Auto-advance if no critical failures. Human reviews async. | Discovery, story creation |
| `auto` | No review gate at all. | Not recommended for most phases |

::: warning
Setting `after_plan` or `after_sprint` to `auto` is strongly discouraged. Bad architecture decisions cascade through the entire project, and unreviewed code can introduce bugs and security issues.
:::

## Agent Teams

Controls how agent teams are spawned and managed:

```yaml
agent_teams:
  max_teammates: 5            # Max concurrent teammates
  default_model: sonnet       # Model for implementation agents
  planning_model: opus        # Model for planning & architecture
  delegate_mode: true         # Lead enters delegate mode during team execution
  plan_approval: true         # Require plan approval for complex tasks
  coordination_timeout: 30    # Minutes before lead checks on stalled teammates
```

- **max_teammates** limits the number of simultaneous agents to manage token budgets
- **planning_model** is used for the plan phase, where higher quality output justifies the cost
- **plan_approval** requires agents with `plan_approval: true` in their task to describe their approach before executing
- **coordination_timeout** triggers a check-in if a teammate has not reported progress

## Domain Packs

Register domain-specific knowledge packs:

```yaml
domain_packs: []
# Example:
# domain_packs:
#   - name: "sales-dialer"
#     package: "@sniper.ai/pack-sales-dialer"
```

Domain packs provide industry-specific knowledge files, custom personas, checklists, and templates. See [Domain Packs](/guide/domain-packs) for authoring details.

## Documentation

Controls the `/sniper-doc` command behavior:

```yaml
documentation:
  output_dir: "docs/"            # Where generated docs are written
  managed_sections: true         # Use <!-- sniper:managed --> protocol
  include:                       # Default doc types to generate
    - readme
    - setup
    - architecture
    - api
  exclude: []                    # Doc types to skip
```

The `managed_sections` protocol allows SNIPER to update specific sections of documentation files without overwriting manual edits. Sections wrapped in `<!-- sniper:managed -->` markers are regenerated; content outside those markers is preserved.

## Memory

Configures the agent memory and learning system:

```yaml
memory:
  enabled: true               # Enable memory system
  auto_retro: true            # Auto-run retrospective after sprint completion
  auto_codify: true           # Auto-codify high-confidence retro findings
  token_budget: 2000          # Max tokens for memory layer in spawn prompts
```

When enabled, the memory system tracks conventions, anti-patterns, and decisions that agents learn over time. The `token_budget` controls how much memory context is included in spawn prompts -- if memory exceeds the budget, entries are prioritized by severity and enforcement level.

See [Memory System](/guide/memory) for details on how memory works.

## Workspace

Configures multi-repo orchestration:

```yaml
workspace:
  enabled: false              # Set true when part of a workspace
  workspace_path: null        # Relative path to workspace root
  repo_name: null             # This repo's name in the workspace
```

When `enabled: true`, the agent memory system also loads workspace-level conventions, and agents are aware of cross-repo dependencies.

See [Workspace Mode](/guide/workspace-mode) for setup and usage.

## File Ownership

Defines which directories belong to which role. These boundaries are injected into spawn prompts to prevent teammates from editing each other's files:

```yaml
ownership:
  backend:
    - "src/backend/"
    - "src/api/"
    - "src/services/"
    - "src/db/"
    - "src/workers/"
  frontend:
    - "src/frontend/"
    - "src/components/"
    - "src/hooks/"
    - "src/styles/"
    - "src/pages/"
  infrastructure:
    - "docker/"
    - ".github/"
    - "infra/"
    - "terraform/"
    - "scripts/"
  tests:
    - "tests/"
    - "__tests__/"
    - "*.test.*"
    - "*.spec.*"
  ai:
    - "src/ai/"
    - "src/ml/"
    - "src/pipeline/"
  docs:
    - "docs/"
```

::: tip
After running `/sniper-ingest`, the convention-miner agent automatically updates ownership paths to match your actual project structure. Review the updated paths after ingestion.
:::

Customize these paths to match your project layout. During sprints, each teammate is mapped to an ownership key via the `owns_from_config` field in the team YAML.

## Lifecycle State

The `state` section is managed automatically by SNIPER commands. Do not edit it manually.

```yaml
schema_version: 2

state:
  phase_log: []               # History of all phase runs
  current_sprint: 0           # Current sprint number

  artifacts:                  # Status and version of each artifact
    brief:
      status: null            # null | draft | approved
      version: 0
    risks: { status: null, version: 0 }
    personas: { status: null, version: 0 }
    prd: { status: null, version: 0 }
    architecture: { status: null, version: 0 }
    ux_spec: { status: null, version: 0 }
    security: { status: null, version: 0 }
    conventions: { status: null, version: 0 }
    epics: { status: null, version: 0 }
    stories: { status: null, version: 0 }

  feature_counter: 1          # Next SNPR-XXXX ID
  features: []                # Feature lifecycle entries
  bug_counter: 1              # Next BUG-NNN ID
  bugs: []                    # Bug tracking entries
  refactor_counter: 1         # Next REF-NNN ID
  refactors: []               # Refactor tracking entries
  reviews: []                 # Review entries
  test_audit_counter: 1       # Next TST-NNN ID
  test_audits: []             # Test audit entries
  security_audit_counter: 1   # Next SEC-NNN ID
  security_audits: []         # Security audit entries
  perf_audit_counter: 1       # Next PERF-NNN ID
  perf_audits: []             # Performance audit entries
  retro_counter: 0            # Number of retrospectives run
  last_retro_sprint: 0        # Last sprint with a retrospective
```

The `phase_log` array records every phase execution with context, timestamps, and approval status:

```yaml
phase_log:
  - phase: discover
    context: "initial"
    started_at: "2026-02-20T10:00:00Z"
    completed_at: "2026-02-20T10:15:00Z"
    approved_by: "auto-flexible"
```

## Next Steps

- [Full Lifecycle](/guide/full-lifecycle) -- see how configuration affects each phase
- [Review Gates](/guide/review-gates) -- detailed gate configuration and checklists
- [Memory System](/guide/memory) -- configure and use the learning system
