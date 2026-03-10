# Documentation Update Plan

## Overview

The docs site (`packages/docs/` → sniperai.dev) and package READMEs are outdated compared to the actual codebase. This plan covers all 28 identified issues across 19 files.

## Key Discrepancies

| What Changed | Docs Say | Actual State |
|---|---|---|
| Agent count | 11 | **13** (added `doc-writer`, `memory-curator`) |
| Skill count | 4 | **5** (added `/sniper-learn`) |
| Checklist count | 9 | **13** (added `define`, `design`, `solve`, `retro`) |
| Full protocol phases | discover → plan → implement → review | **discover → define → design → solve → implement → review → retro** |
| `/sniper-flow-headless` | Documented as slash command | **Doesn't exist** — headless mode is `sniper run` CLI command |
| Signals system | Documented as active | **Replaced** by unified learning system (v3.3.0) |
| Cost/velocity tracking | Referenced in docs | **Removed** (commit 867b4cf) |

---

## Tasks (by priority)

### Critical (13 issues)

#### 1. Root README.md
- [ ] Update 4-phase description to reflect 7-phase full protocol (discover → define → design → solve → implement → review → retro)
- [ ] Replace "Plan" phase with define/design/solve split

#### 2. packages/core/README.md
- [ ] Fix agent count: 11 → 13
- [ ] Fix skill count: 4 → 5
- [ ] Fix checklist count: 9 → 13
- [ ] Add `doc-writer` and `memory-curator` to agent list
- [ ] Add `/sniper-learn` to skills table
- [ ] Remove "cost" reference from `/sniper-status` description
- [ ] Update or remove `signal-record.yaml` template reference

#### 3. packages/cli/README.md
- [ ] Remove `/sniper-flow-headless` slash command reference
- [ ] Clarify headless mode is via `sniper run` CLI command
- [ ] Add `/sniper-learn` if missing from slash commands table

#### 4. packages/docs/guide/what-is-sniper.md
- [ ] Update 4-phase example to show full 7-phase lifecycle

#### 5. packages/docs/guide/architecture.md
- [ ] Add `/sniper-learn` to skills list

#### 6. packages/docs/guide/core-concepts.md
- [ ] Fix agent count: 11 → 13
- [ ] Add `doc-writer` and `memory-curator` to agent list
- [ ] Add `define` and `solve` phases to phase catalog

#### 7. packages/docs/guide/personas.md
- [ ] Fix agent count (inconsistent: says 12 in one place, lists 11)
- [ ] Add `doc-writer` and `memory-curator` to roster

#### 8. packages/docs/guide/teams.md
- [ ] Fix agent count: 12 → 13

#### 9. packages/docs/guide/full-lifecycle.md
- [ ] Rewrite "Plan" phase section → split into Define, Design, Solve
- [ ] Update phase flow diagram

#### 10. packages/docs/guide/headless-ci.md
- [ ] Replace all `/sniper-flow-headless` references with `sniper run` CLI
- [ ] Update examples and configuration accordingly

#### 11. packages/docs/guide/signals-and-learning.md
- [ ] Rename/reframe from "Signals & Learning" to focus on Learning system
- [ ] Remove deprecated signal architecture section
- [ ] Document `/sniper-learn` slash command and memory-based learning

#### 12. packages/docs/guide/migration-from-v2.md
- [ ] Replace `/sniper-flow-headless` with `sniper run` in migration table

#### 13. packages/docs/generated/commands/sniper-flow-headless.md
- [ ] Delete this file (documents non-existent command)

### Moderate (4 issues)

#### 14. packages/docs/reference/checklists/index.md
- [ ] Add missing checklists: `define`, `design`, `solve`, `retro`

#### 15. packages/docs/reference/cli/index.md
- [ ] Document `sniper run` command properly

#### 16. packages/docs/guide/memory.md
- [ ] Clarify memory configuration is driven by `auto_retro` flag

#### 17. packages/docs/guide/cheatsheet-commands.md
- [ ] Verify `/sniper-learn` link works (may already be listed)

### Minor (3 issues)

#### 18. packages/docs/guide/advanced-features.md
- [ ] Verify model name references are current

#### 19. packages/docs/guide/plugin-development.md
- [ ] Verify plugin.yaml example matches v3 schema

#### 20. packages/docs/.vitepress/config.mts
- [ ] Remove sidebar entry for `sniper-flow-headless` if present
- [ ] Verify all sidebar entries match actual files

---

## Approach

1. Start with the 3 package READMEs and root README (highest visibility)
2. Then tackle guide pages (most user-facing content)
3. Then reference pages and generated content
4. Finally, verify sidebar/nav config matches
5. Remove the non-existent `sniper-flow-headless.md` generated doc

## Files Affected (19 total)

```
README.md
packages/core/README.md
packages/cli/README.md
packages/docs/guide/what-is-sniper.md
packages/docs/guide/architecture.md
packages/docs/guide/core-concepts.md
packages/docs/guide/personas.md
packages/docs/guide/teams.md
packages/docs/guide/full-lifecycle.md
packages/docs/guide/headless-ci.md
packages/docs/guide/signals-and-learning.md
packages/docs/guide/migration-from-v2.md
packages/docs/guide/memory.md
packages/docs/guide/cheatsheet-commands.md
packages/docs/guide/advanced-features.md
packages/docs/guide/plugin-development.md
packages/docs/reference/checklists/index.md
packages/docs/reference/cli/index.md
packages/docs/generated/commands/sniper-flow-headless.md (DELETE)
packages/docs/.vitepress/config.mts
```
