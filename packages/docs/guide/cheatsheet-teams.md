---
title: Teams Cheatsheet
description: Quick reference for all pre-configured agent team compositions
---

# Teams Cheatsheet

Quick reference for how SNIPER v3 assembles agent teams. In v3, there are no standalone team YAML files. Instead, **protocols** define which agents are spawned for each phase. The lead-orchestrator reads the protocol definition and spawns agents accordingly.

For a deeper explanation of how agents collaborate, see [Teams](/guide/teams). For the overall framework design, see [Architecture](/guide/architecture).

## The 11 Agents

Every agent team in SNIPER v3 is composed from this fixed roster of 11 agents.

| Agent | Model | Role | Writes To |
|-------|-------|------|-----------|
| `lead-orchestrator` | Opus | Coordinates teams, delegates work, manages gates | `.sniper/` only |
| `analyst` | Sonnet | Research, codebase analysis, spec production | `docs/`, `.sniper/` |
| `architect` | Opus | Architecture design, decision records, API contracts | `docs/` |
| `product-manager` | Sonnet | PRD writing, story creation with EARS criteria | `docs/` |
| `backend-dev` | Sonnet | Server-side implementation (worktree-isolated) | project source |
| `frontend-dev` | Sonnet | Client-side implementation (worktree-isolated) | project source |
| `fullstack-dev` | Sonnet | Full-stack implementation (worktree-isolated) | project source |
| `qa-engineer` | Sonnet | Test writing, coverage analysis, acceptance validation | test files only |
| `code-reviewer` | Opus | Multi-faceted review, risk scoring, spec reconciliation | `docs/` |
| `gate-reviewer` | Haiku | Automated checklist execution at phase boundaries | `.sniper/gates/` |
| `retro-analyst` | Sonnet | Post-protocol retrospective and velocity tracking | `.sniper/` |

## Protocol Phase Map

Each protocol defines a sequence of phases. Each phase lists which agents are spawned and whether they run as a `single` agent or a `team`.

### `full` -- Complete Project Lifecycle

4 phases -- discover, plan, implement, review -- budget: 2M tokens -- auto-retro: yes

| Phase | Agents | Strategy | Gate | Human Approval |
|-------|--------|----------|------|----------------|
| **discover** | `analyst` | single | discover | No |
| **plan** | `architect`, `product-manager` | team | plan | Yes |
| **implement** | `fullstack-dev`, `qa-engineer` | team | implement | No |
| **review** | `code-reviewer` | single | review | Yes |

**Coordination:** architect and product-manager coordinate so architecture is approved before stories reference it. Implement phase uses plan approval (agents present their approach before coding).

**Outputs:** `docs/spec.md`, `docs/codebase-overview.md`, `docs/architecture.md`, `docs/prd.md`, `docs/stories/`, source code, test files, `docs/review-report.md`

---

### `feature` -- Incremental Feature

3 phases -- plan, implement, review -- budget: 800K tokens -- auto-retro: yes

| Phase | Agents | Strategy | Gate | Human Approval |
|-------|--------|----------|------|----------------|
| **plan** | `architect`, `product-manager` | team | plan | Yes |
| **implement** | `fullstack-dev`, `qa-engineer` | team | implement | No |
| **review** | `code-reviewer` | single | review | Yes |

**Coordination:** Same as full protocol. Implement phase uses plan approval.

**Outputs:** `docs/architecture.md`, `docs/prd.md`, `docs/stories/`, source code, test files, `docs/review-report.md`

---

### `patch` -- Quick Fix

2 phases -- implement, review -- budget: 200K tokens -- auto-retro: no

| Phase | Agents | Strategy | Gate | Human Approval |
|-------|--------|----------|------|----------------|
| **implement** | `fullstack-dev` | single | implement | No |
| **review** | `code-reviewer` | single | review | Yes |

**No plan approval.** The developer goes straight to coding.

**Outputs:** source code, test files, `docs/review-report.md`

---

### `ingest` -- Codebase Ingestion

3 phases -- scan, document, extract -- budget: 1M tokens -- auto-retro: no

| Phase | Agents | Strategy | Gate | Human Approval |
|-------|--------|----------|------|----------------|
| **scan** | `analyst` | single | ingest-scan | No |
| **document** | `analyst` | single | ingest-document | No |
| **extract** | `analyst` | single | ingest-extract | No |

**Single-agent protocol.** The analyst runs all three phases sequentially.

**Outputs:** `docs/codebase-overview.md`, `docs/spec.md`, `.sniper/conventions.yaml`

---

### `refactor` -- Code Improvement

3 phases -- analyze, implement, review -- budget: 600K tokens -- auto-retro: yes

| Phase | Agents | Strategy | Gate | Human Approval |
|-------|--------|----------|------|----------------|
| **analyze** | `analyst` | single | refactor-analyze | No |
| **implement** | `fullstack-dev` | single | implement | No |
| **review** | `code-reviewer` | single | review | Yes |

**All single-agent phases.** Each phase hands off to the next agent in sequence.

**Outputs:** `docs/spec.md`, source code, test files, `docs/review-report.md`

---

### `explore` -- Exploratory Analysis

1 phase -- discover -- budget: 500K tokens -- auto-retro: no

| Phase | Agents | Strategy | Gate | Human Approval |
|-------|--------|----------|------|----------------|
| **discover** | `analyst` | single | discover | No |

**Lightest protocol.** Single analyst explores and documents.

**Outputs:** `docs/spec.md`, `docs/codebase-overview.md`

---

### `hotfix` -- Critical Fix

1 phase -- implement -- budget: 100K tokens -- auto-retro: no

| Phase | Agents | Strategy | Gate | Human Approval |
|-------|--------|----------|------|----------------|
| **implement** | `fullstack-dev` | single | implement (non-blocking) | No |

**Fastest path to production.** No plan approval, non-blocking gate, no review phase.

**Outputs:** source code, test files

---

## Agent Usage Across Protocols

Which agents appear in which protocols at a glance.

| Agent | full | feature | patch | ingest | refactor | explore | hotfix |
|-------|:----:|:-------:|:-----:|:------:|:--------:|:-------:|:------:|
| `analyst` | discover | -- | -- | scan, document, extract | analyze | discover | -- |
| `architect` | plan | plan | -- | -- | -- | -- | -- |
| `product-manager` | plan | plan | -- | -- | -- | -- | -- |
| `fullstack-dev` | implement | implement | implement | -- | implement | -- | implement |
| `qa-engineer` | implement | implement | -- | -- | -- | -- | -- |
| `code-reviewer` | review | review | review | -- | review | -- | -- |

**Always present but not listed in protocol phases:** `lead-orchestrator` (coordinates all protocols), `gate-reviewer` (runs automatically at phase boundaries), `retro-analyst` (runs after protocols with `auto_retro: true`).

## Spawn Strategies

Protocols specify how agents are launched for each phase:

| Strategy | Meaning |
|----------|---------|
| `single` | One agent runs the phase alone. No TeamCreate needed. |
| `team` | Multiple agents are spawned via TeamCreate and coordinate through tasks. |

## Gate Flow

At every phase boundary, the `gate-reviewer` executes the phase checklist automatically:

1. Lead-orchestrator completes a phase
2. Gate-reviewer runs all checks from the phase checklist
3. If all blocking checks pass, the protocol advances
4. If any blocking check fails, the lead-orchestrator reassigns failed checks to the appropriate agent

When `review.multi_model` is enabled in config, the gate-reviewer runs checks with multiple models and applies consensus logic (unanimous or majority-wins).
