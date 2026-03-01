# @sniper.ai/core

[![npm version](https://img.shields.io/npm/v/@sniper.ai/core)](https://www.npmjs.com/package/@sniper.ai/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Framework core for [SNIPER](https://sniperai.dev) -- provides agents, personas, skills, protocols, checklists, templates, hooks, and schemas as raw YAML and Markdown files.

## What is SNIPER?

SNIPER (**S**pawn, **N**avigate, **I**mplement, **P**arallelize, **E**valuate, **R**elease) is an AI-powered project lifecycle framework for orchestrating Claude Code agent teams through structured phases. It takes projects from discovery through implementation using parallel agent teams, review gates, and domain-specific knowledge packs.

A full lifecycle runs through four phases: **Discover** (research and analysis), **Plan** (architecture and design), **Solve** (epic and story sharding), and **Sprint** (parallel implementation). Each phase spawns a coordinated team of specialized agents composed from layered personas.

## Overview

This package contains no executable code. It ships the framework content that the CLI scaffolds into target projects and that Claude Code agents consume at runtime.

## Installation

```bash
npm install @sniper.ai/core
```

## Contents

```
├── agents/             # Agent definitions (YAML frontmatter + Markdown)
├── personas/           # Agent persona layers (42 total)
│   ├── cognitive/      # Thinking style (analytical, security-first, etc.)
│   ├── process/        # Workflow role (architect, developer, etc.)
│   └── technical/      # Technical expertise (frontend, backend, etc.)
├── skills/             # Slash command definitions (18 commands)
├── protocols/          # Protocol state machines (full, feature, patch, etc.)
├── templates/          # Artifact templates (38 templates)
├── checklists/         # Quality gate checklists (15 checklists)
├── hooks/              # Claude Code hook definitions
├── schemas/            # Runtime data schemas (checkpoint, cost, velocity, etc.)
├── config.template.yaml
└── claude-md.template
```

## Persona Layers

Agents are composed from four persona layers, combined via the `/sniper-compose` command into complete spawn prompts:

| Layer | Count | Purpose | Examples |
|-------|-------|---------|----------|
| **Cognitive** | 6 | Thinking style and approach | `analytical`, `security-first`, `systems-thinker`, `devils-advocate`, `user-empathetic`, `performance-focused` |
| **Process** | 29 | Role in the workflow | `architect`, `developer`, `code-reviewer`, `product-manager`, `scrum-master`, `qa-engineer`, `release-manager` |
| **Technical** | 7 | Technical expertise area | `frontend`, `backend`, `database`, `infrastructure`, `security`, `api-design`, `ai-ml` |
| **Domain** | -- | Project-specific knowledge | Provided by domain packs (e.g., `@sniper.ai/pack-sales-dialer`) |

## Teams

SNIPER defines 17 team compositions for different workflows:

| Team | File | Description |
|------|------|-------------|
| **Discover** | `discover.yaml` | Discovery phase -- analyst, risk-researcher, user-researcher |
| **Plan** | `plan.yaml` | Planning phase -- PM, architect, UX, security (uses Opus model) |
| **Solve** | `solve.yaml` | Story sharding -- single scrum-master agent |
| **Sprint** | `sprint.yaml` | Implementation -- backend-dev, frontend-dev, and other specialists |
| **Doc** | `doc.yaml` | Documentation generation -- doc-analyst, doc-writer, doc-reviewer |
| **Ingest** | `ingest.yaml` | Codebase ingestion -- reverse-engineers project artifacts |
| **Feature Plan** | `feature-plan.yaml` | Incremental feature spec and architecture delta |
| **Debug** | `debug.yaml` | Production debugging -- parallel investigation agents |
| **Review PR** | `review-pr.yaml` | Multi-perspective pull request review |
| **Review Release** | `review-release.yaml` | Multi-perspective release readiness assessment |
| **Refactor** | `refactor.yaml` | Structured large-scale code refactoring |
| **Security** | `security.yaml` | Structured security analysis |
| **Perf** | `perf.yaml` | Structured performance analysis |
| **Test** | `test.yaml` | Test and coverage audit |
| **Retro** | `retro.yaml` | Sprint retrospective analysis |
| **Workspace Feature** | `workspace-feature.yaml` | Cross-repo feature orchestration |
| **Workspace Validation** | `workspace-validation.yaml` | Interface contract validation |

## Commands

18 slash commands organized by category:

### Lifecycle

| Command | Description |
|---------|-------------|
| `/sniper-init` | Initialize SNIPER in a new or existing project |
| `/sniper-discover` | Phase 1: Discovery and analysis (parallel team) |
| `/sniper-plan` | Phase 2: Planning and architecture (parallel team) |
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

## Templates

38 artifact templates covering:

| Category | Templates |
|----------|-----------|
| **Discovery** | `brief.md`, `risks.md`, `personas.md` |
| **Planning** | `prd.md`, `architecture.md`, `ux-spec.md`, `security.md`, `conventions.md` |
| **Stories** | `epic.md`, `story.md` |
| **Features** | `feature-brief.md`, `feature-spec.md`, `arch-delta.md` |
| **Reviews** | `pr-review.md`, `sprint-review.md`, `release-readiness.md` |
| **Documentation** | `doc-api.md`, `doc-guide.md`, `doc-readme.md` |
| **Debugging** | `investigation.md`, `postmortem.md`, `bug-report.md` |
| **Security** | `threat-model.md`, `vulnerability-report.md` |
| **Performance** | `performance-profile.md`, `optimization-plan.md` |
| **Refactoring** | `refactor-scope.md`, `migration-plan.md` |
| **Memory** | `memory-convention.yaml`, `memory-anti-pattern.yaml`, `memory-decision.yaml`, `retro.yaml` |
| **Workspace** | `workspace-brief.md`, `workspace-plan.md`, `contract.yaml`, `contract-validation-report.md` |
| **Testing** | `coverage-report.md`, `flaky-report.md` |

## Checklists

15 quality gate checklists for review workflows:

`code-review`, `debug-review`, `discover-review`, `doc-review`, `feature-review`, `ingest-review`, `memory-review`, `perf-review`, `plan-review`, `refactor-review`, `security-review`, `sprint-review`, `story-review`, `test-review`, `workspace-review`

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
