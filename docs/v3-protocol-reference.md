# SNIPER v3 Protocol Reference

Protocols define what happens when you run `/sniper-flow`. Each protocol is a sequence of phases with gates between them.

---

## Why Protocols

v2 had one lifecycle for everything: discover, plan, solve, sprint, review. A one-line bug fix went through the same ceremony as a greenfield project. v3 replaces this with right-sized protocols that match scope to process.

## Protocol Overview

| Protocol | Phases | Human Gates | When to Use |
|---|---|---|---|
| `full` | discover, plan, decompose, implement, review | plan-approval, final-review | New projects, major features |
| `feature` | plan, implement, review | plan-approval | Scoped feature with clear requirements |
| `patch` | implement, review | final-review | Bug fixes, small changes (<300 LOC) |
| `hotfix` | implement | none (auto-review) | Critical fixes, minimal ceremony |
| `explore` | discover | none | Research, investigation, analysis |
| `refactor` | analyze, implement, review | final-review | Code improvement, no behavior change |
| `ingest` | scan, document, extract | none | Brownfield codebase onboarding |

## Auto-Selection

When you run `/sniper-flow "your intent"`, the framework analyzes your description and selects a protocol:

- **Explicit scope words** ("add feature", "build system", "create module") map to `feature` or `full` based on estimated size.
- **Fix/bug language** ("fix", "broken", "error", "crash") maps to `patch` or `hotfix` based on urgency.
- **Analysis language** ("analyze", "investigate", "profile", "benchmark") maps to `explore`.
- **Refactor language** ("refactor", "clean up", "reorganize", "extract") maps to `refactor`.
- **Onboarding language** ("onboard", "understand codebase", "document existing") maps to `ingest`.
- **Ambiguous scope** defaults to the `default_protocol` in your config (typically `feature`).

Override with `--protocol`:

```
/sniper-flow --protocol full "Add user authentication"
```

## Protocol Details

### Full Protocol

The complete lifecycle for substantial work.

```
discover → plan → decompose → implement → review
```

**Discover phase:**
- Agents: analyst, product-manager
- Work: Research domain, analyze requirements, competitive analysis, identify constraints
- Output: Spec document (`.sniper/artifacts/<id>/spec.md`, max 3000 tokens)
- Gate: Automatic phase gate (artifact exists, within token budget)

**Plan phase:**
- Agents: architect, product-manager
- Work: Technical architecture, API contracts, data models, component breakdown
- Output: Architecture plan (`.sniper/artifacts/<id>/plan.md`, max 4000 tokens)
- Gate: **Human approval gate** — you review and approve the plan before implementation

**Decompose phase:**
- Agents: product-manager
- Work: Break plan into implementable stories with embedded context
- Output: Story files (`.sniper/artifacts/<id>/stories/*.md`, max 1500 tokens each)
- Gate: Automatic phase gate (stories exist, acceptance criteria present)

**Implement phase:**
- Agents: backend-dev, frontend-dev, qa-engineer (spawned based on routing and story content)
- Work: Parallel implementation in isolated worktrees, self-review before marking complete
- Output: Code commits on worktree branches, self-review artifacts
- Gate: Automatic phase gate (tests pass, lint clean, self-reviews exist)

**Review phase:**
- Agents: code-reviewer, gate-reviewer
- Work: Diff review against spec, checklist validation
- Output: Review report (`.sniper/artifacts/<id>/review.md`)
- Gate: **Human approval gate** — you review the final result

### Feature Protocol

For scoped features where discovery is not needed.

```
plan → implement → review
```

Same as `full` minus the discover and decompose phases. The plan phase includes story decomposition. Best for features where requirements are clear and the domain is understood.

Agent spawn strategy: 2-3 subagents via `Task` tool with worktree isolation.

### Patch Protocol

For bug fixes and small changes.

```
implement → review
```

**Implement phase:**
- Agents: single implementation agent (selected by routing)
- Work: Fix the issue, write/update tests, self-review
- No team overhead — single subagent, no Agent Team

**Review phase:**
- Agents: gate-reviewer
- Work: Run tests, lint, validate fix
- Gate: **Human approval gate** (final-review)

### Hotfix Protocol

Minimal ceremony for critical fixes.

```
implement
```

Single agent, automatic self-review, no human gate. The gate-reviewer runs via `Stop` hook but does not require human approval — only automated checks (tests pass, lint clean).

Use for production-down scenarios where speed matters more than ceremony.

### Explore Protocol

Research and investigation without implementation.

```
discover
```

**Discover phase:**
- Agents: analyst (optionally with architect for technical investigation)
- Work: Profile, benchmark, analyze, research
- Output: Findings document with concrete recommendations

After explore completes, you typically follow up with:

```
/sniper-flow --protocol feature "Implement recommendation X from explore"
```

### Refactor Protocol

Code improvement without behavior change.

```
analyze → implement → review
```

