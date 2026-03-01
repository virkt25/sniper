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

# 3. (Optional) Install a language plugin
sniper plugin install @sniper.ai/plugin-typescript

# 4. Run the lifecycle in Claude Code
/sniper-flow                # Auto-detect and run appropriate protocol
/sniper-flow --protocol full  # Or specify a protocol explicitly
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

| Command | Description |
|---------|-------------|
| `/sniper-flow` | Execute a SNIPER protocol (auto-detects scope or use `--protocol <name>`) |
| `/sniper-flow-headless` | Execute a protocol non-interactively for CI/CD environments |
| `/sniper-init` | Initialize SNIPER v3 in a new or existing project |
| `/sniper-review` | Manually trigger a review gate for the current phase |
| `/sniper-status` | Show current protocol progress and cost |

`/sniper-flow` is the core execution engine. It runs any of the 7 protocols: `full`, `feature`, `patch`, `ingest`, `explore`, `refactor`, `hotfix`.

## How It Works

The CLI reads framework content from `@sniper.ai/core` and scaffolds it into your project's `.sniper/` directory. This gives Claude Code access to agents, protocols, templates, and slash commands that drive the SNIPER lifecycle.

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
