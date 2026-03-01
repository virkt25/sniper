---
title: Review Gates
description: Strict and flexible quality gates, multi-faceted review, and multi-model consensus
---

# Review Gates

Review gates are quality checkpoints that evaluate phase artifacts before the lifecycle advances. They enforce standards and catch problems early -- before bad decisions cascade through later phases.

## Gate Configuration

In v3, gates are configured **per-phase inside protocol YAML files** using `human_approval: boolean`:

```yaml
# Example from a protocol YAML
phases:
  plan:
    agents: [architect, product-manager]
    spawn_strategy: team
    gate:
      human_approval: true      # true = human must approve; false = auto-advance
      checklist: plan.yaml
```

### When `human_approval: true`

The most rigorous mode. The human must explicitly approve advancement.

**Behavior with no failures:**
- The review report is presented
- You are asked to approve, request revisions, or reject
- No advancement occurs without your explicit "yes"

**Behavior with warnings:**
- Warnings are listed with justifications
- You decide whether to approve despite warnings

**Behavior with failures:**
- Failures are listed as mandatory action items
- Advancement is blocked -- no override option
- Fix the issues and run `/sniper-review` again

This is the recommended setting for plan and review phases because these are high-risk transitions.

### When `human_approval: false`

Auto-advances when quality is acceptable, with async review.

**Behavior with no failures:**
- Auto-advances to the next phase
- Report is printed for your records

**Behavior with warnings:**
- Auto-advances despite warnings
- Warnings are noted for async review

**Behavior with failures:**
- Failures are presented and you are asked to choose:
  1. Have the agents fix the issues
  2. Override and advance anyway
  3. Stop and review manually

This is suitable for discover and implement phases where output can be refined in later iterations.

::: warning
Setting `human_approval: false` on plan or review phases is strongly discouraged. Bad architecture decisions cascade through the entire project, and unreviewed code can introduce bugs and security issues.
:::

## How Evaluation Works

When `/sniper-review` runs, it:

1. Determines the current active phase from the protocol checkpoint
2. Loads the phase-specific checklist from `.sniper/checklists/`
3. Identifies the artifacts to review based on the phase
4. Evaluates each checklist criterion against the actual artifact content
5. Assigns PASS, WARN, or FAIL to each item
6. Applies the gate policy based on the `human_approval` setting

### Evaluation Criteria

Each checklist item receives one of three statuses:

| Status | Meaning | Criteria |
|--------|---------|----------|
| **PASS** | Criterion is clearly met | Substantive content, specific (not generic), actionable depth |
| **WARN** | Partially met or needs improvement | Content exists but lacks specificity, vague language, incomplete sections |
| **FAIL** | Not met | Content missing entirely, only placeholder text, contradicts criterion |

The evaluator reads the full artifact content and checks each criterion. Template placeholders (`TODO`, `<!-- -->`) are treated as FAILs, not WARNs.

## Phase-Specific Checklists

### Discovery Checklist

Located at `.sniper/checklists/discover.yaml`. Evaluates discovery artifacts:

**Project Brief:**
- Problem statement is specific and evidence-based
- At least 3 direct competitors identified with features and pricing
- Unique value proposition clearly differentiates
- Target market segment defined with size estimates
- Key assumptions listed explicitly
- v1 scope separates in-scope from out-of-scope

**Risk Assessment:**
- Technical feasibility risks identified with specifics
- Integration and compliance risks documented
- Each risk has a mitigation strategy
- At least 2 devil's advocate findings

**User Personas:**
- At least 2 distinct personas defined
- Each has role, goals, pain points, workflows
- Primary user journey mapped
- Personas are realistic, not idealized

### Planning Checklist

Located at `.sniper/checklists/plan.yaml`. The most detailed checklist. Evaluates plan artifacts and cross-document consistency:

**PRD:** testable acceptance criteria, prioritized requirements (P0/P1/P2), measurable success metrics, no duplicates

**Architecture:** technology choices with rationale and alternatives, component diagram with boundaries, data models with field types, API contracts specific enough for independent implementation

**UX Spec:** information architecture covering all pages, user flows including error paths, component states (default/hover/active/disabled/loading/error), accessibility requirements

**Security:** auth model, authorization model, encryption strategy, compliance with named regulations, threat model

**Cross-Document Consistency:** API contracts match UX data needs, security is implementable within architecture, PRD requirements fully covered by architecture

### Implement Checklist

Located at `.sniper/checklists/implement.yaml`. Evaluates code and tests:

- Code quality, linting, type safety
- Test existence and pass rates
- Acceptance criteria verification
- Architecture compliance
- Security review

## Memory Compliance

When the memory system is active, review gates also check compliance with learned conventions, anti-patterns, and decisions:

- **Convention checks** -- verify that code follows codified conventions (e.g., "all API routes use Zod validation")
- **Anti-pattern scanning** -- search for known anti-patterns in changed files
- **Decision consistency** -- ensure changes do not contradict active architectural decisions

Memory compliance findings are advisory when `human_approval: false` and enforcement-level when `human_approval: true`.

## Domain Pack Checklists

Domain packs can provide additional checklist items. If `.sniper/packs/*/checklists/` contains any markdown files, those items are evaluated after the framework checklist.

For example, the sales-dialer pack adds a telephony review checklist that verifies TCPA compliance and call recording requirements.

## Running Reviews Manually

You can run a review at any time with:

```
/sniper-review
```

This evaluates the current active phase. The command reads the phase from the protocol checkpoint, loads the appropriate checklist, and produces a full report.

## Next Steps

- [Configuration](/guide/configuration) -- configure gates and protocols
- [Full Lifecycle](/guide/full-lifecycle) -- see gates in action across the lifecycle
- [Reference: Checklists](/reference/checklists/) -- browse all available checklists
