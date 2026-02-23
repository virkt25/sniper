---
title: Commands Reference
---

# Commands Reference

SNIPER provides slash commands that drive the project lifecycle. Each command is invoked in Claude Code and orchestrates agent teams, manages state, and produces artifacts.

## Lifecycle Commands

These commands run the core project phases in order.

| Command | Phase | Description |
|---------|-------|-------------|
| [`/sniper-init`](/reference/commands/sniper-init) | Setup | Initialize SNIPER in a new or existing project |
| [`/sniper-discover`](/reference/commands/sniper-discover) | 1 -- Discover | Run discovery and analysis with a 3-agent parallel team |
| [`/sniper-plan`](/reference/commands/sniper-plan) | 2 -- Plan | Run planning and architecture with a 4-agent team |
| [`/sniper-solve`](/reference/commands/sniper-solve) | 3 -- Solve | Shard epics into self-contained stories (single agent) |
| [`/sniper-sprint`](/reference/commands/sniper-sprint) | 4 -- Sprint | Run an implementation sprint with a dynamic team |
| [`/sniper-review`](/reference/commands/sniper-review) | Gate | Evaluate phase artifacts against quality checklists |

## Utility Commands

These commands support the lifecycle without advancing phases.

| Command | Description |
|---------|-------------|
| [`/sniper-compose`](/reference/commands/sniper-compose) | Compose a spawn prompt from persona layers |
| [`/sniper-status`](/reference/commands/sniper-status) | Show lifecycle status, artifact state, and team health |
| [`/sniper-doc`](/reference/commands/sniper-doc) | Generate or update project documentation with a 3-agent team |
| [`/sniper-memory`](/reference/commands/sniper-memory) | View and manage conventions, anti-patterns, and decisions |

## Extended Commands

These commands handle specialized workflows beyond the standard lifecycle.

| Command | Description |
|---------|-------------|
| [`/sniper-feature`](/reference/commands/sniper-feature) | Run a scoped feature lifecycle (5 phases) for adding a feature to an existing project |
| [`/sniper-ingest`](/reference/commands/sniper-ingest) | Reverse-engineer SNIPER artifacts from an existing codebase using a 3-agent team |
| [`/sniper-debug`](/reference/commands/sniper-debug) | Investigate and fix bugs with a 3-phase structured approach |
| [`/sniper-audit`](/reference/commands/sniper-audit) | Run targeted audits (refactor, review, tests, security, performance) |

## Workspace Commands

These commands orchestrate SNIPER across multiple repositories.

| Command | Description |
|---------|-------------|
| [`/sniper-workspace init`](/reference/commands/sniper-workspace-init) | Initialize a workspace with dependency detection |
| [`/sniper-workspace feature`](/reference/commands/sniper-workspace-feature) | Plan and implement a feature spanning multiple repos |
| [`/sniper-workspace status`](/reference/commands/sniper-workspace-status) | View workspace state, repo status, and contract versions |
| [`/sniper-workspace validate`](/reference/commands/sniper-workspace-validate) | Validate implementations against interface contracts |

## Command Patterns

All phase commands follow a consistent pattern:

1. **State check** -- verify SNIPER is initialized and determine the current phase
2. **Team loading** -- read the team YAML to determine agents, tasks, and dependencies
3. **Spawn prompt composition** -- compose prompts from persona layers for each agent
4. **Delegate mode** -- the team lead coordinates agents without producing artifacts directly
5. **Artifact output** -- agents produce documents and code in the `docs/` directory
6. **Review gate** -- quality evaluation before the lifecycle advances

::: tip
Run `/sniper-status` at any time to see where you are in the lifecycle and what command to run next.
:::

## Related

- [Full Lifecycle](/guide/full-lifecycle) -- how phases connect end-to-end
- [Teams](/guide/teams) -- team compositions used by each command
- [Review Gates](/guide/review-gates) -- quality gates between phases
