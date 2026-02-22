---
title: Getting Started
---

# Getting Started

This guide walks you through installing SNIPER and running your first project lifecycle.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed
- **Claude Code** installed and authenticated
- **pnpm** (recommended) or npm as your package manager

## Installation

Install the SNIPER CLI globally:

```bash
npm install -g @sniper.ai/cli
```

Or with pnpm:

```bash
pnpm add -g @sniper.ai/cli
```

Verify the installation:

```bash
sniper --version
```

## Initialize a Project

Navigate to your project directory (or create a new one) and run:

```bash
sniper init
```

The CLI will scaffold the `.sniper/` directory with all framework files:

```
.sniper/
  config.yaml           # Project configuration
  personas/             # Agent persona layers
    process/            # Role definitions (analyst, architect, developer...)
    technical/          # Technical expertise (backend, frontend, security...)
    cognitive/          # Thinking styles (systems-thinker, devils-advocate...)
    domain/             # Domain-specific context
  teams/                # Team composition YAML files
  workflows/            # Phase workflow definitions
  templates/            # Artifact output templates
  checklists/           # Review gate checklists
  spawn-prompts/        # Composed agent prompts
  domain-packs/         # Industry-specific knowledge packs
```

## Configure Your Project

Open Claude Code in your project directory and run the init command:

```
/sniper-init
```

The command walks you through an interactive configuration:

1. **Project name** -- identifies your project in artifacts
2. **Project type** -- saas, api, mobile, cli, library, or monorepo
3. **One-line description** -- what the project does
4. **Tech stack** -- language, frontend, backend, database, cache, infrastructure, test runner, package manager
5. **Domain pack** -- optional industry-specific context (e.g., sales-dialer)
6. **Review gates** -- strict, flexible, or auto for each phase transition

The defaults work well for most TypeScript/React/Node projects:

```yaml
stack:
  language: typescript
  frontend: react
  backend: node-express
  database: postgresql
  cache: redis
  infrastructure: aws
  test_runner: vitest
  package_manager: pnpm
```

Override any values that do not match your project by providing key=value pairs when prompted (e.g., `language=python backend=fastapi database=mongodb frontend=null`).

## Run Your First Discovery

With SNIPER initialized, start the discovery phase:

```
/sniper-discover
```

This spawns a 3-agent team that works in parallel:

| Agent | Persona | Output |
|-------|---------|--------|
| analyst | systems-thinker | `docs/brief.md` |
| risk-researcher | devil's-advocate | `docs/risks.md` |
| user-researcher | user-empathetic | `docs/personas.md` |

The team lead (you) enters delegate mode. The agents research independently and produce their artifacts. When all three complete, a review gate evaluates the output against the discovery checklist.

Since the discovery gate defaults to **flexible**, it auto-advances if there are no critical failures. You can review the artifacts asynchronously.

## Continue the Lifecycle

After discovery completes, the lifecycle continues through:

```
/sniper-plan      # Phase 2: PRD, architecture, UX spec, security
/sniper-solve     # Phase 3: Break PRD into epics and stories
/sniper-sprint    # Phase 4: Implement selected stories
```

Each command is run explicitly -- SNIPER never auto-advances to the next phase. You control the pace.

::: tip
Run `/sniper-status` at any time to see where you are in the lifecycle, which artifacts exist, and what to do next.
:::

## For Existing Projects

If you have an existing codebase and want to use SNIPER for incremental features, start with ingestion instead of discovery:

```
/sniper-ingest
```

This spawns a team that reverse-engineers your codebase into SNIPER artifacts:

- `docs/brief.md` -- what the project does
- `docs/architecture.md` -- system architecture as-built
- `docs/conventions.md` -- coding patterns and conventions

After ingestion, use `/sniper-feature` to add incremental features with scoped planning and implementation.

## Project Structure After Init

After running `/sniper-init`, your project will have:

```
your-project/
  .sniper/              # Framework configuration and content
    config.yaml         # Project settings, review gates, ownership rules
    personas/           # Agent persona layer files
    teams/              # Team YAML definitions
    ...
  docs/                 # Artifacts produced by phases
    epics/              # Epic files (from /sniper-solve)
    stories/            # Story files (from /sniper-solve)
  CLAUDE.md             # Claude Code instructions referencing SNIPER
```

## Next Steps

- [Core Concepts](/guide/core-concepts) -- understand the framework's building blocks
- [Configuration](/guide/configuration) -- customize every aspect of your setup
- [Full Lifecycle](/guide/full-lifecycle) -- detailed walkthrough of all four phases
