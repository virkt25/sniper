# Remove Token Budget / Cost / Velocity System

> **Date**: 2026-03-08
> **Status**: Implemented
> **Branch**: `remove-token-budget-system`

---

## Motivation

The token management system (budgets, cost tracking, velocity calibration) is declaratively complete but has zero runtime enforcement. There is no mechanism to actually count tokens consumed during Claude Code execution — the system assumes agents self-report, but no API exposes token metrics to skills or agents. The result is dead complexity: schemas, templates, CLI code, docs, and agent instructions that describe a system that cannot work.

Removing it simplifies the framework, reduces cognitive load for users, and eliminates misleading documentation about "budget enforcement" and "hard caps" that don't exist.

---

## Scope

Remove **all** of the following concepts:
- Token budgets on protocols
- Cost tracking (`.sniper/cost.yaml`)
- Velocity calibration (`.sniper/memory/velocity.yaml`, calibrated budgets, rolling averages)
- Cost enforcement thresholds (`warn_threshold`, `soft_cap`, `hard_cap`)
- Token budget annotations on templates
- `CostExceeded` exit code from headless mode

**Keep** these (they are unrelated or useful independently):
- Retro-analyst agent (keep for retrospectives and signal capture — just strip velocity tracking duties)
- Memory system and `token_budget` for spawn prompt context limits (this is a different concept — controls how much memory text is injected into prompts)
- Knowledge manifest `token_limit` fields (controls context injection, not execution budgets)
- The `containers.ts` token variables (markdown-it parser tokens, unrelated)

---

## File-by-File Plan

### Phase 1: Delete Files (4 files)

| File | Action |
|------|--------|
| `packages/core/schemas/cost.schema.yaml` | Delete |
| `packages/core/schemas/velocity.schema.yaml` | Delete |
| `packages/core/templates/cost.yaml` | Delete |
| `packages/core/templates/velocity.yaml` | Delete |

### Phase 2: Core Modifications (15 files)

#### Protocols — remove `budget` field (7 files)

| File | Change |
|------|--------|
| `packages/core/protocols/full.yaml` | Remove `budget: 2000000` line |
| `packages/core/protocols/feature.yaml` | Remove `budget: 800000` line |
| `packages/core/protocols/patch.yaml` | Remove `budget: 200000` line |
| `packages/core/protocols/hotfix.yaml` | Remove `budget: 100000` line |
| `packages/core/protocols/refactor.yaml` | Remove `budget: 600000` line |
| `packages/core/protocols/ingest.yaml` | Remove `budget: 1000000` line |
| `packages/core/protocols/explore.yaml` | Remove `budget: 500000` line |

#### Config template

| File | Change |
|------|--------|
| `packages/core/config.template.yaml` | Remove `routing.budgets` section, `cost` section, `visibility.cost_tracking` |

#### Schemas — remove token/cost subsections (2 files)

| File | Change |
|------|--------|
| `packages/core/schemas/checkpoint.schema.yaml` | Remove `token_usage` object (phase_tokens, cumulative_tokens, budget_remaining) |
| `packages/core/schemas/live-status.schema.yaml` | Remove `cost` object (tokens_used, budget, percent) |

#### Templates — remove token/cost subsections (2 files)

| File | Change |
|------|--------|
| `packages/core/templates/checkpoint.yaml` | Remove `token_usage` section |
| `packages/core/templates/live-status.yaml` | Remove `cost` section |

#### Templates — remove budget comments (4 files)

| File | Change |
|------|--------|
| `packages/core/templates/prd.md` | Remove `<!-- Budget: 3000 tokens max -->` and per-section token comments |
| `packages/core/templates/story.md` | Remove `<!-- Budget: 1500 tokens max -->` and per-section token comments |
| `packages/core/templates/architecture.md` | Remove any token budget comments |
| `packages/core/templates/discovery-brief.md` | Remove any token budget comments |

### Phase 3: Agent & Skill Modifications (4 files)

