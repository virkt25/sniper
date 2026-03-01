# SNIPER v3 Migration Guide

Migrating from v2 to v3. This guide covers what changed, what breaks, and how to move.

---

## What Changed: Concept Mapping

| v2 Concept | v3 Replacement | Notes |
|---|---|---|
| Personas (50-150 line Markdown, layered composition) | Agents (`.claude/agents/*.md` with YAML frontmatter) | Shorter, directly usable by Claude Code |
| Team YAMLs (`framework/teams/`) | Protocols (`protocols/*.yaml`) | Protocols auto-select team composition |
| Spawn prompts | Eliminated | Agents are self-contained; no assembly step |
| 300-700 line slash commands | Skills (`.claude/commands/*/SKILL.md`) | Leaner, <100 lines each |
| Domain packs (`pack/` directories) | Plugins (`@sniper.ai/plugin-*`) | Same content, standardized interface via `plugin.yaml` |
| `/sniper-sprint`, `/sniper-discover`, `/sniper-plan` | `/sniper-flow` (unified entry point) | Protocol auto-selection replaces manual phase commands |
| `/sniper-review` (manual) | Gate hooks (automatic) | `Stop` hooks fire review gates automatically |
| Checklist-based enforcement | Hook-enforced gates | Deterministic — hooks block advancement on failure |
| No checkpointing | Checkpoint/recovery system | `.sniper/checkpoints/` with event logs and snapshots |
| File ownership boundaries | Expertise routing hints | Agents work in worktrees, can touch any file; routing is advisory |
| Linear phase model | Flow-based execution | Protocol selects phases; agents run continuously |

## Breaking Changes

1. **All v2 framework files are replaced.** The `framework/` directory structure (personas, teams, workflows, spawn-prompts, commands) does not exist in v3. Replaced by `agents/`, `skills/`, `protocols/`, `hooks/`.

2. **Slash commands renamed and consolidated.**
   - `/sniper-discover`, `/sniper-plan`, `/sniper-solve`, `/sniper-sprint` are gone. Use `/sniper-flow` instead.
   - `/sniper-compose` is gone. Agent composition happens at scaffold time via config.
   - `/sniper-review` still exists but is supplemented by automatic gate hooks.
   - `/sniper-init` and `/sniper-status` remain with updated behavior.

3. **Config schema changed.** `.sniper/config.yaml` has a new schema. Key differences:
   - `ownership` section replaced by `routing` (advisory, not enforced)
   - New `agents` section with `base` + `mixins` composition
   - New `cost.budgets` section for token budget enforcement
   - New `visibility` section for progress notification settings
   - `plugins` section replaces `packs`

4. **`.claude/` directory is now the primary output.** v3 scaffolds directly into `.claude/agents/`, `.claude/commands/`, and `.claude/settings.json`. The `.sniper/` directory holds config, checkpoints, artifacts, and memory — not framework content.

5. **Team YAMLs eliminated.** v2 required manually defined team compositions per phase. v3 protocols define agent requirements declaratively; the lead orchestrator spawns agents based on protocol needs and routing config.

6. **Persona layering replaced by mixins.** v2 composed personas from process + technical + cognitive + domain layers at spawn time. v3 composes agents at scaffold time by concatenating base agent instructions with mixin snippets.

## Step-by-Step Migration

### 1. Install v3

```bash
pnpm add -D @sniper.ai/cli@3 @sniper.ai/core@3
```

### 2. Run the Migration Command

```bash
sniper migrate
```

This command:
- Reads your existing `.sniper/config.yaml`
- Detects installed domain packs
- Generates a new v3-format `config.yaml`
- Scaffolds `.claude/agents/` from your persona configuration
- Scaffolds `.claude/commands/` with v3 skills
- Configures `.claude/settings.json` with gate hooks
- Backs up your v2 `.sniper/` directory to `.sniper/v2-backup/`

### 3. Review the Generated Config

Open `.sniper/config.yaml` and verify:

```yaml
# Check that agent composition matches your intent
agents:
  backend-dev:
    base: backend-dev
    mixins:
      - security-first       # was cognitive persona layer
      - your-domain-mixin    # was domain pack content

# Check routing matches your old ownership rules
routing:
  src/api/**:        backend-dev
  src/components/**:  frontend-dev

# Set token budgets (new in v3)
cost:
  budgets:
    full: 2000000
    feature: 800000
    patch: 200000
```

### 4. Review Generated Agents

Check `.claude/agents/` files. Each agent should have:
- Correct `allowed-tools` (lead has no Edit/Bash; devs have full access)
- Correct `isolation: worktree` for implementation agents
- Your custom instructions preserved from v2 persona overrides

### 5. Install Language Plugins

v3 extracts language-specific behavior into plugins:

```bash
sniper plugin install typescript    # if your project uses TS
sniper plugin install python        # if your project uses Python
```

### 6. Test with a Patch Protocol

Run a small change to verify the setup:

```bash
# In Claude Code, run:
/sniper-flow "Fix the typo in the README"
```

This should auto-select the `patch` protocol, spawn a single agent, and complete without team overhead.

### 7. Clean Up

Once verified, remove the v2 backup:

```bash
rm -rf .sniper/v2-backup
```

Remove old v2 framework files if they exist outside `.sniper/`:

```bash
rm -rf framework/    # if present at project root
```

## Converting Custom v2 Personas

If you wrote custom persona files in v2, convert them to v3 agents:

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

You are a payment systems specialist. You implement payment flows and Stripe integrations following project conventions.

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
- Instructions are concise — 20-30 lines, not 100+

## Converting Domain Packs to Plugins

v2 domain packs become v3 plugins with a `plugin.yaml` manifest:

**v2 pack** (`packages/pack-sales-dialer/pack/`):
```
pack/
  domain-knowledge.md
  telephony-patterns.md
  crm-integration.md
```

**v3 plugin** (`packages/plugin-sales-dialer/`):
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

**Q: Can I keep using v2 commands like `/sniper-sprint`?**
No. v2 commands are removed. Use `/sniper-flow` which auto-selects the appropriate protocol.

**Q: What happens to my existing `.sniper/` artifacts from v2 runs?**
They are preserved in `.sniper/v2-backup/` after migration. v3 uses a different artifact structure under `.sniper/artifacts/<protocol-id>/`.

**Q: Do I need to re-scaffold every time I change config?**
Run `sniper init --refresh` to re-scaffold `.claude/` files from your updated config. This regenerates agents with current mixin composition.

**Q: Can I still manually select a protocol?**
Yes. `/sniper-flow --protocol full` overrides auto-selection.
