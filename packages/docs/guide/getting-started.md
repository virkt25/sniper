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

The CLI will scaffold the project directories with all framework files:

```
.sniper/
  checkpoints/          # Phase checkpoint data
  gates/                # Gate evaluation results
  retros/               # Retrospective records
  self-reviews/         # Self-review outputs
  protocols/            # Protocol state and progress
  knowledge/            # Knowledge files for agent context
  memory/
    signals/            # Velocity and execution signals
  checklists/           # Review gate checklists (.yaml files)
  config.yaml           # Project configuration
.claude/
  agents/               # Agent definitions (Markdown with YAML frontmatter)
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
4. **Tech stack** -- language, frontend, backend, database, infrastructure, test runner, package manager, commands
5. **Plugins** -- optional language and domain plugins (e.g., `@sniper.ai/plugin-typescript`)
6. **Review gates** -- configured per-phase in protocol YAML with `human_approval: boolean`

The defaults work well for most TypeScript/React/Node projects:

```yaml
stack:
  language: typescript
  frontend: react
  backend: node-express
  database: postgresql
  infrastructure: aws
  test_runner: vitest
  package_manager: pnpm
  commands:
    test: "pnpm test"
    lint: "pnpm lint"
    typecheck: "pnpm typecheck"
    build: "pnpm build"
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

The discovery phase spawns a single agent:

| Agent | Spawn Strategy | Output |
|-------|---------------|--------|
| analyst | single | `docs/spec.md`, `docs/codebase-overview.md` |

The lead-orchestrator enters delegate mode. The analyst researches the project scope and produces its artifacts. When complete, a review gate evaluates the output against the [discover](/reference/checklists/discover) checklist.

Since the discovery gate defaults to <span class="gate-flexible">FLEXIBLE</span>, it auto-advances if there are no critical failures. You can review the artifacts asynchronously.

## Continue the Lifecycle

After discovery completes, the lifecycle continues through plan, implement, and review phases. You have two ways to advance:

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

- `docs/codebase-overview.md` -- existing codebase structure and technology inventory
- `docs/spec.md` -- what the project does, its scope, and constraints

After ingestion, use `/sniper-flow --protocol feature` to add incremental features with scoped planning and implementation.

## Project Structure After Init

After running `/sniper-init`, your project will have:

```
your-project/
  .sniper/              # Framework configuration and runtime data
    config.yaml         # Project settings, agents, routing, ownership
    checkpoints/        # Phase checkpoint data
    gates/              # Gate evaluation results
    checklists/         # Review gate checklists (.yaml)
    ...
  .claude/
    agents/             # Agent definitions
  docs/                 # Artifacts produced by phases
    stories/            # Story files (from plan phase)
  CLAUDE.md             # Claude Code instructions referencing SNIPER
```

## Next Steps

- [Core Concepts](/guide/core-concepts) -- understand the framework's building blocks
- [Configuration](/guide/configuration) -- customize every aspect of your setup
- [Full Lifecycle](/guide/full-lifecycle) -- detailed walkthrough of all four phases
