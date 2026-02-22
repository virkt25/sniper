---
title: Workflows Reference
---

# Workflows Reference

Workflows are predefined sequences of SNIPER phases tailored for common scenarios. Each workflow specifies which commands to run, in what order, and with what gate modes. Workflows are stored in `.sniper/workflows/`.

## Available Workflows

| Workflow | File | Phases | Description |
|----------|------|--------|-------------|
| [Full Lifecycle](/reference/workflows/full-lifecycle) | `full-lifecycle.md` | 4 | Complete lifecycle from discovery through implementation |
| [Discover Only](/reference/workflows/discover-only) | `discover-only.md` | 1 | Run just the discovery phase for research and analysis |
| [Quick Feature](/reference/workflows/quick-feature) | `quick-feature.md` | 2 | Fast-track a single feature without full lifecycle planning |
| [Sprint Cycle](/reference/workflows/sprint-cycle) | `sprint-cycle.md` | 1 | Execute a single implementation sprint with existing stories |
| [Workspace Feature](/reference/workflows/workspace-feature) | `workspace-feature.md` | 5 | Orchestrate a feature across multiple repositories |

## Full Lifecycle

The standard end-to-end workflow for new projects or major rewrites.

**When to use:** Greenfield projects, major product rewrites, projects requiring full planning and governance.

**Sequence:**

```
/sniper-discover  -->  /sniper-review
       |
/sniper-plan      -->  /sniper-review
       |
/sniper-solve     -->  /sniper-review
       |
/sniper-sprint    -->  /sniper-review  (repeat until done)
```

Each phase must pass its review gate before the next phase begins.

## Discover Only

A single-phase workflow for research without committing to implementation.

**When to use:** Exploring a new project idea, market research, feasibility validation, user research for an existing product.

**Sequence:**

```
/sniper-discover  -->  /sniper-review
```

Produces a brief, risk assessment, and user personas without proceeding to planning or implementation.

## Quick Feature

A streamlined workflow for adding a well-understood feature to an existing project.

**When to use:** The feature is well-understood, architecture already exists, no discovery or full planning is needed.

**Sequence:**

```
/sniper-feature
```

This runs a self-contained 5-phase mini-lifecycle: scoping, planning (2-agent team), story generation, sprint, and merge-back.

## Sprint Cycle

A single sprint for implementing stories that already exist.

**When to use:** Stories already exist in `docs/stories/`, architecture and planning are complete, ready to implement a batch of stories.

**Sequence:**

```
/sniper-sprint  -->  /sniper-review  (repeat until all stories done)
```

## Workspace Feature

Multi-repo feature orchestration with contract-first coordination and wave-based sprints.

**When to use:** A feature requires changes in 2 or more repositories, cross-repo interfaces need to change, implementation ordering matters due to dependencies.

**Sequence:**

```
/sniper-workspace feature "feature description"
```

This runs 5 phases internally: scoping, contract design, per-repo story generation, wave-based sprint orchestration, and final integration validation.

## Choosing a Workflow

| Scenario | Workflow |
|----------|----------|
| New project from scratch | Full Lifecycle |
| Exploring an idea | Discover Only |
| Adding a feature to existing project | Quick Feature |
| Stories are ready, need implementation | Sprint Cycle |
| Feature spans multiple repos | Workspace Feature |

::: tip
You do not need to explicitly select a workflow. Simply run the appropriate command for your situation. Workflows serve as a guide for which commands to run and in what order.
:::

## Related

- [Full Lifecycle Guide](/guide/full-lifecycle) -- detailed walkthrough of the standard lifecycle
- [Commands](/reference/commands/) -- all available commands
- [Review Gates](/guide/review-gates) -- quality gates between workflow phases
