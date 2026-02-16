# SNIPER — AI-Powered Project Lifecycle Framework

SNIPER (Spawn, Navigate, Implement, Parallelize, Evaluate, Release) is a framework for orchestrating Claude Code agent teams through structured project phases.

## Project Structure

This is a **pnpm monorepo** (`@sniperai/monorepo`) with three packages:

| Package | Description |
|---------|-------------|
| `packages/core` (`@sniperai/core`) | Framework core — personas, teams, templates, checklists, workflows, and spawn prompts. No build step; ships raw YAML/Markdown files via `framework/` exports. |
| `packages/cli` (`@sniperai/cli`) | CLI tool (`sniper` binary) — scaffolds and manages SNIPER-enabled projects. Built with tsup, uses citty + @clack/prompts. |
| `packages/pack-sales-dialer` (`@sniperai/pack-sales-dialer`) | Example domain pack — sales dialer SaaS domain knowledge (telephony, CRM, OpenAI Realtime API, Follow Up Boss). |

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
pnpm lint           # Lint all packages
pnpm changeset      # Create a changeset for versioning
pnpm release        # Build + publish with changesets
```

## Key Directories

- `packages/core/framework/` — The framework content (personas, teams, workflows, templates, checklists, spawn-prompts, commands)
- `packages/cli/src/` — CLI source (commands, scaffolder, pack-manager, config)
- `packages/pack-sales-dialer/pack/` — Domain pack content
- `.sniper/` — Local SNIPER config (used when developing SNIPER itself with SNIPER)
- `docs/` — Project documentation
- `plans/` — Implementation plans

## Framework Content (packages/core/framework/)

These are the YAML/Markdown files that get scaffolded into target projects:

- `personas/` — Agent persona layers (role definitions, expertise)
- `teams/` — Team compositions for each phase (who gets spawned, dependencies)
- `workflows/` — Phase workflow definitions
- `templates/` — Artifact templates (PRD, architecture, stories, etc.)
- `checklists/` — Quality gate checklists for review
- `spawn-prompts/` — Pre-composed spawn prompts for agent roles
- `commands/` — Slash command definitions
- `config.template.yaml` — Template for `.sniper/config.yaml`
- `claude-md.template` — Template for target project CLAUDE.md
- `settings.template.json` — Template for Claude Code settings

## SNIPER Slash Commands

These commands drive the project lifecycle:

- `/sniper-init` — Initialize SNIPER in a new project
- `/sniper-discover` — Phase 1: Discovery & Analysis (parallel team)
- `/sniper-plan` — Phase 2: Planning & Architecture (parallel team)
- `/sniper-solve` — Phase 3: Epic Sharding & Story Creation (sequential)
- `/sniper-sprint` — Phase 4: Implementation Sprint (parallel team)
- `/sniper-review` — Run review gate for current phase
- `/sniper-compose` — Create a spawn prompt from persona layers
- `/sniper-doc` — Generate or update project documentation (parallel team)
- `/sniper-status` — Show lifecycle status and artifact state

## Development Guidelines

- When adding new framework content, place it in `packages/core/framework/`
- When adding CLI commands, add them in `packages/cli/src/commands/`
- Domain packs follow the pattern in `packages/pack-sales-dialer/` — a `pack/` directory with domain-specific YAML/Markdown
- The `@sniperai/core` package has no build step; it exports raw files. Do not add a build process to it.
- The CLI depends on core via `"@sniperai/core": "workspace:*"`

## Agent Teams Rules

When using SNIPER commands that spawn agent teams:

1. Read the relevant team YAML from `packages/core/framework/teams/`
2. Compose spawn prompts using `/sniper-compose` with the layers specified in the YAML
3. Assign file ownership boundaries from `config.yaml` ownership rules
4. Create tasks with dependencies from the team YAML
5. Enter delegate mode (Shift+Tab) — the lead coordinates, it does not code
6. Require plan approval for tasks marked `plan_approval: true`
7. When a phase completes, run `/sniper-review` before advancing
