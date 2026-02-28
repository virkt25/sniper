---
title: Getting Started
description: Install SNIPER, scaffold your project, and run your first protocol in under five minutes
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

## Run Your First Protocol

With SNIPER initialized, launch the core execution engine:

```
/sniper-flow
```

SNIPER auto-detects the right protocol based on your project state. For a new project, it selects the **full** protocol and starts with discovery. You can also be explicit:

```
/sniper-flow --protocol full
```

The discovery phase spawns three agents working in parallel:

| Agent | Role | Cognitive Mixin | Output |
|-------|------|-----------------|--------|
| analyst | Research & analysis | [devils-advocate](/reference/personas/cognitive/devils-advocate) | `docs/spec.md` |
| analyst | Codebase scanning | [performance-focused](/reference/personas/cognitive/performance-focused) | `docs/codebase-overview.md` |

The lead-orchestrator enters delegate mode. The agents research independently and produce their artifacts. When all complete, a review gate evaluates the output against the [discover](/reference/checklists/discover) checklist.

Since the discovery gate defaults to <span class="gate-flexible">FLEXIBLE</span>, it auto-advances if there are no critical failures. You can review the artifacts asynchronously.

## Continue the Lifecycle

After discovery completes, the lifecycle continues through plan, solve, and sprint phases. You have two ways to advance:

### Option A: Use `/sniper-flow` (Recommended)

`/sniper-flow` remembers your protocol state. Just run it again and it picks up from where you left off:

```
/sniper-flow              # Auto-detects next phase
/sniper-flow --resume     # Explicitly resume from last checkpoint
```

### Option B: Specify the Protocol Explicitly

You can also target a specific protocol directly:

```
/sniper-flow --protocol full        # Run the full lifecycle (discover → plan → implement → review)
/sniper-flow --protocol feature     # Scoped feature work (plan → implement → review)
/sniper-flow --protocol patch       # Quick fix (implement → review)
```

Each phase requires an explicit `/sniper-flow` invocation -- SNIPER never auto-advances to the next phase. You control the pace.

::: tip
Run `/sniper-status` at any time to see where you are in the lifecycle, which artifacts exist, and what to do next.
:::

## For Existing Projects

If you have an existing codebase and want to use SNIPER for incremental features, start with ingestion instead of discovery:

```
/sniper-flow --protocol ingest
```

This spawns a team that reverse-engineers your codebase into SNIPER artifacts:

- `docs/brief.md` -- what the project does
- `docs/architecture.md` -- system architecture as-built
- `docs/conventions.md` -- coding patterns and conventions

After ingestion, use `/sniper-flow --protocol feature` to add incremental features with scoped planning and implementation.

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
    epics/              # Epic files (from plan phase)
    stories/            # Story files (from plan phase)
  CLAUDE.md             # Claude Code instructions referencing SNIPER
```

## Next Steps

- [Core Concepts](/guide/core-concepts) -- understand the framework's building blocks
- [Configuration](/guide/configuration) -- customize every aspect of your setup
- [Full Lifecycle](/guide/full-lifecycle) -- detailed walkthrough of all four phases
