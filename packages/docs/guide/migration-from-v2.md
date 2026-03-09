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
| Agent system | Persona markdown files (50--150 lines, layered composition) | Agent definitions with YAML frontmatter (`.claude/agents/*.md`) |
| Spawn prompts | Assembly step to compose persona layers | Eliminated -- agents are self-contained |
| Slash commands | 300--700 line slash commands | Skills (`.claude/commands/*/SKILL.md`), under 100 lines each |
| State management | Config file `state` section | Checkpoints, live-status, and phase logs |
| Quality gates | Simple pass/fail checklists | Multi-faceted review (scope, standards, risk) with severity scoring |
| Gate enforcement | Checklist-based enforcement | Hook-enforced gates -- deterministic, hooks block advancement on failure |
| Learning | Manual memory management | Auto-capture signals, retrospectives |
| Checkpointing | No checkpointing | Checkpoint/recovery system in `.sniper/checkpoints/` |
| CI/CD | Not supported | `sniper run` headless mode with structured output |
| Protocols | Implicit (always full lifecycle) | 7 built-in protocols + custom protocol support |
| Domain packs | `pack/` directories | Plugins (`@sniper.ai/plugin-*`) with standardized `plugin.yaml` interface |
| Plugins | Domain packs only | Language plugins + domain packs |
| File ownership | Ownership boundaries | Expertise routing hints -- agents work in worktrees, routing is advisory |
| Phase model | Linear phase model | Flow-based execution -- protocol selects phases, agents run continuously |
| Team composition | Manual team YAMLs (`framework/teams/`) | Protocols (`protocols/*.yaml`) auto-select team composition |
| Review trigger | `/sniper-review` (manual) | Gate hooks (automatic) -- `Stop` hooks fire review gates |

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
  auto_retro: true
```

### Key Additions in v3

| Feature | Description |
|---------|-------------|
| `agents` section | Configure which agents are available, their models, and behavior |
| `routing` section | Auto-detection rules for protocol selection |
| `review.multi_model` | Enable multi-model consensus review |
| `ownership` section | File ownership boundaries (moved from team YAML) |
| `plugins` section | Language plugin registry |
| `visibility` section | Control live status, checkpoints, retros |
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

## Converting Custom v2 Personas

If you wrote custom persona files in v2, convert them to v3 agents.

**v2 persona** (`framework/personas/technical/my-specialist.md`):

```markdown
# My Specialist Persona

## Role
You are a payment systems specialist...

## Responsibilities
- Design payment flows
- Implement Stripe integrations
...
```

**v3 agent** (`.claude/agents/payment-specialist.md`):

```markdown
---
name: payment-specialist
description: Implements payment flows and Stripe integrations.
permissionMode: bypassPermissions
memory: project
isolation: worktree
skills:
  - code-conventions
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, Task
---

You are a payment systems specialist. You implement payment flows
and Stripe integrations following project conventions.

## Expertise
- Primary: Stripe API, payment flows, webhook handlers, refund logic
- Always: PCI compliance considerations, idempotency keys, error recovery

## Output
- Working, tested code committed to your worktree branch
- Update .sniper/checkpoints/ after each completed unit of work
```

Key differences:

- YAML frontmatter replaces prose role descriptions
- `allowed-tools` explicitly scopes what the agent can do
- `isolation: worktree` gives the agent its own git worktree
- Instructions are concise -- 20--30 lines, not 100+

## Converting Domain Packs to Plugins

v2 domain packs become v3 plugins with a `plugin.yaml` manifest.

**v2 pack** (`packages/pack-sales-dialer/pack/`):

```
pack/
  domain-knowledge.md
  telephony-patterns.md
  crm-integration.md
```

**v3 plugin** (e.g., `my-sales-dialer-plugin/`):

```
plugin.yaml
mixins/
  telephony.md
  crm-integration.md
conventions/
  telephony-patterns.md
review_checks/
  telephony-review.yaml
```

The `plugin.yaml` declares what the plugin provides:

```yaml
name: sales-dialer
type: domain
version: 1.0.0
provides:
  agent_mixins:
    - telephony
    - crm-integration
  conventions:
    - telephony-patterns
  review_checks:
    - no-hardcoded-phone-numbers
    - crm-sync-validation
```

Install with:

```bash
sniper plugin install pack-sales-dialer
```

## FAQ

**Can I keep using v2 commands like `/sniper-sprint`?**

No. v2 commands are removed. Use `/sniper-flow` which auto-selects the appropriate protocol.

**What happens to my existing `.sniper/` artifacts from v2 runs?**

They are preserved in `.sniper/v2-backup/` after migration. v3 uses a different artifact structure under `.sniper/artifacts/<protocol-id>/`.

**Do I need to re-scaffold every time I change config?**

Run `sniper init --refresh` to re-scaffold `.claude/` files from your updated config. This regenerates agents with current mixin composition.

**Can I still manually select a protocol?**

Yes. `/sniper-flow --protocol full` overrides auto-selection.

## Next Steps

- [Getting Started](/guide/getting-started) -- v3 walkthrough from scratch
- [Configuration](/guide/configuration) -- understand every v3 config section
- [Core Concepts](/guide/core-concepts) -- v3 architecture overview
