# SNIPER v2 — Command UX & Developer Experience

> **Guiding principle:** A developer should never have to ask "which command do I use?" The right command should be obvious from their situation.

---

## The Problem with 17 Commands

The v2 feature plan adds 8 new commands to the existing 9, totaling 17. That's too many. Developers will:
- Feel overwhelmed scanning the list
- Confuse similar commands (`/sniper-test` vs `/sniper-qa` vs `/sniper-review`)
- Avoid using the framework because the learning curve feels steep

## Design Principles

1. **Situation-driven, not capability-driven.** Commands should map to "I need to ___" not "this tool can ___."
2. **5-second rule.** A developer should pick the right command within 5 seconds of thinking about what they need.
3. **Progressive disclosure.** Core commands are few and obvious. Specialist modes are discoverable but not in your face.
4. **Consolidate by intent, not by implementation.** If two features serve the same developer intent ("make my code better"), they're modes of one command, not two commands.

---

## Proposed Command Set: 12 Commands

### Tier 1 — Core Workflow (used constantly)

These are the commands a developer uses every day. They should be memorized.

| Command | When to use | What it does |
|---------|-------------|--------------|
| `/sniper-feature` | "I want to add something to my app" | Runs the feature lifecycle: scoping → spec → stories → sprint. The primary way work gets done after initial setup. |
| `/sniper-sprint` | "I have stories ready, let's build" | Spawns the implementation team. Used by both the full lifecycle and feature lifecycle. |
| `/sniper-status` | "Where am I? What's next?" | Shows current phase, active features, open bugs, incomplete stories, and suggests the next action. |
| `/sniper-review` | "Is this phase/sprint done?" | Runs the quality gate for the current phase. Blocks advancement if checks fail. |

**Developer mental model:** Feature → Sprint → Review → repeat.

---

### Tier 2 — Project Setup (used at milestones)

These commands are used when setting up a project or doing full-scale planning. Most developers use them once or a few times.

| Command | When to use | What it does |
|---------|-------------|--------------|
| `/sniper-init` | "Setting up SNIPER for the first time" | Scaffolds `.sniper/` config and framework files. For existing codebases, prompts to run ingestion automatically. |
| `/sniper-ingest` | "SNIPER needs to understand my existing codebase" | 3-agent team reverse-engineers architecture, conventions, and project structure. Run once after init on existing projects, or re-run after major changes. |
| `/sniper-discover` | "Starting a new product from scratch" | Full discovery team: brief, risks, personas. Only needed for greenfield or major pivots. |
| `/sniper-plan` | "Need full architectural planning" | Full planning team: PRD, architecture, UX spec, security analysis. For greenfield or major new product areas. |
| `/sniper-solve` | "Break the plan into implementable stories" | Shards epics into stories from planning artifacts. Used after `/sniper-plan` or scoped to a feature. |

**Developer mental model:** Init (once) → Discover → Plan → Solve → then use Tier 1 commands for ongoing work.

---

### Tier 3 — Specialist Workflows (used as needed)

These commands serve specific situations. They're discoverable via `/sniper-status` suggestions and help text.

| Command | When to use | What it does |
|---------|-------------|--------------|
| `/sniper-debug` | "Something is broken and I need help investigating" | Spawns a debugging team: triage, investigation, fix, regression tests. Produces investigation logs and post-mortems. |
| `/sniper-audit` | "I want to improve code quality" | **Consolidated command** covering refactoring, testing, security, and performance. Uses `--target` flag to select focus. |
| `/sniper-doc` | "Docs need updating" | Documentation team with managed-section support for non-destructive updates. |

---

## The `/sniper-audit` Consolidation

Instead of 5 separate commands (`refactor`, `test`, `security`, `perf`, `qa`), a single `/sniper-audit` command with a target selector:

```
/sniper-audit --target refactor "Migrate from Express to Fastify"
/sniper-audit --target tests
/sniper-audit --target security
/sniper-audit --target performance "API latency regression"
/sniper-audit --target review --pr 42
/sniper-audit --target review --release v2.5.0
```

If no `--target` is given, the command asks the developer what they want to improve — or runs a general health scan that identifies the highest-priority area.