**Analyze phase:**
- Agents: architect, code-reviewer
- Work: Identify refactoring targets, assess risk, define scope
- Output: Refactoring plan with before/after expectations

**Implement phase:**
- Agents: implementation agents
- Work: Refactor code, ensure all existing tests still pass
- Gate: Extra check — no test behavior changes allowed (same test count, same test names)

### Ingest Protocol

Brownfield codebase onboarding.

```
scan → document → extract
```

**Scan phase:**
- Agents: code-archaeologist
- Work: Analyze directory structure, dependencies, entry points, patterns
- Scan levels: Quick (structure only), Standard (modules + API surface), Deep (control flow + security)
- Output: Repository map (`.sniper/artifacts/<id>/repo-map.md`)

**Document phase:**
- Agents: doc-writer, code-archaeologist
- Work: Generate AI-optimized codebase documentation
- Output:
  - `codebase-overview.md` — architecture, key modules, data flow
  - `api-surface.md` — public APIs, endpoints, contracts
  - `conventions.md` — detected patterns, naming, structure
  - `risks.md` — technical debt, security concerns, fragile areas

**Extract phase:**
- Agents: analyst, product-manager
- Work: Generate baseline spec from existing code ("what the system does today")
- Output: Baseline spec for delta planning in future protocols

## Gate System

Gates are automated quality checks between protocol phases. They are enforced by Claude Code hooks, not by convention.

### How Gates Work

1. All tasks in a phase complete.
2. The lead orchestrator's turn ends.
3. A `Stop` hook fires the `gate-reviewer` agent.
4. The gate-reviewer reads the phase checklist and validates each item.
5. **PASS** (exit 0): Lead advances to next phase.
6. **FAIL** (exit 2): Lead is blocked. It reads the failure report and routes feedback to the failing agent.
7. **PENDING_APPROVAL**: Human must approve before advancing.

### Checklist Items

Each phase has a checklist in `packages/core/checklists/`. Items can be:

- **Command checks**: Run a shell command (e.g., `pnpm test`). Pass if exit code 0.
- **Artifact checks**: Verify a file exists at an expected path.
- **Glob checks**: Verify files matching a pattern exist.
- **Grep checks**: Search the diff for patterns (e.g., TODO/FIXME warnings).
- **Blocking vs. non-blocking**: Blocking failures halt the protocol. Non-blocking failures are warnings in the gate report.

### Human Approval Gates

Phases marked with `human_review: true` or `plan_approval: true` require explicit human approval. The gate-reviewer writes `result: PENDING_APPROVAL`, and the lead orchestrator asks you to approve or provide feedback.

Approval gates by protocol:

| Protocol | Approval Gates |
|---|---|
| `full` | plan-approval, final-review |
| `feature` | plan-approval |
| `patch` | final-review |
| `hotfix` | none |
| `explore` | none |
| `refactor` | final-review |
| `ingest` | none |

## Resume Support

Every protocol run creates checkpoints in `.sniper/checkpoints/<protocol-id>/`. If a run is interrupted (terminal closed, agent crash, budget exhaustion), resume from the last checkpoint:

```
/sniper-flow --resume
```

Resume reads the latest checkpoint, identifies incomplete agents and their last known state, and spawns replacement agents with the checkpoint context. Agents pick up where they left off.

### What Checkpoints Contain

- **Event log** (`events.jsonl`): Append-only log of every agent action and phase transition. Enables precise recovery.
- **Phase snapshot** (`<protocol-id>-<phase>.yaml`): Human-readable summary with agent status, artifacts produced, files touched, token usage, and a structured context summary for agent respawn.
- **Cost tracking** (`cost.yaml`): Cumulative token usage by agent.

## Cost Tracking and Budget Enforcement

Each protocol has a configurable token budget in `.sniper/config.yaml`:

```yaml
cost:
  budgets:
    full: 2000000       # 2M tokens
    feature: 800000     # 800K tokens
    patch: 200000       # 200K tokens
    hotfix: 100000      # 100K tokens
    explore: 500000     # 500K tokens
    refactor: 600000    # 600K tokens
    ingest: 1000000     # 1M tokens
  hard_cap_multiplier: 1.2
  alert_threshold: 0.7
```

### Enforcement Tiers

| Tier | Threshold | What Happens |
|---|---|---|
| Warning | 70% consumed | Lead agent notified, human gets status update |
| Soft cap | 100% consumed | Agents wrap up current work, no new tasks spawned |
| Hard cap | 120% consumed | All agents halted, checkpoint written, human must resume with budget extension |

A `PostToolUse` hook tracks token usage per agent. Per-agent sub-budgets prevent one agent from consuming the entire protocol budget.

### Loop Detection

If an agent makes >5 consecutive tool calls without producing new output (reading the same files repeatedly, attempting the same edits), the hook flags it as a potential loop and pauses the agent. The lead is notified to reassign or refine the task.
