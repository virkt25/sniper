---
title: Why SNIPER?
---

# Why SNIPER?

AI coding assistants are powerful, but they lack structure. Ask Claude to "build me a SaaS app" and you'll get code -- but without requirements analysis, architecture decisions, quality gates, or a plan for what comes next. SNIPER fixes that.

## The Problem

Modern AI coding tools operate in **single-agent, single-session mode**. You prompt, the agent writes code, you review. This breaks down on non-trivial projects because:

- **No discovery phase** -- agents jump straight to implementation without understanding the problem space
- **No architecture** -- decisions are made implicitly, scattered across files, never documented
- **No quality gates** -- bad decisions compound. A wrong data model in hour one wastes hours two through twenty
- **No specialization** -- one agent plays analyst, architect, developer, and tester simultaneously
- **No memory** -- lessons learned in one session are lost in the next
- **No coordination** -- multiple agents can't work in parallel with defined ownership boundaries

## The SNIPER Approach

SNIPER is a **protocol-driven framework** that orchestrates teams of specialized AI agents through structured phases. Instead of one agent doing everything, SNIPER assigns the right agent with the right expertise to the right task at the right time.

### Protocol-Driven Execution

Every project follows a protocol -- a state machine that defines phases, agents, gates, and outputs. You don't tell agents what to do step-by-step; you select a protocol and SNIPER handles decomposition.

```
/sniper-flow --protocol full
```

This single command executes: discover → plan → solve → sprint, spawning the right teams at each phase, evaluating quality gates between transitions.

### Layered Persona Composition

Agents aren't generic. They're composed from four independent layers:

- **Process** -- role (analyst, architect, developer, QA, product manager)
- **Technical** -- expertise (backend, frontend, security, AI/ML, database)
- **Cognitive** -- thinking style (systems-thinker, devil's advocate, security-first)
- **Domain** -- industry knowledge (telephony, compliance, CRM)

A backend security architect and a frontend UX developer have fundamentally different capabilities, even though both are "developers." SNIPER models this.

### Quality Gates Between Phases

Every phase transition passes through a review gate. Gates evaluate outputs against structured checklists:

- **Discovery** -- is the scope defined? Are risks identified? Are user personas documented?
- **Planning** -- does the architecture address all requirements? Are there open TBDs?
- **Sprint** -- do tests pass? Is lint clean? Are file ownership boundaries respected?

Gates can be strict (human must approve), flexible (auto-advance if no failures), or auto (no evaluation).

### Team-Based Parallel Execution

Sprint phases spawn multiple agents working in parallel, each with defined file ownership:

- Backend-dev owns `src/api/`, `src/services/`
- Frontend-dev owns `src/components/`, `src/hooks/`
- QA-engineer owns `tests/`

Agents coordinate through the task system without stepping on each other's code.

## How SNIPER Compares

### vs. Single-Agent Coding (Vanilla Claude Code, Cursor, Copilot)

Single-agent tools are excellent for small tasks. SNIPER adds value when projects require:

- Multiple phases of work (research, design, implement, review)
- Parallel execution across specializations
- Quality gates that prevent bad decisions from compounding
- Persistent memory that carries learning across sessions

### vs. Multi-Agent Frameworks (Codev, OpenHands)

Other multi-agent frameworks exist. SNIPER differentiates with:

- **Layered persona composition** -- most frameworks use flat agent definitions. SNIPER's 4-layer system creates 1000+ unique agent configurations from ~50 persona files
- **Domain packs** -- inject industry-specific knowledge (telephony, compliance, CRM) without modifying framework code
- **7 protocols** -- not just "full lifecycle." SNIPER has `patch` for quick fixes, `explore` for research, `hotfix` for emergencies, `refactor` for code improvement. Match the protocol to the scope
- **Native Claude Code integration** -- SNIPER runs inside Claude Code using skills, subagents, and hooks. No separate runtime or UI

### vs. Process Frameworks (BMAD, SuperClaude)

Process frameworks define what to do but leave execution to the user. SNIPER is both a process framework and an execution engine:

- Define the process (protocols, phases, gates)
- Execute the process (spawn agents, coordinate teams, evaluate gates)
- Learn from the process (signals, retros, velocity calibration)

## When to Use SNIPER

**Use SNIPER when:**

- Building a new project from scratch (full lifecycle)
- Adding significant features to an existing codebase (feature protocol)
- Managing a multi-repo project (workspace mode)
- Running structured code reviews, security audits, or refactoring (audit commands)
- Needing repeatable, quality-gated AI workflows in CI/CD (headless mode)

**Don't use SNIPER when:**

- Fixing a typo or small bug (just use Claude Code directly)
- Writing a one-off script (overhead isn't worth it)
- Exploring / prototyping with no intention to ship (unless using `explore` protocol)
- Working on a project so small it fits in a single file

## Next Steps

- [Getting Started](/guide/getting-started) -- install and run your first protocol
- [Architecture](/guide/architecture) -- understand how SNIPER works under the hood
- [Core Concepts](/guide/core-concepts) -- learn the building blocks
