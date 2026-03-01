---
title: Commands Cheatsheet
description: Quick reference for all SNIPER slash commands and CLI subcommands
---

# Commands Cheatsheet

Quick reference for every SNIPER v3 command. For detailed usage, see the [commands reference](/reference/commands/).

## Slash Commands

In v3, all work flows through five slash commands. The core engine (`/sniper-flow`) selects a protocol and drives agent teams through structured phases automatically.

| Command | Purpose |
|---------|---------|
| [`/sniper-flow`](#sniper-flow) | Core execution engine -- runs any protocol |
| [`/sniper-flow-headless`](#sniper-flow-headless) | Non-interactive execution for CI/CD pipelines |
| [`/sniper-init`](#sniper-init) | Scaffold `.sniper/` directory and project config |
| [`/sniper-review`](#sniper-review) | Manually trigger a quality gate review |
| [`/sniper-status`](#sniper-status) | Show protocol progress, cost, and velocity |

---

## `/sniper-flow` {#sniper-flow}

The core protocol execution engine. Orchestrates agent teams through structured phases. Auto-detects the appropriate protocol from your request, or accepts an explicit `--protocol` flag.

**Arguments:**

| Flag | Description |
|------|-------------|
| `--protocol <name>` | Run a specific protocol (`full`, `feature`, `patch`, `ingest`, `explore`, `refactor`, `hotfix`) |
| `--resume` | Resume from the last checkpoint |
| `--phase <name>` | Start from a specific phase (skips earlier phases) |

**Usage examples:**

```
/sniper-flow                        # Auto-detect protocol from request
/sniper-flow --protocol full        # Full lifecycle (discover -> plan -> implement -> review)
/sniper-flow --protocol feature     # Feature mini-lifecycle (plan -> implement -> review)
/sniper-flow --protocol patch       # Quick bug fix (implement -> review)
/sniper-flow --protocol ingest      # Reverse-engineer an existing codebase
/sniper-flow --protocol explore     # Exploratory analysis only
/sniper-flow --protocol refactor    # Code improvement (analyze -> implement -> review)
/sniper-flow --protocol hotfix      # Emergency fix, fastest path to production
/sniper-flow --resume               # Resume from last checkpoint
/sniper-flow --phase plan           # Jump to a specific phase
```

**Auto-detection rules:**

| Scope | Protocol |
|-------|----------|
| New project (no source files) | `full` |
| Critical / urgent / production fix | `hotfix` |
| Bug fix or small change (< 5 files) | `patch` |
| New feature or enhancement (5--20 files) | `feature` |
| Major rework or multi-component change (20+ files) | `full` |
| Understand / document an existing codebase | `ingest` |
| Exploratory analysis or research | `explore` |
| Code improvement, no new features | `refactor` |

---

## `/sniper-flow-headless` {#sniper-flow-headless}

Non-interactive variant of `/sniper-flow` for CI/CD pipelines and automation. Same phase execution loop, but all interactive decisions are resolved automatically.

**Arguments:**

| Flag | Description |
|------|-------------|
| `--protocol <name>` | Protocol to run (required) |
| `--output <format>` | Output format: `json`, `yaml`, or `text` |
| `--auto-approve` | Auto-approve all quality gates |
| `--timeout <minutes>` | Maximum execution time in minutes |

**Exit codes:**

| Code | Meaning |
|------|---------|
| `0` | Success -- all phases and gates passed |
| `1` | Gate failure -- a blocking gate check failed |
| `2` | Cost exceeded -- token usage hit the hard cap |
| `3` | Timeout -- execution exceeded the `--timeout` duration |
| `4` | Config error -- invalid config, missing protocol, or initialization failure |

---

## `/sniper-init` {#sniper-init}

Scaffold the `.sniper/` directory, detect your project stack, and walk through interactive configuration.

**Arguments:**

| Flag | Description |
|------|-------------|
| `--language <name>` | Primary language (auto-detected if omitted) |

**Creates:**

| Path | Contents |
|------|----------|
| `.sniper/config.yaml` | Project configuration |
| `.sniper/checkpoints/` | Phase checkpoint storage |
| `.sniper/gates/` | Gate result storage |
| `.sniper/checklists/` | Quality gate checklists |
| `.claude/agents/` | Agent definitions |
| `.claude/settings.json` | Hooks and settings |
| `docs/` | Documentation directory |
| `CLAUDE.md` | Project instructions |

---

## `/sniper-review` {#sniper-review}

Manually trigger a quality gate review outside of the normal protocol flow.

**Arguments:**

| Flag | Description |
|------|-------------|
| `--phase <name>` | Phase to review (defaults to current active phase) |

Spawns a gate-reviewer agent, runs the phase checklist, and writes the result to `.sniper/gates/`. This does not advance the protocol -- it is a manual check only.

---

## `/sniper-status` {#sniper-status}

Display project info, active protocol progress, cost tracking, recent activity, and velocity trends. Read-only -- never modifies any files.

Takes no arguments.

---

## Protocols

Every protocol is a YAML state machine that defines a sequence of phases, agent assignments, spawn strategies, and quality gates. Use `/sniper-flow --protocol <name>` to run one explicitly, or let auto-detection choose for you.

### Protocol Summary

| Protocol | Phases | Budget | Auto Retro | Use Case |
|----------|--------|--------|------------|----------|
| [`full`](#protocol-full) | discover &rarr; plan &rarr; implement &rarr; review | 2M tokens | Yes | New projects, major reworks |
| [`feature`](#protocol-feature) | plan &rarr; implement &rarr; review | 800K tokens | Yes | New features (5--20 files) |
| [`patch`](#protocol-patch) | implement &rarr; review | 200K tokens | No | Bug fixes, small changes |
| [`ingest`](#protocol-ingest) | scan &rarr; document &rarr; extract | 1M tokens | No | Reverse-engineer existing codebases |
| [`explore`](#protocol-explore) | discover | 500K tokens | No | Research and analysis |
| [`refactor`](#protocol-refactor) | analyze &rarr; implement &rarr; review | 600K tokens | Yes | Code improvement, no new features |
| [`hotfix`](#protocol-hotfix) | implement | 100K tokens | No | Critical production fixes |

### `full` {#protocol-full}

Complete project lifecycle from discovery through review.

| Phase | Agents | Spawn | Gate | Human Approval | Key Outputs |
|-------|--------|-------|------|----------------|-------------|
| discover | analyst | single | discover | No | `docs/spec.md`, `docs/codebase-overview.md` |
| plan | architect, product-manager | team | plan | Yes | `docs/architecture.md`, `docs/prd.md`, `docs/stories/` |
| implement | fullstack-dev, qa-engineer | team | implement | No | Source code, test files |
| review | code-reviewer | single | review | Yes | `docs/review-report.md` |

### `feature` {#protocol-feature}

Incremental feature -- plan, implement, and review.

| Phase | Agents | Spawn | Gate | Human Approval | Key Outputs |
|-------|--------|-------|------|----------------|-------------|
| plan | architect, product-manager | team | plan | Yes | `docs/architecture.md`, `docs/prd.md`, `docs/stories/` |
| implement | fullstack-dev, qa-engineer | team | implement | No | Source code, test files |
| review | code-reviewer | single | review | Yes | `docs/review-report.md` |

### `patch` {#protocol-patch}

Quick fix -- implement and review only.

| Phase | Agents | Spawn | Gate | Human Approval | Key Outputs |
|-------|--------|-------|------|----------------|-------------|
| implement | fullstack-dev | single | implement | No | Source code, test files |
| review | code-reviewer | single | review | Yes | `docs/review-report.md` |

### `ingest` {#protocol-ingest}

Codebase ingestion -- scan, document, and extract conventions.

| Phase | Agents | Spawn | Gate | Human Approval | Key Outputs |
|-------|--------|-------|------|----------------|-------------|
| scan | analyst | single | ingest-scan | No | `docs/codebase-overview.md` |
| document | analyst | single | ingest-document | No | `docs/spec.md` |
| extract | analyst | single | ingest-extract | No | `.sniper/conventions.yaml` |

### `explore` {#protocol-explore}

Exploratory analysis -- research and document findings.

| Phase | Agents | Spawn | Gate | Human Approval | Key Outputs |
|-------|--------|-------|------|----------------|-------------|
| discover | analyst | single | discover | No | `docs/spec.md`, `docs/codebase-overview.md` |

### `refactor` {#protocol-refactor}

Code improvement -- analyze, refactor, and review.

| Phase | Agents | Spawn | Gate | Human Approval | Key Outputs |
|-------|--------|-------|------|----------------|-------------|
| analyze | analyst | single | refactor-analyze | No | `docs/spec.md` |
| implement | fullstack-dev | single | implement | No | Source code, test files |
| review | code-reviewer | single | review | Yes | `docs/review-report.md` |

### `hotfix` {#protocol-hotfix}

Critical fix -- fastest path to production. Single phase, non-blocking gate.

| Phase | Agents | Spawn | Gate | Human Approval | Key Outputs |
|-------|--------|-------|------|----------------|-------------|
| implement | fullstack-dev | single | implement (non-blocking) | No | Source code, test files |

---

## CLI Subcommands

The `sniper` binary provides project scaffolding, management, and CI/CD support.

### Core

| Command | Description |
|---------|-------------|
| `sniper init` | Interactive project initialization (scaffolds `.sniper/`) |
| `sniper status` | Show project status and protocol progress |
| `sniper migrate` | Migrate v2 config to v3 format |

### Protocol Execution

| Command | Description |
|---------|-------------|
| `sniper run <protocol>` | Run a protocol headlessly |
| `sniper run <protocol> --auto-approve` | Auto-approve all gates |
| `sniper run <protocol> --output <format>` | Output format: `json`, `yaml`, `text` |
| `sniper run <protocol> --timeout <minutes>` | Set execution timeout |
| `sniper protocol create <name>` | Create a custom protocol YAML |
| `sniper protocol list` | List built-in and custom protocols |
| `sniper protocol validate <name>` | Validate a custom protocol |

### Plugins and Packs

| Command | Description |
|---------|-------------|
| `sniper plugin install <package>` | Install a language plugin or domain pack |
| `sniper plugin remove <name>` | Remove a plugin |
| `sniper plugin list` | List installed plugins |
| `sniper marketplace search <query>` | Search for plugins and packs |

### Project Management

| Command | Description |
|---------|-------------|
| `sniper dashboard` | Open the project dashboard |
| `sniper revert` | Revert changes from a protocol phase using checkpointed commits |
| `sniper signal` | Record a learning signal for agent memory |
| `sniper sphere` | Manage project spheres (bounded contexts) |
| `sniper workspace init [name]` | Initialize a multi-repo workspace |
| `sniper knowledge` | Manage domain knowledge sources |

::: tip
See the [Headless & CI/CD](/guide/headless-ci) guide for integrating `sniper run` into your pipelines.
:::
