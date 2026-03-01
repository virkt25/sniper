---
title: Configuration
description: Configure .sniper/config.yaml — agents, protocols, budgets, gates, triggers, and plugins
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
  infrastructure: aws         # Cloud provider
  test_runner: vitest         # Test framework
  package_manager: pnpm       # Package manager
  commands:                   # Shell commands agents use
    test: "pnpm test"
    lint: "pnpm lint"
    typecheck: "pnpm typecheck"
    build: "pnpm build"
```

Set any field to `null` if it does not apply (e.g., `frontend: null` for a CLI project). The `commands` block tells agents how to run tests, lint, typecheck, and build your project.

## Review Gates

In v3, gates are configured **per-phase inside protocol YAML files**, not in `config.yaml`. Each phase in a protocol defines a `gate` block with a `human_approval` boolean:

```yaml
# Example from a protocol YAML phase definition
phases:
  plan:
    agents: [architect, product-manager]
    spawn_strategy: team
    gate:
      human_approval: true    # true = human must approve; false = auto-advance
      checklist: plan.yaml
```

When `human_approval: true`, the lifecycle halts and waits for explicit human approval before advancing. When `false`, the gate auto-advances if there are no critical failures.

::: warning
Disabling `human_approval` on plan or review phases is strongly discouraged. Bad architecture decisions cascade through the entire project, and unreviewed code can introduce bugs and security issues.
:::

## Agents

Controls how agent teams are spawned and managed:

```yaml
agents:
  default_model: sonnet          # Model for implementation agents
  planning_model: opus           # Model for planning & architecture
  max_teammates: 5               # Max concurrent teammates
  plan_approval: true            # Require plan approval for complex tasks
  coordination_timeout: 30       # Minutes before lead checks on stalled teammates
  base:                          # Base agent set available to protocols
    - analyst
    - architect
    - product-manager
    - fullstack-dev
    - code-reviewer
    - qa-engineer
  mixins:                        # Cognitive mixin assignments per agent
    architect:
      - security-first
    code-reviewer:
      - devils-advocate
    qa-engineer:
      - devils-advocate
```

- **default_model** is used for implementation and review agents
- **planning_model** is used for the plan phase, where higher quality output justifies the cost
- **max_teammates** limits the number of simultaneous agents to manage token budgets
- **plan_approval** requires agents to describe their approach before executing
- **coordination_timeout** triggers a check-in if a teammate has not reported progress
- **base** lists the agent names available to protocols (must match agent definitions in `.claude/agents/`)
- **mixins** maps agent names to lists of cognitive mixin names (e.g., `security-first`, `devils-advocate`, `performance-focused`)

## Plugins

Register language and domain plugins:

```yaml
plugins:
  - name: typescript
    package: "@sniper.ai/plugin-typescript"
  - name: sales-dialer
    package: "@sniper.ai/pack-sales-dialer"
```

Plugins provide language-specific commands, conventions, review checks, agent mixins, and domain knowledge. Manage plugins via the CLI:

```bash
sniper plugin install @sniper.ai/plugin-typescript
sniper plugin remove @sniper.ai/plugin-typescript
sniper plugin list
```

## Routing

Controls protocol auto-detection and token budgets:

```yaml
routing:
  auto_detect:
    patch_max_files: 3          # Max changed files to auto-select patch protocol
    feature_max_files: 10       # Max changed files to auto-select feature protocol
  default: full                 # Default protocol when auto-detect is inconclusive
  budgets:                      # Token budgets per protocol (overridden by velocity calibration after 5+ runs)
    full: 200000
    feature: 100000
    patch: 30000
```

When you run `/sniper-flow` without specifying a protocol, SNIPER uses these thresholds to auto-detect the right protocol scope based on changed files.

## Cost

Controls cost tracking and guardrails:

```yaml
cost:
  warn_threshold: 5.00        # Warn when cumulative cost exceeds this (USD)
  soft_cap: 15.00             # Prompt for confirmation before continuing
  hard_cap: 50.00             # Abort execution at this threshold
```

Cost is tracked per protocol execution in `.sniper/checkpoints/`. Use `/sniper-status` to view current cost.

## Review (Optional)

Configures multi-model review for gate evaluations:

```yaml
review:
  multi_model: true            # Enable multi-model review
  models:                      # Models to use for review consensus
    - sonnet
    - opus
  require_consensus: true      # true = all models must agree; false = majority wins
```

When `multi_model` is enabled, gate evaluations are run by multiple models and results are compared. This catches model-specific blind spots.

## Workspace

Configures multi-repo orchestration:

```yaml
workspace:
  ref: "../workspace-root"    # Relative path to workspace root
```

When set, agents are aware of cross-repo dependencies and workspace-level conventions.

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
After running `/sniper-flow --protocol ingest`, the framework automatically updates ownership paths to match your actual project structure. Review the updated paths after ingestion.
:::

Customize these paths to match your project layout. During implementation, each agent's file access is scoped by these ownership boundaries.

## Visibility

Controls what runtime data SNIPER tracks and displays:

```yaml
visibility:
  live_status: true           # Show real-time agent status during execution
  checkpoints: true           # Save phase checkpoints to .sniper/checkpoints/
  cost_tracking: true         # Track token usage and cost per protocol run
  auto_retro: true            # Auto-run retrospective after protocol completion
```

When `auto_retro` is enabled, the retro-analyst agent records execution metrics to `.sniper/memory/velocity.yaml` after each protocol run. After 5+ executions, calibrated budgets (p75) replace configured defaults.

## Triggers (Optional)

Map file patterns to agents or protocols for auto-detection:

```yaml
triggers:
  - pattern: "src/api/**"
    agent: backend-dev
  - pattern: "*.test.*"
    agent: qa-engineer
  - pattern: "docs/**"
    protocol: explore
```

Triggers are glob-matched against changed files during auto-detection. They influence which agents are spawned and which protocol is selected.

## Knowledge (Optional)

Configure external knowledge injection into agent prompts:

```yaml
knowledge:
  directory: ".sniper/knowledge"   # Directory containing knowledge files
  manifest: "manifest.yaml"        # Knowledge manifest file
  max_total_tokens: 4000           # Max tokens from knowledge in spawn prompts
```

## MCP Knowledge (Optional)

Configure MCP-based knowledge indexing:

```yaml
mcp_knowledge:
  enabled: false
  directory: ".sniper/knowledge"
  auto_index: true
```

## Headless (Optional)

Configure headless (CI/automation) execution:

```yaml
headless:
  auto_approve_gates: false       # Auto-approve all gates (use in CI only)
  output_format: json             # Output format: json | text
  log_level: info                 # Log level: debug | info | warn | error
  timeout_minutes: 60             # Max execution time before abort
  fail_on_gate_failure: true      # Exit non-zero if a gate fails
```

Headless mode is designed for CI pipelines where no human is available to approve gates.

## Next Steps

- [Full Lifecycle](/guide/full-lifecycle) -- see how configuration affects each phase
- [Review Gates](/guide/review-gates) -- detailed gate configuration and checklists
- [Getting Started](/guide/getting-started) -- quick start guide
