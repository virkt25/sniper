# @sniper.ai/core

[![npm version](https://img.shields.io/npm/v/@sniper.ai/core)](https://www.npmjs.com/package/@sniper.ai/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Framework core for [SNIPER](https://sniperai.dev) -- provides agents, personas, skills, protocols, checklists, templates, hooks, and schemas as raw YAML and Markdown files.

## What is SNIPER?

SNIPER (**S**pawn, **N**avigate, **I**mplement, **P**arallelize, **E**valuate, **R**elease) is an AI-powered project lifecycle framework for orchestrating Claude Code agent teams through structured phases. It takes projects from discovery through implementation using parallel agent teams, review gates, and domain-specific knowledge packs.

A full lifecycle runs through four phases: **Discover** (research and analysis), **Plan** (architecture and design), **Implement** (code with worktree isolation), and **Review** (multi-faceted code review). Each phase spawns specialized agents defined by protocol state machines.

## Overview

This package contains no executable code. It ships the framework content that the CLI scaffolds into target projects and that Claude Code agents consume at runtime.

## Installation

```bash
npm install @sniper.ai/core
```

## Contents

```
├── agents/             # Agent definitions (11 agents)
├── personas/
│   └── cognitive/      # Cognitive mixins (3 mixins)
├── skills/             # Slash command definitions (5 skills)
├── protocols/          # Protocol state machines (7 protocols)
├── templates/          # Artifact templates (14 templates)
├── checklists/         # Quality gate checklists (9 checklists)
├── hooks/              # Claude Code hook definitions (2 files)
├── schemas/            # Runtime data schemas (13 schemas)
├── config.template.yaml
└── claude-md.template
```

## Agents

11 agent definitions, each with YAML frontmatter specifying write scope or isolation mode:

| Agent | Description |
|-------|-------------|
| `lead-orchestrator` | Coordinates agent teams through protocol phases. Read-only orchestrator (writes only to `.sniper/`) |
| `analyst` | Researches, analyzes, and produces discovery artifacts |
| `architect` | Designs system architecture and produces technical plans |
| `product-manager` | Translates requirements into structured stories with acceptance criteria |
| `fullstack-dev` | Full-stack implementation in an isolated worktree |
| `backend-dev` | Server-side implementation in an isolated worktree |
| `frontend-dev` | Client-side implementation in an isolated worktree |
| `qa-engineer` | Writes tests, analyzes coverage, validates acceptance criteria |
| `code-reviewer` | Multi-faceted code review (scope, standards, risk scoring) |
| `gate-reviewer` | Runs automated checks at phase boundaries |
| `retro-analyst` | Post-protocol retrospectives and velocity tracking |

## Cognitive Mixins

Optional thinking-style overlays that can be applied to any agent:

| Mixin | Description |
|-------|-------------|
| `security-first` | Prioritizes security considerations |
| `performance-focused` | Prioritizes performance optimization |
| `devils-advocate` | Challenges assumptions and identifies weaknesses |

Domain-specific knowledge is provided separately by domain packs (e.g., `@sniper.ai/pack-sales-dialer`).

## Protocols

7 protocol state machines that define phase sequences, agent assignments, and gate configurations:

| Protocol | Phases | Description |
|----------|--------|-------------|
| `full` | discover → plan → implement → review | Complete project lifecycle |
| `feature` | plan → implement → review | Incremental feature development |
| `patch` | implement → review | Quick fix with review |
| `ingest` | scan → document → extract | Codebase ingestion and convention extraction |
| `explore` | discover | Exploratory analysis only |
| `refactor` | analyze → implement → review | Code improvement lifecycle |
| `hotfix` | implement | Emergency fix, no gates |

## Skills

5 slash commands available in Claude Code:

| Command | Description |
|---------|-------------|
| `/sniper-flow` | Execute a SNIPER protocol (auto-detects scope or use `--protocol <name>`) |
| `/sniper-flow-headless` | Execute a protocol non-interactively for CI/CD environments |
| `/sniper-init` | Initialize SNIPER v3 in a new or existing project |
| `/sniper-review` | Manually trigger a review gate for the current phase |
| `/sniper-status` | Show current protocol progress and cost |

## Templates

14 artifact templates:

| Template | Type | Description |
|----------|------|-------------|
| `architecture.md` | Markdown | System architecture document |
| `spec.md` | Markdown | Project specification |
| `story.md` | Markdown | User story with acceptance criteria |
| `codebase-overview.md` | Markdown | Codebase analysis summary |
| `review-report.md` | Markdown | Standard review report |
| `multi-faceted-review-report.md` | Markdown | Multi-dimensional review report |
| `custom-protocol.yaml` | YAML | Custom protocol definition |
| `workspace-config.yaml` | YAML | Workspace configuration |
| `knowledge-manifest.yaml` | YAML | Knowledge base manifest |
| `checkpoint.yaml` | YAML | Protocol checkpoint state |
| `cost.yaml` | YAML | Token cost tracking |
| `live-status.yaml` | YAML | Live protocol status |
| `velocity.yaml` | YAML | Velocity calibration data |
| `signal-record.yaml` | YAML | Signal event record |

## Checklists

9 quality gate checklists:

| Checklist | Used by |
|-----------|---------|
| `discover` | full, explore protocols |
| `plan` | full, feature protocols |
| `implement` | full, feature, patch, refactor, hotfix protocols |
| `review` | full, feature, patch, refactor protocols |
| `multi-faceted-review` | Multi-model review mode |
| `ingest-scan` | ingest protocol (scan phase) |
| `ingest-document` | ingest protocol (document phase) |
| `ingest-extract` | ingest protocol (extract phase) |
| `refactor-analyze` | refactor protocol (analyze phase) |

## Usage

Import files directly via subpath exports:

```js
import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Resolve the path to a framework file
const require = createRequire(import.meta.url);
const protocolPath = require.resolve('@sniper.ai/core/protocols/full.yaml');
const protocolYaml = readFileSync(protocolPath, 'utf-8');
```

## Documentation

Full documentation is available at [sniperai.dev](https://sniperai.dev/).

## License

MIT
