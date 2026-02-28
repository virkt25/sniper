# SNIPER — AI-Powered Project Lifecycle Framework

SNIPER v3 orchestrates Claude Code agent teams through protocol-driven phases. The human declares intent, the framework handles decomposition, delegation, and quality assurance.

## Project Structure

This is a **pnpm monorepo** (`@sniper.ai/monorepo`):

| Package | Description |
|---------|-------------|
| `packages/core` (`@sniper.ai/core`) | Framework core — agents, skills, protocols, checklists, templates, hooks, schemas. No build step; ships raw YAML/Markdown files. |
| `packages/cli` (`@sniper.ai/cli`) | CLI tool (`sniper` binary) — scaffolds and manages SNIPER-enabled projects. Built with tsup, uses citty + @clack/prompts. |
| `packages/plugins/plugin-typescript` (`@sniper.ai/plugin-typescript`) | TypeScript language plugin — commands, conventions, review checks, agent mixins. |
| `packages/plugins/plugin-python` (`@sniper.ai/plugin-python`) | Python language plugin — pytest, ruff, mypy commands, PEP 8 conventions, agent mixins. |
| `packages/plugins/plugin-go` (`@sniper.ai/plugin-go`) | Go language plugin — go test, golangci-lint, go vet commands, Effective Go conventions, agent mixins. |
| `packages/pack-sales-dialer` (`@sniper.ai/pack-sales-dialer`) | Sales dialer domain pack (v3 plugin format) — telephony, compliance, CRM, AI pipeline knowledge. |

## Tech Stack

- **Language:** TypeScript (ES2022, ESNext modules, bundler resolution)
- **Build:** tsup (CLI package)
- **Package manager:** pnpm 9+ (workspace protocol for inter-package deps)
- **Node:** >=18
- **Versioning:** Changesets (`@changesets/cli`)

## Common Commands

```bash
pnpm build          # Build all packages
pnpm dev            # Watch mode for all packages
pnpm clean          # Clean dist directories
pnpm changeset      # Create a changeset for versioning
pnpm release        # Build + publish with changesets
```

## Key Directories

- `packages/core/agents/` — Agent definitions (`.claude/agents/*.md` format with YAML frontmatter)
- `packages/core/personas/cognitive/` — Cognitive mixins (security-first, performance-focused, devils-advocate)
- `packages/core/skills/` — Skill definitions (SKILL.md files → slash commands)
- `packages/core/protocols/` — Protocol state machines (full, feature, patch, ingest, explore, refactor, hotfix)
- `packages/core/checklists/` — Quality gate checklists
- `packages/core/templates/` — Artifact templates with token budgets
- `packages/core/hooks/` — Claude Code hook definitions
- `packages/core/schemas/` — Runtime data schemas (checkpoint, cost, live-status, retro, gate-result, velocity)
- `packages/cli/src/` — CLI source (commands, scaffolder, plugin-manager, config)
- `packages/plugins/` — Language plugins
- `docs/` — Project documentation
- `plans/` — Implementation plans

## Core Concepts

### Agents (packages/core/agents/)
Agent definitions with YAML frontmatter specifying model, tools, and constraints. Scaffolded into `.claude/agents/` in target projects. Key pattern: lead-orchestrator is read-only (Write scoped to `.sniper/` only).

### Protocols (packages/core/protocols/)
YAML state machines: `full` (discover→plan→implement→review), `feature` (plan→implement→review), `patch` (implement→review), `ingest` (scan→document→extract), `explore` (discover only), `refactor` (analyze→implement→review), `hotfix` (implement only, no gates). Each phase specifies agents, spawn strategy, and gate config.

### Skills (packages/core/skills/)
SKILL.md files that become slash commands: `/sniper-flow` (the core execution engine, replaces 5 v2 commands), `/sniper-init`, `/sniper-status`, `/sniper-review`.

### Plugins (packages/plugins/)
Language-specific extensions with `plugin.yaml` manifests defining commands, conventions, review checks, agent mixins, and hooks. Available: TypeScript, Python, Go.

### v3.1 Features

- **Velocity Calibration** — Retro-analyst records execution metrics to `.sniper/memory/velocity.yaml`. After 5+ executions of a protocol, calibrated budgets (p75) are used instead of configured defaults. Visible via `/sniper-status`.
- **Multi-Faceted Review** — Code reviewer evaluates across three dimensions: scope validation, standards enforcement, and risk scoring (critical/high/medium/low severity).
- **Multi-Model Review** — Optional gate review with multiple models. Configure `review.multi_model: true` in config. Supports consensus or majority-wins modes.
- **Trigger Tables** — Map file patterns to agents or protocols via `triggers` config. Glob-matched against changed files during auto-detection.
- **Spec Sync** — Code reviewer reconciles `docs/spec.md` with implementation reality after review (Kiro pattern).
- **Self-Healing CI** — PostToolUse hook detects test/lint failures in Bash output and instructs the agent to fix before proceeding (Aider pattern).

## SNIPER Slash Commands

- `/sniper-flow` — Execute a protocol (auto-detects scope or use `--protocol <name>`)
- `/sniper-flow --resume` — Resume an interrupted protocol
- `/sniper-init` — Initialize SNIPER v3 in a project
- `/sniper-status` — Show protocol progress and cost
- `/sniper-review` — Manually trigger a review gate

## CLI Subcommands

- `sniper init` — Interactive project initialization
- `sniper status` — Show project status
- `sniper migrate` — Migrate v2 config to v3
- `sniper plugin install/remove/list` — Manage plugins

## Development Guidelines

- Agent definitions go in `packages/core/agents/` — YAML frontmatter + Markdown instructions
- Cognitive mixins go in `packages/core/personas/cognitive/` — short Markdown snippets
- Skills go in `packages/core/skills/<name>/SKILL.md`
- Protocols go in `packages/core/protocols/*.yaml`
- CLI commands go in `packages/cli/src/commands/`
- Plugins follow the pattern in `packages/plugins/plugin-typescript/` (also: plugin-python, plugin-go)
- The `@sniper.ai/core` package has no build step; it exports raw files
- The CLI depends on core via `"@sniper.ai/core": "workspace:*"`
