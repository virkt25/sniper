---
title: Personas Cheatsheet
description: Quick reference for all persona layers across process, technical, and cognitive types
---

# Personas Cheatsheet

Quick reference for the SNIPER v3 persona system. In v3, agent roles are defined directly in agent definition files (`.claude/agents/*.md`), and **cognitive personas** are lightweight thinking-style mixins applied on top of any agent via configuration.

## Agents {#agents}

SNIPER v3 ships 11 agent definitions. Each agent has a dedicated role, a model assignment, and scoped write permissions.

| Agent | Model | Role | Write Scope |
|-------|-------|------|-------------|
| **lead-orchestrator** | opus | Coordinates agent teams through protocol phases. Delegates -- never codes. | `.sniper/`, `.sniper-workspace/` |
| **analyst** | sonnet | Researches, analyzes, and produces discovery artifacts (specs, codebase overviews). | `docs/`, `.sniper/` |
| **architect** | opus | Designs system architecture, component boundaries, and technical plans. | `docs/` |
| **product-manager** | sonnet | Translates requirements into structured stories with EARS acceptance criteria. | `docs/` |
| **backend-dev** | sonnet | Implements server-side code (APIs, services, workers) in an isolated worktree. | worktree (full) |
| **frontend-dev** | sonnet | Implements client-side code (components, pages, hooks) in an isolated worktree. | worktree (full) |
| **fullstack-dev** | sonnet | Handles both backend and frontend for smaller projects. Isolated worktree. | worktree (full) |
| **code-reviewer** | opus | Multi-faceted code review: scope validation, standards enforcement, risk scoring. | `docs/` |
| **qa-engineer** | sonnet | Writes tests, analyzes coverage, validates EARS acceptance criteria. | test files only |
| **gate-reviewer** | haiku | Runs automated gate checks at phase boundaries. Lightweight and fast. | `.sniper/gates/` |
| **retro-analyst** | sonnet | Post-protocol retrospective analysis. Tracks velocity and captures learnings. | `.sniper/` |

### Agent groupings by protocol phase

**Discover** -- analyst

**Plan** -- architect, product-manager

**Implement** -- backend-dev, frontend-dev, or fullstack-dev (spawned by lead-orchestrator based on project config)

**Review** -- code-reviewer, qa-engineer, gate-reviewer

**Retro** -- retro-analyst

**Orchestration** -- lead-orchestrator (active across all phases)

---

## Cognitive Personas {#cognitive-personas}

Cognitive personas are thinking-style mixins. They modify _how_ an agent reasons, not _what_ it does. SNIPER v3 ships three cognitive personas.

### devils-advocate {#devils-advocate}

Challenges assumptions, stress-tests designs, and finds failure modes before they reach production.

- Questions the happy path -- asks "What happens when this fails?"
- Hunts for edge cases: boundary values, timing issues, scale breaks, partial failures
- Every challenge comes with a concrete scenario, not vague doubt

**Best applied to:** code-reviewer, qa-engineer, analyst

See [full reference](/reference/personas/).

---

### performance-focused {#performance-focused}

Evaluates every decision through an efficiency lens -- latency, throughput, memory, scalability.

- Measures before optimizing -- profiles first, optimizes second
- Checks for N+1 queries, unbounded collections, unnecessary computation, blocking I/O
- Weighs speedup against complexity cost

**Best applied to:** backend-dev, fullstack-dev, architect

See [full reference](/reference/personas/).

---

### security-first {#security-first}

Evaluates every decision through a security lens -- threat modeling, least privilege, defense in depth.

- Asks "How could this be abused?" for every external input and API endpoint
- Checks input validation, authentication, authorization, data exposure, injection, secrets
- Flags concerns explicitly rather than making assumptions

**Best applied to:** architect, code-reviewer, backend-dev

See [full reference](/reference/personas/).

---

## Applying Cognitive Personas {#applying-cognitive-personas}

Cognitive personas are applied to agents via `.sniper/config.yaml`. Add the `cognitive` key under any agent's configuration:

```yaml
# .sniper/config.yaml
agents:
  architect:
    cognitive: security-first
  code-reviewer:
    cognitive: devils-advocate
  backend-dev:
    cognitive: performance-focused
```

Multiple cognitive personas can be applied to the same agent:

```yaml
agents:
  architect:
    cognitive:
      - security-first
      - performance-focused
```

When a cognitive persona is applied, its thinking framework is injected into the agent's context at spawn time. The agent retains all its original responsibilities but evaluates decisions through the additional cognitive lens.

---

## Quick Comparison {#quick-comparison}

| Concept | What it defines | Where it lives | How many |
|---------|----------------|----------------|----------|
| **Agent** | Role, model, write scope, responsibilities | `packages/core/agents/*.md` | 11 |
| **Cognitive persona** | Thinking style, decision framework | `packages/core/personas/cognitive/*.md` | 3 |
| **Protocol** | Phase sequence, which agents to spawn | `packages/core/protocols/*.yaml` | 7 |

---

## Further Reading {#further-reading}

- [Personas Guide](/guide/personas) -- detailed walkthrough of the persona system
- [Personas Reference](/reference/personas/) -- full text of each cognitive persona