**Why this works:**
- All of these share the same developer intent: "make my codebase better in a specific way"
- They all follow the same pattern: analyze → plan → fix → verify
- A developer doesn't need to remember 5 command names — they remember "audit" and pick a target
- New targets can be added without new commands (e.g., `--target accessibility`, `--target i18n`)

**Why not consolidate further?** `/sniper-debug` stays separate because it has a fundamentally different trigger — something is *broken* and urgent, vs. proactive improvement. The UX should feel different (urgency vs. maintenance).

---

## Removed: `/sniper-compose`

`/sniper-compose` (compose spawn prompts from persona layers) is a framework internals tool, not a developer workflow command. It should:
- Still exist as a utility
- Not appear in the main command list
- Be documented under "Advanced / Framework Development" section
- Be invoked internally by other commands when they need to compose prompts

---

## Command Count Summary

| Version | Commands | Notes |
|---------|----------|-------|
| v1 | 9 | Including /sniper-compose (internal) |
| v2 (naive) | 17 | Too many |
| **v2 (proposed)** | **12** | 4 core + 5 setup + 3 specialist |
| v2 (excluding internal) | **11** | What the developer actually sees |

---

## Developer Experience Flows

### Flow 1: New greenfield project

```
/sniper-init                          # scaffold SNIPER
/sniper-discover                      # brief, risks, personas
/sniper-review                        # gate check
/sniper-plan                          # PRD, architecture, UX, security
/sniper-review                        # gate check (strict — human approval)
/sniper-solve                         # epics & stories
/sniper-review                        # gate check
/sniper-sprint                        # build sprint 1
/sniper-review                        # code review gate
/sniper-sprint                        # build sprint 2...
```

After initial build, switch to feature-driven development:

```
/sniper-feature "Add webhook support"  # ongoing feature work
/sniper-feature "Add admin dashboard"
```

### Flow 2: Existing project adoption

```
/sniper-init                          # scaffold SNIPER
/sniper-ingest                        # reverse-engineer architecture & conventions
# Review generated docs, make corrections
/sniper-feature "Add webhook support"  # start building immediately
```

No need for discover/plan/solve — the codebase IS the plan.

### Flow 3: Day-to-day feature development (the 90% case)

```
/sniper-feature "Add email notifications"
# → auto-runs: scoping → spec → arch delta → stories → sprint
# → produces: docs/features/SNPR-0014/
/sniper-review                        # review the feature
```

One command to go from idea to implementation plan to code.

### Flow 4: Production incident

```
/sniper-debug "Checkout returns 500 after deploy v2.4.1"
# → triage → investigate → fix → regression tests
# → produces: docs/bugs/checkout-500/
```

### Flow 5: Proactive quality improvement

```
/sniper-audit --target tests          # improve test coverage
/sniper-audit --target security       # security audit
/sniper-audit --target refactor "Extract payment module"
/sniper-audit --target review --pr 42 # code review
```

### Flow 6: "I don't know what to do next"

```
/sniper-status
```

Output:
```
SNIPER Status — my-saas-app
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lifecycle:    existing (ingested)
Last Phase:   sprint-3 (completed 2026-02-18)

Active Features:
  SNPR-0014  Add webhooks           sprint (3/5 stories done)
  SNPR-0015  Admin dashboard        planning

Open Bugs:
  BUG-001    Checkout 500 errors    investigating

Suggested Next Actions:
  → /sniper-sprint                   Resume webhook sprint (2 stories remaining)
  → /sniper-debug                    Continue checkout investigation
  → /sniper-audit --target tests     Test coverage is at 47%
```

---

## Help Text Design

When a developer runs `/sniper-init` for the first time, the welcome message should teach the mental model, not list all commands:

```
SNIPER initialized for my-saas-app.

Quick start:
  New project?     → /sniper-discover    (start with discovery)
  Existing code?   → /sniper-ingest      (let agents learn your codebase)
  Add a feature?   → /sniper-feature     (the main way work gets done)
  Something broke? → /sniper-debug       (agent-team debugging)
  Check status?    → /sniper-status      (see where you are)
```

---

## Migration from v1

Existing v1 users see no breaking changes:
- All v1 commands (`discover`, `plan`, `solve`, `sprint`, `review`, `doc`, `status`) work identically
- `/sniper-compose` still works but is no longer listed in help
- New commands (`feature`, `ingest`, `debug`, `audit`) are additive
- Config schema migration is handled by `sniper update`
