---
title: Full Lifecycle
description: Walk through a complete SNIPER lifecycle from discovery to release with parallel agent teams
---

# Full Lifecycle Walkthrough

The full lifecycle workflow takes a project from initial research through implementation. Use this for greenfield projects, major rewrites, or any project that benefits from structured planning and governance.

## Overview

```
/sniper-init  -->  /sniper-flow
   Setup           Phases 1-7 (discover → define → design → solve → implement → review → retro)
```

`/sniper-flow` is the unified protocol engine that drives all seven phases automatically. It auto-detects the appropriate protocol scope, or you can specify one explicitly with `--protocol <name>` (e.g., `--protocol full`).

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

## Step 3: Define (Phase 2)

After the discover phase completes and its gate passes, `/sniper-flow` automatically advances to the define phase.

**Agent:** 1 agent (product-manager) with `spawn_strategy: single`

| Agent | Output |
|-------|--------|
| product-manager | `docs/prd.md` |

**How it works:**

1. The product manager is spawned, reading all Phase 1 artifacts
2. Produces the PRD with requirements specification
3. Human reviews the PRD before architecture begins

**Gate:** Configured per protocol YAML (`human_approval: boolean`)

::: warning
Setting `human_approval: false` on the define gate is strongly discouraged. Bad requirements cascade through the entire project.
:::

## Step 4: Design (Phase 3)

After the define phase completes, `/sniper-flow` advances to the design phase.

**Agent:** 1 agent (architect) with `spawn_strategy: single`

| Agent | Output |
|-------|--------|
| architect | `docs/architecture.md` |

**How it works:**

1. The architect is spawned, reading the PRD and all prior artifacts
2. Produces the system architecture aligned with the PRD
3. Human reviews the architecture before story sharding begins

**Gate:** Configured per protocol YAML (`human_approval: boolean`)

## Step 5: Solve (Phase 4)

After the design phase completes, `/sniper-flow` advances to the solve phase.

**Agent:** 1 agent (product-manager) with `spawn_strategy: single`

| Agent | Output |
|-------|--------|
| product-manager | `docs/stories/` |

**How it works:**

1. The product manager is spawned, reading the PRD and architecture
2. Breaks requirements into implementable stories with acceptance criteria
3. Human reviews the story breakdown before implementation begins

**Gate:** Configured per protocol YAML (`human_approval: boolean`)

## Step 6: Implement (Phase 5)

Once the solve gate passes, `/sniper-flow` advances to the implement phase.

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

## Step 7: Review (Phase 6)

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

After the review passes, a retrospective automatically runs if `auto_retro` is enabled in the visibility config.

## Step 8: Retro (Phase 7)

After the review phase passes, `/sniper-flow` runs the retrospective phase.

**Agent:** 1 agent (retro-analyst) with `spawn_strategy: single`

| Agent | Role |
|-------|------|
| retro-analyst | Captures learnings and updates project memory |

**How it works:**

1. The retro-analyst agent is spawned with context from the completed protocol
2. Analyzes gate results, code changes, and patterns observed during execution
3. Updates `.sniper/memory/` with new conventions, anti-patterns, and decisions
4. Produces a retrospective report in `.sniper/retros/`

This phase runs automatically when `auto_retro` is enabled and does not require human approval.

## Recovery

If any phase produces poor output:

- Use `/sniper-flow --resume` to resume from the last checkpoint (see [Resume and Checkpoints](#resume-and-checkpoints) below)
- Completed files persist on disk -- only the conversation resets
- Review failures affect only the current protocol execution

## Resume and Checkpoints

Every protocol run creates checkpoints in `.sniper/checkpoints/<protocol-id>/`. If a run is interrupted -- terminal closed, agent crash, user stops -- resume from the last checkpoint:

```
/sniper-flow --resume
```

Resume reads the latest checkpoint, identifies incomplete agents and their last known state, and spawns replacement agents with the checkpoint context. Agents pick up where they left off.

### What Checkpoints Contain

- **Event log** (`events.jsonl`) -- append-only log of every agent action and phase transition. Enables precise recovery.
- **Phase snapshot** (`<protocol-id>-<phase>.yaml`) -- human-readable summary with agent status, artifacts produced, files touched, and a structured context summary for agent respawn.

## Alternative Protocols

Not every project needs the full lifecycle. SNIPER provides right-sized protocols that match scope to process.

### Feature Protocol

For scoped features where discovery is not needed.

```
define → design → solve → implement → review → retro
```

Same as `full` minus the discover phase. Best for features where requirements are clear and the domain is understood.

- **Define phase** -- product-manager produces the PRD. Human approval gate.
- **Design phase** -- architect produces architecture. Human approval gate.
- **Solve phase** -- product-manager shards stories. Human approval gate.
- **Implement phase** -- 2--3 subagents spawned via `Task` tool with worktree isolation.
- **Review phase** -- code-reviewer evaluates the diff. Auto or human gate depending on config.

### Patch Protocol

For bug fixes and small changes (under ~300 LOC).

```
implement → review
```

**Implement phase:**
- Single implementation agent selected by routing -- no team overhead
- Fix the issue, write/update tests, self-review

**Review phase:**
- Gate-reviewer runs tests, lint, and validates the fix
- Human approval gate (final-review)

### Hotfix Protocol

Minimal ceremony for critical fixes.

```
implement
```

Single agent, automatic self-review, no human gate. The gate-reviewer runs via `Stop` hook but does not require human approval -- only automated checks (tests pass, lint clean).

Use for production-down scenarios where speed matters more than ceremony.

### Explore Protocol

Research and investigation without implementation.

```
discover
```

- **Agents:** analyst (optionally with architect for technical investigation)
- **Work:** Profile, benchmark, analyze, research
- **Output:** Findings document with concrete recommendations

After explore completes, you typically follow up with a targeted protocol:

```
/sniper-flow --protocol feature "Implement recommendation X from explore"
```

### Refactor Protocol

Code improvement without behavior change.

```
analyze → implement → review → retro
```

**Analyze phase:**
- Agents: architect, code-reviewer
- Identify refactoring targets, assess risk, define scope
- Output: refactoring plan with before/after expectations

**Implement phase:**
- Refactor code while ensuring all existing tests still pass
- Extra check -- no test behavior changes allowed (same test count, same test names)

**Review phase:**
- Human approval gate (final-review)

### Ingest Protocol

Brownfield codebase onboarding.

```
scan → document → extract
```

**Scan phase:**
- Agent: code-archaeologist
- Analyze directory structure, dependencies, entry points, patterns
- Scan levels: Quick (structure only), Standard (modules + API surface), Deep (control flow + security)
- Output: repository map (`.sniper/artifacts/<id>/repo-map.md`)

**Document phase:**
- Agents: doc-writer, code-archaeologist
- Generate AI-optimized codebase documentation
- Output:
  - `codebase-overview.md` -- architecture, key modules, data flow
  - `api-surface.md` -- public APIs, endpoints, contracts
  - `conventions.md` -- detected patterns, naming, structure
  - `risks.md` -- technical debt, security concerns, fragile areas

**Extract phase:**
- Agents: analyst, product-manager
- Generate baseline spec from existing code ("what the system does today")
- Output: baseline spec for delta planning in future protocols

No human gates -- all three phases auto-advance.

## Next Steps

- [Review Gates](/guide/review-gates) -- understand how gates work in detail
- [Teams](/guide/teams) -- learn how protocols define team composition
- [Configuration](/guide/configuration) -- customize the lifecycle for your project
