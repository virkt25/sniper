---
title: Full Lifecycle
description: Walk through a complete SNIPER lifecycle from discovery to release with parallel agent teams
---

# Full Lifecycle Walkthrough

The full lifecycle workflow takes a project from initial research through implementation. Use this for greenfield projects, major rewrites, or any project that benefits from structured planning and governance.

## Overview

```
/sniper-init  -->  /sniper-discover  -->  /sniper-plan  -->  /sniper-solve  -->  /sniper-sprint
   Setup           Phase 1               Phase 2            Phase 3             Phase 4 (repeating)
```

## Step 1: Initialize

```
/sniper-init
```

Configure your project name, type, tech stack, domain pack, and review gates. This creates the `.sniper/` directory and `config.yaml`.

See [Getting Started](/guide/getting-started) for the full init walkthrough.

## Step 2: Discover (Phase 1)

```
/sniper-discover
```

**Team:** 3 parallel agents

| Agent | Persona Layers | Output |
|-------|---------------|--------|
| analyst | process/analyst + cognitive/systems-thinker | `docs/brief.md` |
| risk-researcher | process/analyst + technical/infrastructure + cognitive/devils-advocate | `docs/risks.md` |
| user-researcher | process/analyst + cognitive/user-empathetic | `docs/personas.md` |

**How it works:**

1. The command reads your project configuration and team definition
2. Spawn prompts are composed by merging persona layer files into the template
3. Three agents are spawned in parallel -- they work independently
4. You enter delegate mode as team lead, monitoring progress and answering questions
5. When all three complete, a review gate evaluates the output

**Gate:** Flexible (auto-advance if no critical failures)

**What the artifacts contain:**

- **brief.md** -- market landscape, competitive analysis, unique value proposition, target market, constraints, assumptions
- **risks.md** -- technical feasibility risks, integration risks, compliance concerns, scalability challenges, mitigation strategies
- **personas.md** -- 2-4 user personas with goals, pain points, workflows, and journey maps

::: tip
If artifacts already exist from a previous run, agents enter amendment mode -- they update existing content rather than starting from scratch.
:::

## Step 3: Plan (Phase 2)

```
/sniper-plan
```

**Team:** 4 agents with dependencies

| Agent | Persona Layers | Output | Blocked By |
|-------|---------------|--------|------------|
| product-manager | process/product-manager + technical/api-design + cognitive/systems-thinker | `docs/prd.md` | Nothing |
| architect | process/architect + technical/backend + cognitive/security-first | `docs/architecture.md` | PRD |
| ux-designer | process/ux-designer + technical/frontend + cognitive/user-empathetic | `docs/ux-spec.md` | PRD |
| security-analyst | process/architect + technical/security + cognitive/security-first | `docs/security.md` | PRD |

**How it works:**

1. The product manager starts immediately, reading all Phase 1 artifacts
2. The other three agents are blocked until the PRD is complete
3. Once the PM finishes, you unblock the remaining agents
4. The architect has `plan_approval: true` -- they must describe their approach before executing, and you must approve it
5. Coordination pairs align: architect with security-analyst on security architecture, architect with ux-designer on API contracts

**Gate:** Strict (human must explicitly approve)

This is the most critical gate. The review evaluates every artifact against a detailed checklist covering requirement specificity, architecture completeness, UX coverage, security requirements, and cross-document consistency.

::: warning
The plan gate cannot be skipped, even with arguments. Bad architecture decisions cascade through the entire project.
:::

**Model override:** The plan phase uses the `opus` model for all teammates, producing higher-quality output for these critical artifacts.

## Step 4: Solve (Phase 3)

```
/sniper-solve
```

**Agent:** Single agent (you adopt the scrum-master persona)

Unlike the other phases, solve does not spawn a team. You work directly as a scrum master, reading all Phase 2 artifacts and breaking them into implementable units.

**What it produces:**

- **6-12 epics** in `docs/epics/` -- each with clear scope boundaries, embedded architecture context, dependencies, and acceptance criteria
- **3-8 stories per epic** in `docs/stories/` -- self-contained implementation units

**Critical requirement: self-contained stories.** Each story file embeds all context from the PRD, architecture, and UX spec that a developer needs. A teammate reading only the story file has everything needed to implement it -- no "see architecture doc" references.

Story format includes:

- Epic reference and priority
- Embedded context from PRD, architecture, and UX spec (copied, not referenced)
- Acceptance criteria in Given/When/Then format
- Test requirements (unit, integration, e2e)
- File ownership (which directories the implementation touches)
- Complexity estimate (S/M/L -- never XL, split if needed)
- Dependencies on other stories

**Gate:** Flexible (auto-advance)

A self-review runs against the story checklist before completing.

## Step 5: Sprint (Phase 4 -- Repeating)

```
/sniper-sprint
```

**Team:** Dynamic based on story requirements

Available teammates:

| Teammate | Persona Layers | Owns | Model |
|----------|---------------|------|-------|
| backend-dev | process/developer + technical/backend + cognitive/systems-thinker | backend dirs | sonnet |
| frontend-dev | process/developer + technical/frontend + cognitive/user-empathetic | frontend dirs | sonnet |
| infra-dev | process/developer + technical/infrastructure + cognitive/systems-thinker | infrastructure dirs | sonnet |
| ai-dev | process/developer + technical/ai-ml + cognitive/performance-focused | ai dirs | opus |
| qa-engineer | process/qa-engineer + technical/backend + cognitive/devils-advocate | test dirs | sonnet |

**How it works:**

1. You are presented with all available stories and select which to include in this sprint
2. SNIPER determines which teammates are needed based on story file ownership
3. Stories are assigned to teammates; QA tasks are created blocked by implementation tasks
4. Teammates are spawned with their composed prompts and assigned stories
5. If both backend-dev and frontend-dev are present, API contract alignment is facilitated immediately
6. As implementation tasks complete, QA tasks unblock and testing begins
7. When all tasks complete, a review gate evaluates the sprint output

**Gate:** Strict (human must review code before advancing)

**Sprint rules:**
- Each teammate reads their assigned story files completely before writing code
- Backend and frontend must agree on API contracts before implementing
- All new code must include tests
- QA is blocked until implementation stories are complete
- Every teammate messages the team lead on completion
- Blocked agents escalate after 10 minutes

After the sprint review passes, a retrospective automatically runs if memory is enabled. Findings are codified into the memory system for future sprints.

Repeat `/sniper-sprint` with new story selections until all stories are complete.

## Recovery

If any phase produces poor output:

- Re-run the phase command to enter amendment mode
- Completed files persist on disk -- only the conversation resets
- Sprint failures affect only the current sprint's stories

## Alternative Workflows

Not every project needs the full lifecycle. SNIPER also provides:

- **`/sniper-ingest`** -- bootstrap artifacts from an existing codebase
- **`/sniper-feature`** -- scoped mini-lifecycle for a single feature
- **`/sniper-debug`** -- structured bug investigation
- **`/sniper-audit`** -- refactoring, PR reviews, test audits, security audits, performance profiling

## Next Steps

- [Review Gates](/guide/review-gates) -- understand how gates work in detail
- [Teams](/guide/teams) -- learn team YAML structure
- [Configuration](/guide/configuration) -- customize the lifecycle for your project
