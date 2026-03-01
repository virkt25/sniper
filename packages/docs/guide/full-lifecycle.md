---
title: Full Lifecycle
description: Walk through a complete SNIPER lifecycle from discovery to release with parallel agent teams
---

# Full Lifecycle Walkthrough

The full lifecycle workflow takes a project from initial research through implementation. Use this for greenfield projects, major rewrites, or any project that benefits from structured planning and governance.

## Overview

```
/sniper-init  -->  /sniper-flow
   Setup           Phases 1-4 (discover → plan → implement → review)
```

`/sniper-flow` is the unified protocol engine that drives all four phases automatically. It auto-detects the appropriate protocol scope, or you can specify one explicitly with `--protocol <name>` (e.g., `--protocol full`).

## Step 1: Initialize

```
/sniper-init
```

Configure your project name, type, tech stack, plugins, and agents. This creates the `.sniper/` directory, `config.yaml`, and `.claude/agents/`.

See [Getting Started](/guide/getting-started) for the full init walkthrough.

## Step 2: Discover (Phase 1)

```
/sniper-flow --protocol full
```

The discover phase is the first phase executed by `/sniper-flow` when running the `full` protocol.

**Agent:** 1 agent (analyst) with `spawn_strategy: single`

| Agent | Output |
|-------|--------|
| analyst | `docs/spec.md`, `docs/codebase-overview.md` |

**How it works:**

1. The command reads your project configuration and protocol definition
2. The analyst agent is spawned as a single agent
3. The analyst researches the project scope, market landscape, technical feasibility, and existing codebase
4. When the analyst completes, a review gate evaluates the output

**Gate:** Configured per protocol YAML (`human_approval: boolean`)

**What the artifacts contain:**

- **spec.md** -- project scope, market landscape, competitive analysis, unique value proposition, target market, constraints, assumptions, risks, and user personas
- **codebase-overview.md** -- existing codebase structure, technology inventory, integration points, and technical debt assessment

::: tip
If artifacts already exist from a previous run, the agent enters amendment mode -- it updates existing content rather than starting from scratch.
:::

## Step 3: Plan (Phase 2)

After the discover phase completes and its gate passes, `/sniper-flow` automatically advances to the plan phase.

**Team:** 2 agents (architect, product-manager) with `spawn_strategy: team`

| Agent | Output |
|-------|--------|
| product-manager | `docs/prd.md`, `docs/stories/` |
| architect | `docs/architecture.md` |

**How it works:**

1. Both agents are spawned as a team, reading all Phase 1 artifacts
2. The product manager produces the PRD and breaks it into implementable stories
3. The architect produces the system architecture, aligning with the PRD
4. The architect may have `plan_approval: true` -- they must describe their approach before executing, and the lead must approve it

**Gate:** Configured per protocol YAML (`human_approval: boolean`)

This is typically the most critical gate. The review evaluates artifacts against a detailed checklist covering requirement specificity, architecture completeness, and cross-document consistency.

::: warning
Setting `human_approval: false` on the plan gate is strongly discouraged. Bad architecture decisions cascade through the entire project.
:::

**Model override:** The plan phase uses the `planning_model` (typically `opus`) for higher-quality output on these critical artifacts.

## Step 4: Implement (Phase 3)

Once the plan gate passes, `/sniper-flow` advances to the implement phase.

**Team:** 2 agents (fullstack-dev, qa-engineer) with `spawn_strategy: team`

| Agent | Role |
|-------|------|
| fullstack-dev | Implements code changes based on plan artifacts |
| qa-engineer | Writes and runs tests for implemented code |

**How it works:**

1. Both agents are spawned as a team, reading all Phase 2 artifacts (PRD, architecture, stories)
2. The fullstack-dev implements the code changes defined in the stories
3. The qa-engineer writes tests and validates acceptance criteria
4. All new code must include tests
5. The self-healing CI hook detects test/lint failures and instructs agents to fix before proceeding

**What it produces:**

- Working code changes implementing the planned stories
- Test coverage for all new functionality
- Passing lint, typecheck, and test suites

**Gate:** Configured per protocol YAML (`human_approval: boolean`)

## Step 5: Review (Phase 4)

After implementation completes, `/sniper-flow` advances to the review phase.

**Agent:** 1 agent (code-reviewer) with `spawn_strategy: single`

| Agent | Role |
|-------|------|
| code-reviewer | Multi-faceted code review across three dimensions |

**How it works:**

1. The code-reviewer agent is spawned to evaluate all implementation output
2. The review evaluates across three dimensions:
   - **Scope validation** -- ensures changes align with planned stories and do not introduce scope creep
   - **Standards enforcement** -- checks code quality, conventions, test coverage, and architecture compliance
   - **Risk scoring** -- assigns severity levels (critical/high/medium/low) to any identified issues
3. If `review.multi_model` is enabled, multiple models evaluate independently and results are compared
4. The spec sync step reconciles `docs/spec.md` with implementation reality

**Gate:** Configured per protocol YAML (`human_approval: boolean`)

Typically `human_approval: true` for this phase -- the human reviews the code-reviewer's findings and the actual code changes before approving.

After the review passes, a retrospective automatically runs if `auto_retro` is enabled in the visibility config. The retro-analyst records execution metrics to `.sniper/memory/velocity.yaml`.

Use `/sniper-flow --resume` to resume an interrupted protocol from its last checkpoint.

## Recovery

If any phase produces poor output:

- Use `/sniper-flow --resume` to resume an interrupted protocol from its last checkpoint
- Completed files persist on disk -- only the conversation resets
- Review failures affect only the current protocol execution

## Alternative Workflows

Not every project needs the full lifecycle. SNIPER also provides:

- **`/sniper-flow --protocol ingest`** -- bootstrap artifacts from an existing codebase
- **`/sniper-flow --protocol feature`** -- scoped mini-lifecycle for a single feature
- **`/sniper-flow --protocol hotfix`** -- structured bug investigation and hot fixes
- **`/sniper-flow --protocol refactor`** -- analyze, implement, and review refactoring changes
- **`/sniper-flow --protocol explore`** -- discovery-only investigation (no implementation)

## Next Steps

- [Review Gates](/guide/review-gates) -- understand how gates work in detail
- [Teams](/guide/teams) -- learn how protocols define team composition
- [Configuration](/guide/configuration) -- customize the lifecycle for your project
