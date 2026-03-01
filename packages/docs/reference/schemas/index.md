---
title: Schemas
---

# Schemas

SNIPER uses YAML schemas to define the structure of runtime data files. These schemas validate checkpoints, gate results, cost tracking, velocity metrics, and more.

## Schema Files

All schemas live in `packages/core/schemas/` and follow the JSON Schema 2020-12 specification in YAML format.

| Schema | Purpose |
|--------|---------|
| `checkpoint` | Phase checkpoint tracking (protocol, phase, status, agents, tokens, commits) |
| `cost` | Token usage tracking (per-phase, per-agent, cumulative, budget allocation) |
| `gate-result` | Gate evaluation results (phase, checks, pass/fail, multi-model results) |
| `live-status` | Active protocol status (current phase, agents, tasks, cost percentage) |
| `protocol` | Protocol definition (name, phases, budget, agents, spawn strategy, gates) |
| `velocity` | Execution metrics for budget calibration (protocol history, calibrated budgets) |
| `retro` | Retrospective report (protocol, metrics, findings, signal analysis) |
| `signal` | External signal record (type, source, timestamp, affected files, learning) |
| `workspace` | Workspace configuration (shared conventions, anti-patterns, triggers) |
| `workspace-lock` | File-level advisory lock (file path, owner, acquired timestamp) |
| `revert-plan` | Logical revert instructions (target state, commits to revert) |
| `knowledge-manifest` | Domain knowledge registry (sources, descriptions, token limits) |
| `dependency-graph` | Task dependency tracking (tasks, dependencies, blocking relationships) |

## Usage

Schemas are used by:

- **Gate reviewer** -- validates checkpoint and gate result files
- **Lead orchestrator** -- writes checkpoints conforming to the schema
- **Retro analyst** -- writes velocity and retro data
- **CLI `protocol validate`** -- validates custom protocols against the protocol schema

Browse individual schema reference pages in the sidebar.
