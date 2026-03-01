---
title: Migration from v2
description: Step-by-step guide to migrating SNIPER v2 projects to the v3 architecture
---

# Migration from v2

SNIPER v3 is a ground-up rewrite. This guide covers what changed, how to migrate, and what to expect.

## Quick Migration

```bash
sniper migrate
```

The CLI reads your v2 `.sniper/config.yaml`, maps fields to the v3 schema, and writes a new configuration. Your v2 config is backed up to `.sniper/config.v2.yaml`.

## What Changed

### Architecture

| Aspect | v2 | v3 |
|--------|----|----|
| Execution model | Separate slash commands per phase | `/sniper-flow` unified engine with protocol selection |
| Agent system | Persona markdown files | Agent definitions with YAML frontmatter + persona composition |
| State management | Config file `state` section | Checkpoints, live-status, and phase logs |
| Quality gates | Simple pass/fail checklists | Multi-faceted review (scope, standards, risk) with severity scoring |
| Learning | Manual memory management | Auto-capture signals, velocity calibration, retrospectives |
| CI/CD | Not supported | `sniper run` headless mode with structured output |
| Protocols | Implicit (always full lifecycle) | 7 built-in protocols + custom protocol support |
| Plugins | Domain packs only | Language plugins + domain packs |

### Command Mapping

| v2 Command | v3 Equivalent |
|------------|---------------|
| `/sniper-discover` | `/sniper-flow --protocol full` (runs discover phase automatically) |
| `/sniper-plan` | `/sniper-flow --protocol full` (runs plan phase automatically) |
| `/sniper-solve` | Removed — story sharding is now part of the implement phase |
| `/sniper-sprint` | `/sniper-flow --protocol full` (runs implement phase automatically) |
| `/sniper-init` | `/sniper-init` (unchanged) |
| `/sniper-status` | `/sniper-status` (unchanged) |
| `/sniper-review` | `/sniper-review` (unchanged) |
| (new) | `/sniper-flow` — unified protocol engine that replaces all phase commands |
| (new) | `/sniper-flow --protocol feature` — scoped feature lifecycle |
| (new) | `/sniper-flow --protocol ingest` — codebase reverse-engineering |
| (new) | `/sniper-flow --protocol hotfix` — emergency fixes without gates |
| (new) | `/sniper-flow --protocol refactor` — refactoring with safety analysis |
| (new) | `/sniper-flow --protocol explore` — discovery/research only |
| (new) | `/sniper-flow --protocol patch` — small changes and bug fixes |
| (new) | `/sniper-flow-headless` — CI/CD non-interactive execution |

### Configuration Changes

**v2 config structure:**

```yaml
project:
  name: my-project
  type: saas
stack:
  language: typescript
review_gates:
  after_discover: flexible
  after_plan: strict
  after_sprint: strict
domain_packs:
  - sales-dialer
```

**v3 config structure:**

```yaml
project:
  name: my-project
  type: saas
  description: "Project description"

stack:
  language: typescript
  frontend: react
  backend: node-express
  database: postgresql
  test_runner: vitest
  package_manager: pnpm
  commands:
    test: "npx vitest run"
    lint: "npx eslint ."
    typecheck: "npx tsc --noEmit"

agents:
  max_teammates: 5
  plan_approval: true
  base:
    - lead-orchestrator
    - analyst
    - architect
    - product-manager
    - backend-dev
    - frontend-dev
    - fullstack-dev
    - qa-engineer
    - code-reviewer
    - gate-reviewer
    - retro-analyst

routing:
  auto_detect:
    patch_max_files: 5
    feature_max_files: 20
  default: feature
  budgets:
    full: 2000000
    feature: 800000
    patch: 200000

cost:
  warn_threshold: 0.7
  soft_cap: 0.9
  hard_cap: 1.0

review:
  multi_model: false

ownership:
  backend: ["src/backend/", "src/api/"]
  frontend: ["src/frontend/", "src/components/"]
  tests: ["tests/", "*.test.*"]

plugins:
  - name: typescript
    package: "@sniper.ai/plugin-typescript"

visibility:
  live_status: true
  checkpoints: true
  cost_tracking: true
  auto_retro: true
```

### Key Additions in v3

| Feature | Description |
|---------|-------------|
| `agents` section | Configure which agents are available, their models, and behavior |
| `routing` section | Auto-detection rules and token budgets per protocol |
| `cost` section | Token budget thresholds for warnings and hard stops |
| `review.multi_model` | Enable multi-model consensus review |
| `ownership` section | File ownership boundaries (moved from team YAML) |
| `plugins` section | Language plugin registry |
| `visibility` section | Control live status, checkpoints, cost tracking, retros |
| `triggers` section | Map file patterns to agents or protocols |
| `knowledge` section | External knowledge injection |
| `headless` section | CI/CD configuration |
| `workspace` section | Multi-repo workspace reference |

## Directory Structure Changes

**v2:**

```
.sniper/
  config.yaml
  personas/
    process/
    technical/
    cognitive/
    domain/
  teams/
  templates/
  checklists/
  spawn-prompts/
  domain-packs/
```

**v3:**

```
.sniper/
  config.yaml
  agents/              # Agent definitions (new)
  protocols/           # Protocol state machines (new)
  skills/              # Skill definitions (new)
  personas/
    process/
    technical/
    cognitive/
    domain/
  teams/
  templates/
  checklists/
  hooks/               # Hook definitions (new)
  schemas/             # Data schemas (new)
  memory/              # Runtime memory (new)
    conventions/
    anti-patterns/
    decisions/
    signals/           # Auto-captured signals (new)
    velocity.yaml      # Execution metrics (new)
  spawn-prompts/
  domain-packs/
  live-status.yaml     # Active protocol status (new)
  gates/               # Gate evaluation results (new)
```

## Migration Steps

### 1. Update the CLI

```bash
npm install -g @sniper.ai/cli@latest
```

### 2. Run the Migration

```bash
sniper migrate
```

This automatically:

- Backs up your v2 config to `.sniper/config.v2.yaml`
- Maps v2 fields to v3 schema
- Creates new required directories (`agents/`, `protocols/`, `hooks/`, `memory/`)
- Scaffolds agent definitions from `@sniper.ai/core`
- Preserves your persona customizations
- Preserves your domain pack configuration

### 3. Install Language Plugin

If you had language-specific conventions in v2, install the appropriate plugin:

```bash
sniper plugin install @sniper.ai/plugin-typescript
# or
sniper plugin install @sniper.ai/plugin-python
# or
sniper plugin install @sniper.ai/plugin-go
```

### 4. Verify Configuration

```bash
sniper status
```

Review the output to confirm your project settings, agent roster, and protocol routing are correct.

### 5. Test with a Patch

Run a small protocol to verify everything works:

```
/sniper-flow --protocol patch
```

## Breaking Changes

1. **State tracking** -- v2 tracked state in `config.yaml`. v3 uses separate checkpoint files in `.sniper/memory/`. Old state data is not migrated.

2. **Review gates** -- v2 used simple `after_discover: flexible` keys. v3 uses a `review` section with multi-model support. The migration maps old values to new format.

3. **Team YAML** -- v2 team files may have different field names. v3 team files use `compose` blocks for persona composition. Teams are regenerated from `@sniper.ai/core` during migration.

4. **Spawn prompts** -- v2 spawn prompts are regenerated during migration. If you had custom spawn prompts, review them after migration.

## Next Steps

- [Getting Started](/guide/getting-started) -- v3 walkthrough from scratch
- [Configuration](/guide/configuration) -- understand every v3 config section
- [Core Concepts](/guide/core-concepts) -- v3 architecture overview
