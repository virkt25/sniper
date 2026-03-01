---
title: Commands Reference
description: All SNIPER v3 slash commands for Claude Code — protocol execution, initialization, status, and review
---

# Commands Reference

SNIPER v3 provides five slash commands invoked in Claude Code. The core command is `/sniper-flow`, which replaces v2's per-phase commands with a single protocol execution engine.

## Commands

| Command | Description |
|---------|-------------|
| [`/sniper-flow`](/reference/commands/sniper-flow) | Execute a protocol — auto-detects scope or use `--protocol <name>` |
| [`/sniper-flow-headless`](/reference/commands/sniper-flow-headless) | Execute a protocol non-interactively for CI/CD environments |
| [`/sniper-init`](/reference/commands/sniper-init) | Initialize SNIPER v3 in a new or existing project |
| [`/sniper-review`](/reference/commands/sniper-review) | Manually trigger a review gate for the current phase |
| [`/sniper-status`](/reference/commands/sniper-status) | Show current protocol progress and cost |

## Quick Start

```bash
# Initialize SNIPER in your project
/sniper-init

# Run the full lifecycle (auto-detects scope)
/sniper-flow

# Run a specific protocol
/sniper-flow --protocol feature
/sniper-flow --protocol patch
/sniper-flow --protocol ingest

# Resume an interrupted protocol
/sniper-flow --resume

# Check progress
/sniper-status
```

## Protocols

`/sniper-flow` executes one of seven protocols. Use `--protocol <name>` to pick one explicitly, or let SNIPER auto-detect from your project state.

| Protocol | Phases | Use Case |
|----------|--------|----------|
| `full` | discover → plan → implement → review | Greenfield projects, major features |
| `feature` | plan → implement → review | Adding features to existing projects |
| `patch` | implement → review | Small changes, bug fixes |
| `ingest` | scan → document → extract | Reverse-engineering existing codebases |
| `explore` | discover | Research and analysis only |
| `refactor` | analyze → implement → review | Code refactoring with safety analysis |
| `hotfix` | implement | Emergency fixes, no gates |

## Command Flow

All commands follow this pattern:

1. **State check** — verify SNIPER is initialized and determine the current phase
2. **Protocol selection** — auto-detect or use the specified protocol
3. **Agent spawning** — spawn specialized agents defined by the protocol
4. **Phase execution** — agents produce artifacts within token budgets
5. **Quality gate** — review checklist evaluation before advancing

::: tip
Run `/sniper-status` at any time to see where you are in the lifecycle and what to do next.
:::

## Related

- [Full Lifecycle](/guide/full-lifecycle) — how phases connect end-to-end
- [Review Gates](/guide/review-gates) — quality gates between phases
- [Headless & CI/CD](/guide/headless-ci) — running protocols in CI pipelines
- [CLI Commands](/reference/cli/) — `sniper` binary subcommands