| File | Change |
|------|--------|
| `packages/core/agents/retro-analyst.md` | Remove "Velocity Tracking" section and token-related responsibilities. Keep retrospective analysis, signal capture, and learnings. |
| `packages/core/agents/architect.md` | Remove "4000 token budget" comment |
| `packages/core/agents/analyst.md` | Remove "Respect token budgets annotated in templates" rule |
| `packages/core/agents/product-manager.md` | Remove "1500 token budget each" comment |

| File | Change |
|------|--------|
| `packages/core/skills/sniper-flow/SKILL.md` | Remove "Cost Tracking" section, calibrated budget check in phase setup, "ALWAYS respect token budgets" rule |
| `packages/core/skills/sniper-status/SKILL.md` | Remove `.sniper/cost.yaml` from state files, cost summary display, velocity trends display |

### Phase 4: CLI Modifications (6 files)

| File | Change |
|------|--------|
| `packages/cli/src/config.ts` | Remove `budgets` from routing interface, remove `cost` interface, remove `cost_tracking` from visibility, remove `DEFAULT_BUDGETS` export |
| `packages/cli/src/commands/init.ts` | Remove `DEFAULT_BUDGETS` import/usage, remove cost config initialization, remove `cost_tracking: true` |
| `packages/cli/src/commands/migrate.ts` | Remove budget/cost initialization, remove "cost enforcement" output |
| `packages/cli/src/commands/status.ts` | Remove cost display block, remove velocity calibration display |
| `packages/cli/src/commands/dashboard.ts` | Remove `token_usage` from Checkpoint interface, remove velocity fields, remove `cost_breakdown`, remove `formatTokens()` helper |
| `packages/cli/src/commands/protocol.ts` | Remove budget validation, remove budget prompt/handling |
| `packages/cli/src/headless.ts` | Remove `CostExceeded` exit code, remove `totalTokens`/`tokens` from interfaces and output |

### Phase 5: Documentation (14+ files)

#### Root

| File | Change |
|------|--------|
| `CLAUDE.md` | Remove "Artifact templates with token budgets", remove "velocity" from schemas list, remove "Velocity Calibration" bullet, update `/sniper-status` description to remove "cost" |

#### Generated docs (delete or regenerate)

| File | Action |
|------|--------|
| `packages/docs/generated/schemas/cost.md` | Delete |
| `packages/docs/generated/schemas/velocity.md` | Delete |
| `packages/docs/generated/templates/cost.md` | Delete |
| `packages/docs/generated/templates/velocity.md` | Delete |

#### Guide pages (modify)

