---
title: Templates Reference
description: Artifact templates that define the structure of SNIPER v3 agent outputs
---

# Templates Reference

Templates define the structure of artifacts produced by SNIPER agents during protocol execution. They ensure consistent output format across projects. Templates are stored in `.sniper/templates/`.

## Available Templates

### Core Artifacts

| Template | Format | Description |
|----------|--------|-------------|
| [Architecture](/reference/templates/architecture) | Markdown | System architecture with diagrams, data models, and API design |
| [Specification](/reference/templates/spec) | Markdown | Project specification with requirements and acceptance criteria |
| [Story](/reference/templates/story) | Markdown | Self-contained story with embedded context and acceptance criteria |
| [Codebase Overview](/reference/templates/codebase-overview) | Markdown | Overview of existing codebase structure and patterns |

### Review & Quality

| Template | Format | Description |
|----------|--------|-------------|
| [Review Report](/reference/templates/review-report) | Markdown | Phase review gate results and scoring |
| [Multi-Faceted Review Report](/reference/templates/multi-faceted-review-report) | Markdown | Three-dimension review: scope, standards, risk |

### Runtime State

| Template | Format | Description |
|----------|--------|-------------|
| [Checkpoint](/reference/templates/checkpoint) | YAML | Phase checkpoint — snapshot of protocol state |
| [Cost](/reference/templates/cost) | YAML | Cost tracking for protocol execution — token usage and budgets |
| [Live Status](/reference/templates/live-status) | YAML | Real-time protocol progress |
| [Velocity](/reference/templates/velocity) | YAML | Protocol execution history and calibrated budgets |

### Signals & Knowledge

| Template | Format | Description |
|----------|--------|-------------|
| [Signal Record](/reference/templates/signal-record) | YAML | Captures learning from CI failures, PR reviews, production errors |
| [Knowledge Manifest](/reference/templates/knowledge-manifest) | YAML | Domain knowledge sources for agent injection |

### Workspace & Configuration

| Template | Format | Description |
|----------|--------|-------------|
| [Workspace Config](/reference/templates/workspace-config) | YAML | Multi-project workspace configuration |
| [Custom Protocol](/reference/templates/custom-protocol) | YAML | Custom protocol definition template |

## Template Usage

Templates are automatically used by agents during phase execution. The agent reads the template, fills in project-specific content, and writes the artifact to the `.sniper/` directory.

::: tip
Templates define structure, not content. Agents use them as scaffolding and fill in details based on the project context, prior artifacts, and their role.
:::

## Related

- [Core Concepts](/guide/core-concepts) — artifacts and how they fit the lifecycle
- [Full Lifecycle](/guide/full-lifecycle) — which templates are used in each phase
- [Schemas](/reference/schemas/) — validation schemas for YAML artifacts
