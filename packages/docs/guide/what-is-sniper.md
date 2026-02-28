---
title: What is SNIPER?
description: Overview of SNIPER — the AI-powered project lifecycle framework for Claude Code agent teams
---

# What is SNIPER?

SNIPER (Spawn, Navigate, Implement, Parallelize, Evaluate, Release) is a framework for orchestrating Claude Code agent teams through structured project phases. It transforms how you build software with AI by replacing ad-hoc prompting with a governed, repeatable lifecycle.

## The Problem

When you use Claude Code to build a project, you typically have a single conversation that handles everything -- research, planning, architecture, implementation. This works for small tasks but breaks down on real projects:

- Context gets lost across long conversations
- Architecture decisions are made without sufficient analysis
- No quality gates catch bad decisions before they cascade
- A single agent cannot hold the full context of a complex system

## How SNIPER Solves This

SNIPER introduces a structured lifecycle with specialized agent teams. Instead of one agent doing everything, SNIPER spawns parallel teams of agents -- each with a specific role, persona, and file ownership boundary -- coordinated by a team lead.

### The 6-Phase Lifecycle

The name SNIPER maps to six core activities:

| Letter | Activity | What Happens |
|--------|----------|--------------|
| **S** | Spawn | Agent teams are created from composed persona layers |
| **N** | Navigate | The team lead coordinates work, manages dependencies |
| **I** | Implement | Agents produce artifacts (docs, code, tests) |
| **P** | Parallelize | Multiple agents work simultaneously on independent tasks |
| **E** | Evaluate | Review gates check quality before advancing |
| **R** | Release | Completed work is verified and the next phase begins |

In practice, the lifecycle runs through four main phases:

1. **Discover** -- A 3-agent team researches the market, assesses risks, and maps user personas
2. **Plan** -- A 4-agent team produces the PRD, system architecture, UX spec, and security requirements
3. **Solve** -- A single agent (scrum master) shards the PRD into epics and self-contained stories
4. **Sprint** -- A development team implements selected stories with code and tests

Each phase produces concrete artifacts (markdown files in `docs/`) and passes through a review gate before the next phase can begin.

## Agent Teams

A SNIPER agent team consists of:

- **A team lead** (you, via Claude Code) who coordinates but does not produce artifacts
- **Teammates** spawned as sub-agents, each with a composed persona
- **Tasks** with explicit dependencies, file ownership, and output targets
- **Coordination rules** that define which teammates need to align

The team lead enters Claude Code's delegate mode (Shift+Tab) and manages the team -- unblocking dependencies, facilitating API contract alignment, and enforcing quality.

## Persona Composition

Each teammate's identity is assembled from four layers:

- **Process layer** -- their role (analyst, architect, developer, QA engineer)
- **Technical layer** -- their expertise (backend, frontend, security, AI/ML)
- **Cognitive layer** -- their thinking style (systems thinker, devil's advocate, user empathetic)
- **Domain layer** -- industry-specific knowledge from a domain pack

These layers are merged into a spawn prompt template that gives the agent deep, focused context for their specific task.

## Review Gates

Before any phase advances, its output passes through a review gate. Gates have three modes:

- **Strict** -- the human must explicitly approve (used for architecture and code)
- **Flexible** -- auto-advance with async review (used for discovery and story creation)
- **Auto** -- no gate (not recommended for critical phases)

Each gate evaluates the phase's artifacts against a checklist of quality criteria, producing a structured PASS/WARN/FAIL report.

## What Makes SNIPER Different

**Structured, not ad-hoc.** Every phase has a defined team, defined outputs, and a quality gate. There is no ambiguity about what happens next.

**Parallel, not serial.** Discovery agents research simultaneously. Planning agents work in parallel (with dependency management). Sprint developers implement stories concurrently.

**Self-contained stories.** The solve phase produces stories that embed all context from the PRD, architecture, and UX spec. A developer reading only the story file has everything needed to implement it.

**File ownership boundaries.** Each agent owns specific directories. Backend developers cannot modify frontend code and vice versa. This prevents conflicts and maintains separation of concerns.

**Memory and learning.** SNIPER tracks conventions, anti-patterns, and decisions across sprints. Sprint retrospectives automatically codify lessons learned into the memory system, which is injected into future spawn prompts.

## When to Use SNIPER

SNIPER works best for:

- **Greenfield projects** that need full planning and governance
- **Major rewrites** of existing systems
- **Projects with clear phases** (research, plan, build)
- **Teams that want repeatable, auditable AI-assisted development**

For smaller tasks, SNIPER also offers lightweight workflows:

- **Quick Feature** -- skip discovery and planning, go straight to implementation
- **Feature Lifecycle** -- add a single feature to an existing project with scoped planning
- **Sprint Cycle** -- run implementation sprints against existing stories
- **Codebase Ingestion** -- reverse-engineer architecture docs from an existing codebase

## Next Steps

- [Getting Started](/guide/getting-started) -- install and run your first lifecycle
- [Core Concepts](/guide/core-concepts) -- understand phases, personas, teams, and gates
- [Full Lifecycle](/guide/full-lifecycle) -- detailed walkthrough of every phase
