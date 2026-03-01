# @sniper.ai/cli

[![npm version](https://img.shields.io/npm/v/@sniper.ai/cli)](https://www.npmjs.com/package/@sniper.ai/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

CLI tool for scaffolding and managing [SNIPER](https://sniperai.dev/)-enabled projects.

## What is SNIPER?

SNIPER (**S**pawn, **N**avigate, **I**mplement, **P**arallelize, **E**valuate, **R**elease) is an AI-powered project lifecycle framework that orchestrates Claude Code agent teams through structured phases -- from discovery and planning through implementation and release. Each phase spawns coordinated teams of specialized agents composed from layered personas.

## Quick Start

```bash
# 1. Install the CLI globally
npm install -g @sniper.ai/cli

# 2. Initialize SNIPER in your project
sniper init

# 3. (Optional) Add a domain pack for project-specific context
sniper add-pack @sniper.ai/pack-sales-dialer

# 4. Run the lifecycle phases in Claude Code
/sniper-discover    # Phase 1: Discovery & Analysis
/sniper-plan        # Phase 2: Planning & Architecture
/sniper-solve       # Phase 3: Epic Sharding & Stories
/sniper-sprint      # Phase 4: Implementation Sprint
```

## Installation

```bash
npm install -g @sniper.ai/cli
```

## CLI Commands (Terminal)

These commands are run in your terminal to manage the SNIPER installation.

### `sniper init`

Initialize SNIPER in the current project. Scaffolds the `.sniper/` config directory, installs framework files, and sets up Claude Code slash commands.

```bash
sniper init
```

### `sniper status`

Show the current lifecycle phase, artifact state, and team status.

```bash
sniper status
```

### `sniper migrate`

Migrate a v2 SNIPER configuration to the v3 format.

```bash
sniper migrate
```

### `sniper plugin install/remove/list`

Manage language plugins (TypeScript, Python, Go).

```bash
sniper plugin install @sniper.ai/plugin-typescript
sniper plugin remove @sniper.ai/plugin-typescript
sniper plugin list
```

### `sniper knowledge`

Manage domain knowledge files for MCP-based retrieval.

```bash
sniper knowledge
```

### `sniper workspace`

Manage SNIPER workspaces for multi-repo orchestration.

```bash
sniper workspace
```

## Slash Commands (Claude Code)

Once SNIPER is initialized, these slash commands are available inside Claude Code. They drive the agent team lifecycle.

### Lifecycle

| Command | Description |
|---------|-------------|
| `/sniper-init` | Initialize SNIPER in a new or existing project |
| `/sniper-discover` | Phase 1: Discovery and analysis (parallel team) |
| `/sniper-plan` | Phase 2: Planning and architecture (parallel team with coordination) |
| `/sniper-solve` | Phase 3: Epic sharding and story creation (single agent) |
| `/sniper-sprint` | Phase 4: Implementation sprint (parallel team) |
| `/sniper-review` | Run review gate for the current phase |
| `/sniper-status` | Show lifecycle status and artifact state |

### Extended

| Command | Description |
|---------|-------------|
| `/sniper-feature` | Incremental feature lifecycle |
| `/sniper-ingest` | Codebase ingestion (parallel team) |
| `/sniper-doc` | Generate or update project documentation (parallel team) |
| `/sniper-debug` | Production debugging (phased investigation) |
| `/sniper-audit` | Audit: refactoring, review, and QA |

### Workspace

| Command | Description |
|---------|-------------|
| `/sniper-workspace init` | Initialize a SNIPER workspace |
| `/sniper-workspace feature` | Plan and execute a cross-repo feature |
| `/sniper-workspace status` | Show workspace status |
| `/sniper-workspace validate` | Validate interface contracts |

### Utility

| Command | Description |
|---------|-------------|
| `/sniper-compose` | Compose a spawn prompt from persona layers |
| `/sniper-memory` | Manage agent memory (conventions, anti-patterns, decisions) |

## How It Works

The CLI reads framework content from `@sniper.ai/core` and scaffolds it into your project's `.sniper/` directory. This gives Claude Code access to personas, team definitions, templates, and slash commands that drive the SNIPER lifecycle.

## Tech Stack

- **Runtime:** Node.js >= 18
- **CLI framework:** [citty](https://github.com/unjs/citty)
- **Prompts:** [@clack/prompts](https://github.com/bombshell-dev/clack)
- **YAML parsing:** [yaml](https://github.com/eemeli/yaml)
- **Build:** [tsup](https://github.com/egoist/tsup)

## Development

```bash
# From the monorepo root
pnpm dev    # Watch mode
pnpm build  # Production build
```

## Documentation

Full documentation is available at [sniperai.dev](https://sniperai.dev/).

## License

MIT
