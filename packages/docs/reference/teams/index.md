---
title: Teams Reference
---

# Teams Reference

Teams define which agents are spawned for each phase, their persona compositions, task assignments, coordination rules, and review gate configuration. Team definitions are YAML files stored in `.sniper/teams/`.

## Standard Phase Teams

These teams are used by the core lifecycle phases.

| Team | File | Agents | Gate | Used By |
|------|------|--------|------|---------|
| [Discover](/reference/teams/discover) | `discover.yaml` | 3 (parallel) | Flexible | `/sniper-discover` |
| [Plan](/reference/teams/plan) | `plan.yaml` | 4 (with dependencies) | Strict | `/sniper-plan` |
| [Solve](/reference/teams/solve) | `solve.yaml` | 1 (single agent) | Flexible | `/sniper-solve` |
| [Sprint](/reference/teams/sprint) | `sprint.yaml` | Dynamic (from pool) | Flexible | `/sniper-sprint` |
| [Doc](/reference/teams/doc) | `doc.yaml` | 3 (with dependencies) | Flexible | `/sniper-doc` |

## Extended Teams

These teams support specialized workflows.

| Team | File | Agents | Used By |
|------|------|--------|---------|
| [Debug](/reference/teams/debug) | `debug.yaml` | 3 | `/sniper-debug` |
| [Feature Plan](/reference/teams/feature-plan) | `feature-plan.yaml` | 2 | `/sniper-feature` |
| [Ingest](/reference/teams/ingest) | `ingest.yaml` | 3 | `/sniper-ingest` |
| [Retro](/reference/teams/retro) | `retro.yaml` | 1 | Auto-retro after sprint |
| [Refactor](/reference/teams/refactor) | `refactor.yaml` | -- | `/sniper-audit refactor` |
| [Review PR](/reference/teams/review-pr) | `review-pr.yaml` | -- | `/sniper-audit review` |
| [Test](/reference/teams/test) | `test.yaml` | -- | `/sniper-audit tests` |
| [Security](/reference/teams/security) | `security.yaml` | -- | `/sniper-audit security` |
| [Perf](/reference/teams/perf) | `perf.yaml` | -- | `/sniper-audit performance` |
| [Review Release](/reference/teams/review-release) | `review-release.yaml` | -- | Release readiness |

## Workspace Teams

These teams handle multi-repo orchestration.

| Team | File | Agents | Used By |
|------|------|--------|---------|
| [Workspace Feature](/reference/teams/workspace-feature) | `workspace-feature.yaml` | -- | `/sniper-workspace feature` |
| [Workspace Validation](/reference/teams/workspace-validation) | `workspace-validation.yaml` | -- | `/sniper-workspace validate` |

## Team YAML Structure

Every team YAML follows this structure:

```yaml
phase: plan
description: "Planning and architecture phase"

teammates:
  - name: architect
    compose:
      process: architect
      technical: backend
      cognitive: systems-thinker
    model_override: opus          # Optional: force a specific model
    tasks:
      - id: architecture
        name: "Architecture Design"
        output: "docs/architecture.md"
        plan_approval: true       # Requires lead approval before execution
        blocked_by: [prd]         # Wait for this task to complete first

coordination:
  pairs:
    - [architect, security-analyst]
    - [product-manager, ux-designer]

review_gate:
  checklist: plan-review
  mode: strict                    # strict | flexible | auto
```

### Key Fields

- **`compose`** -- persona layers to merge for this agent
- **`model_override`** -- forces a specific model tier (e.g., `opus` for complex tasks)
- **`tasks`** -- what the agent produces, with dependency ordering via `blocked_by`
- **`plan_approval`** -- if true, the agent must describe its approach and wait for lead approval
- **`coordination.pairs`** -- agents that must share work and align during execution
- **`owns_from_config`** -- (sprint teams) maps to an ownership key in `config.yaml`

## Dynamic Teams

The sprint team uses an `available_teammates` pool rather than a fixed roster. The team lead selects which teammates to spawn based on the stories chosen for the sprint:

```yaml
available_teammates:
  - name: backend-dev
    compose:
      process: developer
      technical: backend
    owns_from_config: backend
  - name: frontend-dev
    compose:
      process: developer
      technical: frontend
    owns_from_config: frontend
  - name: qa-engineer
    compose:
      process: qa-engineer
    # QA has no file ownership -- it reads all code
```

## Domain Pack Overrides

Domain packs can add extra teammates to standard teams using `team_overrides` in `pack.yaml`. Pack teammates are additive -- they do not replace existing team members. See [Domain Packs](/guide/domain-packs) for details.

## Related

- [Teams Guide](/guide/teams) -- detailed explanation of team coordination and task dependencies
- [Personas](/reference/personas/) -- persona layers referenced in `compose`
- [Configuration](/guide/configuration) -- ownership keys referenced by `owns_from_config`