| File | Change |
|------|--------|
| `packages/docs/guide/configuration.md` | Remove `routing.budgets` example, remove `cost` section, remove `cost_tracking` from visibility, remove velocity calibration references |
| `packages/docs/guide/architecture.md` | Remove "Cost Tracking" section, remove budget/tokens from protocol example, remove cost tree diagram |
| `packages/docs/guide/full-lifecycle.md` | Remove "Cost Tracking and Budget Enforcement" section, remove cost.yaml from checkpoint description, remove token references from phase snapshot description |
| `packages/docs/guide/memory.md` | Remove `velocity.yaml` from memory file list, remove "Token Budget" subsection (the one about execution budgets — keep the spawn prompt token_budget concept if it exists separately) |
| `packages/docs/guide/signals-and-learning.md` | Remove "Velocity Calibration" section, remove `cost_tracking` from config example |
| `packages/docs/guide/custom-protocols.md` | Remove `budget` from protocol definition table, examples, required fields, and validation errors |
| `packages/docs/guide/migration-from-v2.md` | Remove budget/cost sections from v3 config example, remove budget/cost rows from feature table |
| `packages/docs/guide/advanced-features.md` | Update description meta, remove "token spend" warning from multi-model review |
| `packages/docs/guide/headless-ci.md` | Remove cost exceeded exit code if mentioned |
| `packages/docs/guide/troubleshooting.md` | Remove "Memory exceeding token budget" section (if it's about execution budgets) |

#### Cheatsheets (modify)

| File | Change |
|------|--------|
| `packages/docs/guide/cheatsheet-commands.md` | Remove "Budget" column from protocol table, remove cost exit code, remove cost/velocity from status description |
| `packages/docs/guide/cheatsheet-teams.md` | Remove `budget: XK tokens` from all protocol descriptions |
| `packages/docs/guide/cheatsheet-personas.md` | Remove "velocity tracking" from retro-analyst description |

#### Reference pages (modify)

| File | Change |
|------|--------|
| `packages/docs/reference/schemas/index.md` | Remove `cost` and `velocity` rows, remove "cost tracking" from intro, remove tokens from checkpoint description, remove cost from live-status description, remove budget from protocol description |
| `packages/docs/reference/templates/index.md` | Remove Cost and Velocity rows |
| `packages/docs/reference/commands/index.md` | Remove "cost" from `/sniper-status` description, remove "token budgets" from flow description |

#### Other guide pages (minor edits)

| File | Change |
|------|--------|
| `packages/docs/guide/personas.md` | Remove "velocity metrics" from retro-analyst, remove execution budget sentence from memory token_budget section |
| `packages/docs/guide/teams.md` | Remove "velocity tracking" from retro-analyst row |
| `packages/docs/guide/why-sniper.md` | Remove "velocity calibration" from feature list |
| `packages/docs/guide/getting-started.md` | Keep `signals/` dir — just remove "Velocity" from its description if present |
| `packages/docs/guide/core-concepts.md` | Check for and remove any budget enforcement references |
| `packages/docs/guide/glossary.md` | Remove budget/velocity/cost glossary entries if they exist |

#### Website components

| File | Change |
|------|--------|
| `packages/docs/.vitepress/theme/components/home/BentoGrid.vue` | Remove "set budgets" from headless mode description |
| `packages/docs/public/llms.txt` | Remove cost/velocity schema references, remove budget references from configuration description, remove cost template reference, remove velocity template reference, remove dashboard cost reference |

#### Headless command docs

| File | Change |
|------|--------|
| `packages/docs/generated/commands/sniper-flow-headless.md` | Remove "Cost exceeded" exit code |

### Phase 6: Checklists (check and modify)

| File | Change |
|------|--------|
| `packages/core/checklists/retro.yaml` | Remove velocity update validation if present |
| `packages/core/checklists/define.yaml` | Remove token budget checks if present |
| `packages/core/checklists/design.yaml` | Remove token budget checks if present |
| `packages/core/checklists/plan.yaml` | Remove token budget checks if present |

### Phase 7: Protocol schema

| File | Change |
|------|--------|
| `packages/core/schemas/protocol.schema.yaml` (if it exists) | Remove `budget` from required fields and properties |
| `packages/docs/generated/schemas/protocol.md` | Remove budget from protocol schema docs |

---

## Verification

After all changes:

1. `pnpm build` — ensure CLI compiles without cost/budget type errors
2. Grep the entire repo for orphaned references: `budget`, `velocity`, `cost_tracking`, `token_usage`, `calibrated_budget`, `warn_threshold`, `soft_cap`, `hard_cap`, `CostExceeded`, `formatTokens`, `DEFAULT_BUDGETS`
3. Verify `sniper init` generates a valid config without cost/budget sections
4. Verify `sniper status` renders without cost/velocity panels
5. Review generated docs site for broken links to deleted pages

---

## Changeset

Type: **breaking**
Packages: `@sniper.ai/core`, `@sniper.ai/cli`
Message: Remove token budget, cost tracking, and velocity calibration systems — these were declaratively defined but never enforced at runtime.

---

## Total Impact

- **Files deleted:** 8 (4 core + 4 generated docs)
- **Files modified:** ~45
- **Lines removed:** ~500+ (estimated)
- **Concepts removed:** token budgets, cost tracking, velocity calibration, budget enforcement thresholds, CostExceeded exit code
- **Concepts kept:** memory token_budget (spawn prompt context limits), knowledge token_limit (context injection limits), retro-analyst (retrospectives without velocity)
