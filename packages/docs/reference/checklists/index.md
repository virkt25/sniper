---
title: Checklists Reference
description: Quality gate checklists that evaluate artifacts during SNIPER v3 protocol review phases
---

# Checklists Reference

Checklists define quality criteria evaluated during review gates. Each checklist item is scored as PASS, WARN, or FAIL. Checklists are stored as YAML files in `.sniper/checklists/`.

## Available Checklists

### Protocol Phase Checklists

These checklists evaluate artifacts produced during protocol phases.

| Checklist | Used By | Description |
|-----------|---------|-------------|
| [discover](/reference/checklists/discover) | Full, Explore protocols | Evaluates discovery artifacts — brief, risks, research |
| [plan](/reference/checklists/plan) | Full, Feature protocols | Evaluates planning artifacts — architecture, specs |
| [implement](/reference/checklists/implement) | Full, Feature, Patch protocols | Evaluates implementation — code quality, tests |
| [review](/reference/checklists/review) | All protocols with review phase | Final review of all phase artifacts |

### Protocol-Specific Checklists

| Checklist | Used By | Description |
|-----------|---------|-------------|
| [multi-faceted-review](/reference/checklists/multi-faceted-review) | Review gates | Three-dimension review: scope, standards, risk scoring |
| [refactor-analyze](/reference/checklists/refactor-analyze) | Refactor protocol | Evaluates refactoring analysis and safety |

### Ingest Protocol Checklists

| Checklist | Used By | Description |
|-----------|---------|-------------|
| [ingest-scan](/reference/checklists/ingest-scan) | Ingest protocol — scan phase | Evaluates codebase scanning completeness |
| [ingest-document](/reference/checklists/ingest-document) | Ingest protocol — document phase | Evaluates generated documentation quality |
| [ingest-extract](/reference/checklists/ingest-extract) | Ingest protocol — extract phase | Evaluates extracted conventions and patterns |

## Evaluation Scoring

During a review gate, each checklist item receives a score:

| Score | Meaning | Impact |
|-------|---------|--------|
| **PASS** | Criterion is fully met | No action needed |
| **WARN** | Criterion is partially met or needs attention | Does not block in flexible mode |
| **FAIL** | Criterion is not met | Blocks advancement in strict mode |

## Gate Modes

How checklist results affect phase advancement depends on the gate mode:

- **Strict** — any FAIL blocks advancement; requires explicit human approval
- **Flexible** — auto-advances if no FAIL items; warnings are noted
- **Auto** — no evaluation performed; phase advances immediately

## Related

- [Review Gates](/guide/review-gates) — how checklists are used in the review process
- [Configuration](/guide/configuration) — setting gate modes per phase
- [Advanced Features](/guide/advanced-features) — multi-faceted and multi-model review
