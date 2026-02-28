# SNIPER v3: Ground-Up Rewrite Plan

> **Date**: 2026-02-27
> **Status**: Draft — Pending Review
> **Codename**: Flow

---

## 1. Research Summary

### 1.1 Competitive Landscape

#### Codev (CodevOS) — Primary Competitor

Codev (github.com/cluesmith/codev, 220 stars, Apache-2.0) is the closest competitor. Built by Waleed Kadous (author of the Seven Spheres framework), it positions itself as an "operating system for structured human-AI collaboration."

**What Codev does better than SNIPER v2:**

| Capability | Codev | SNIPER v2 |
|---|---|---|
| Multi-model consultation | 3-way parallel review (Claude, Gemini, Codex) catches bugs no single model finds | Single-model only |
| Protocol variety | 7 protocols (SPIR, AIR, BUGFIX, TICK, EXPERIMENT, MAINTAIN, ASPIR) for different work sizes | One lifecycle for everything |
| Runtime process management | Agent Farm manages actual Claude Code processes, PTY sessions, web dashboard | Content framework only — no runtime |
| Deterministic state machine | Porch enforces phase ordering programmatically | Checklist-based — relies on agent compliance |
| Checkpoint/recovery | `status.yaml` + `af spawn --resume` with 100% recovery rate | No checkpointing |
| Production metrics | 106 PRs in 14 days, $1.59/PR review cost, 85% autonomous | No production benchmarks |

**Where SNIPER v2 is stronger:**

- Layered persona composition (process + technical + cognitive + domain) vs. Codev's flat 3-role model
- Domain packs with knowledge injection vs. no equivalent in Codev
- Expertise-based agent routing vs. no equivalent in Codev
- Multi-human team coordination vs. single-architect bottleneck

**Key insight**: Codev is runtime tooling (CLI processes, terminals, dashboards). SNIPER is a context framework (YAML/Markdown that shapes agent behavior). These are complementary approaches. v3 should stay a context framework but adopt Codev's strongest ideas: protocol variety, deterministic enforcement via hooks, multi-model review, and checkpoint/resume.

#### Roo Code — Orchestration Patterns

Roo Code (22k+ stars, VS Code extension) provides the strongest multi-agent orchestration patterns. Key innovations:

- **Zero-capability orchestrator**: The Orchestrator mode has literally NO tools except `new_task`. It cannot read files, write code, or run commands. This prevents "context poisoning" where the coordinator accumulates implementation details. SNIPER v3 adopts a **read-only** variant: the lead can inspect artifacts and check state (Read, Glob, Grep) for informed routing, but cannot implement (no Edit, Write, Bash).
- **Boomerang pattern**: Subtasks return only a concise summary via `attempt_completion`. The parent never sees implementation details (code diffs, file contents, debug output). Context isolation is absolute.
- **Tool permission enforcement via groups**: Modes define `fileRegex` restrictions on edit groups — useful for read-only agents (architect can only edit `.md`), but not needed for implementation agents in worktrees.
- **Sticky model per agent**: Each mode remembers its last-used model. Orchestrator uses cheap/fast, Code uses strongest.
- **`whenToUse` field**: Automated mode selection guidance — directly applicable to protocol auto-routing.

#### Aider — Context Intelligence

Aider (21k+ stars) contributes two critical patterns:

- **Architect/Editor dual-agent pattern**: Separating reasoning from editing. A reasoning-strong model proposes solutions (no formatting constraints), then an editing-strong model translates to precise file changes. Achieved SOTA 85% pass rate. This principle should inform SNIPER's planning vs. implementation agent separation.
- **Repository map with PageRank**: tree-sitter extracts code definitions/references, builds a NetworkX graph, runs PageRank with personalization vectors. Edge weights boost identifiers mentioned in chat (x50), penalize private identifiers (x0.1). Binary-search token budget fitting converges within 15% of target in O(log N) iterations. SNIPER's `ingest` protocol should produce a similar ranked codebase map.
- **Lint-test-fix loop**: After every edit, runs tree-sitter AST parsing + configured linter. Errors automatically fed back to agent for fix. Self-healing before human sees output.

#### OpenHands — Event-Sourced State

OpenHands (38k+ stars) provides the strongest recovery architecture:

- **Event-sourced state model**: All interactions are immutable events appended to a log. Enables deterministic replay and recovery from any point. More robust than YAML checkpoint files.
- **Action-Execution-Observation pattern**: Typed tool system with Pydantic validation. Tools are JSON-serializable, cross process boundaries.
- **Delegation as a tool, not a primitive**: `AgentDelegateAction` is a standard tool, not core SDK logic. Extensible capability.
- **Security risk classification**: Each tool call rated LOW/MEDIUM/HIGH. More granular than gate-based review.

#### Amazon Kiro — Spec Engineering

- **EARS notation**: Five patterns (ubiquitous, event-driven, state-driven, unwanted behavior, optional) force explicit coverage of edge cases. Low-effort, high-impact for spec quality.
- **Bidirectional spec synchronization**: Code changes update specs, spec changes update tasks. Prevents documentation drift.
- **Frontier agent**: Autonomous for hours/days, persistent cross-session context, learns from code reviews and tickets.

#### Google Conductor — Context-as-Code

- **Three-layer context**: product.md / tech-stack.md / workflow.md — all versioned Markdown in git alongside code.
- **Track registry**: Master `tracks.md` with completion status across all work units.
- **Logical revert**: Undo by track/phase/task rather than commit hash.

#### Factory.ai — Context Compression

- **Anchored iterative summarization**: Outperforms both Anthropic (3.70 vs 3.44) and OpenAI (vs 3.35) approaches. Maintains structured persistent summary with explicit sections.
- **Two-threshold compression**: T_max triggers compression, T_retained controls retention. More nuanced than single limits.
- **Critical finding**: ALL compression methods fail at artifact tracking (2.19-2.45/5.0). File modification tracking must be handled separately from conversation compression.

#### Zenflow (Zencoder)

Commercial product (launched Dec 2025). Desktop app + IDE plugins. Four pillars: structured workflows, spec-driven development, multi-agent verification across models, parallel execution in isolated environments. Claims 20% code correctness improvement. Model-agnostic (Anthropic, OpenAI, Gemini). Proprietary — not a direct technical competitor but validates the spec-driven, multi-agent verification approach.

#### D3 Framework (Amazon/Academic)

ArXiv paper (2512.01155) on brownfield AI productivity. Three phases: Discover-Define-Deliver. Dual-agent architecture (Builder generates, Reviewer critiques). Mandatory human gates between phases. Survey of 52 engineers showed ~26% steady productivity improvement. The "Research File" concept — structured codebase analysis documents — is directly applicable to SNIPER's brownfield story.

#### BMAD Method

Open-source framework with explicit brownfield support. Key innovation: mandatory "Phase 0" (document-project) that analyzes existing codebases through three scan levels and produces AI-optimized documentation before any planning begins. Two brownfield approaches: PRD-First (large codebases) and Document-First (smaller projects). Validates that brownfield needs a separate onboarding pipeline.

#### GPT-Pilot (Archived)

33.8k stars but no longer maintained (redirects to Pythagora.ai). Notable for 10-role agent hierarchy and SQLite-based checkpoint/resume (`--project <id> --step <step>`). Proved that step-level persistence enables recovery.

#### Devika

9 specialized sub-agents (Planner, Researcher, Coder, Action, Runner, Feature, Patcher, Reporter, Decision). Browser-based research integration. Agent state management with monologue tracking. Multi-LLM support. Pioneered the "AI software engineer" concept but lacks multi-agent coordination.

### 1.2 Claude Code Best Practices (2025-2026)

**Skills system** (`.claude/skills/`): Skills replace commands. SKILL.md frontmatter supports `disable-model-invocation`, `context: fork`, `allowed-tools`, `model` override, `agent` type. Dynamic context injection via `` !`command` `` syntax. Skills load ~100 tokens for metadata, <5k when activated. Commands still work but skills are the future.

**Subagents** (`.claude/agents/`): Custom agents with own context windows, tool restrictions, permission modes, persistent memory (`memory: project|user|local`), background execution, worktree isolation, preloaded skills, and MCP server access.

**Agent Teams**: Experimental (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Team lead creates team, spawns teammates, coordinates via shared task list and mailbox messaging. Storage at `~/.claude/teams/` and `~/.claude/tasks/`. Best at 3-5 teammates.

**Hooks**: 16+ event types. `PreToolUse`/`PostToolUse` can block actions (exit 2). `Stop` hooks can run agent-based verification. `TaskCompleted` hooks can enforce quality gates. Three hook types: command, prompt (single-turn LLM), agent (multi-turn with tools).

**Key architectural insight**: SNIPER v3 should map its abstractions directly to Claude Code primitives:
- Personas → `.claude/agents/` definitions
- Teams → Agent Teams with task lists
- Review gates → `Stop` and `TaskCompleted` hooks
- Commands → `.claude/skills/` with SKILL.md
- Memory → Subagent persistent memory + auto memory

### 1.3 Seven Spheres Mapping

| Sphere | Mode | SNIPER v2 | SNIPER v3 Target |
|---|---|---|---|
| 1 - Autocomplete | Tab completion | N/A | N/A |
| 2 - Task-Based | Discrete commands | N/A | N/A |
| 3 - Conversational | Multi-turn dialogue | N/A | N/A |
| 4 - Partner | Co-thinking | `/sniper-discover` (co-analysis) | Ambient — always available |
| 5 - Grandmaster | Multiplexed agents | `/sniper-sprint` (manual orchestration) | Automatic parallelization |
| 6 - Chief of Staff | AI managing AI | Partially (delegate mode) | **Default operating mode** |
| 7 - Hybrid Teams | Multi-human multi-AI | Not supported | Aspirational (workspace) |

**SNIPER v2 operates at Sphere 5** — the human manually orchestrates parallel agents via sprint commands. The framework helps but the human is still the dispatcher.

**SNIPER v3 targets Sphere 6** — the human defines intent, the framework handles decomposition, delegation, execution, and quality assurance. The human reviews and approves at gates, not at every step.

### 1.4 Higher-Phase Enablers

Research surfaced these concrete capabilities pushing toward Sphere 6+:

- **Autonomous multi-hour execution**: Claude Code completed a 7-hour task on a 12.5M-line codebase with zero human code contribution
- **Self-healing CI**: Dagger's "Repair Agent" pattern — CI failure triggers AI agent that reads logs, analyzes, and commits fixes. Gitar.ai reported saving ~20 days/month
- **Factory.ai's 5-layer context stack**: Repository overviews → semantic search → targeted file retrieval → enterprise integrations → hierarchical memory
- **Amazon Kiro**: Spec-driven IDE, EARS-notation acceptance criteria, frontier agent works autonomously for hours/days
- **Google Conductor**: Product knowledge, tech decisions, and work plans as versioned Markdown alongside code
- **LLM-as-Judge pattern**: Secondary model evaluates primary agent's output instead of hardcoded assertions

---

## 2. Architecture

### 2.1 Design Philosophy

v3 replaces SNIPER's linear phase model with a **flow-based execution engine**. The core shift:

```
v2: Human runs commands → Commands spawn teams → Teams produce artifacts → Human reviews
v3: Human declares intent → Framework decomposes → Agents execute continuously → Human approves at gates
```

### 2.2 Package Structure

```
packages/
  core/                     # @sniper.ai/core — framework content (no build)
    agents/                 # Agent definitions (.claude/agents/ format)
    skills/                 # Skill definitions (.claude/skills/ format)
    protocols/              # Workflow protocols (YAML state machines)
    templates/              # Artifact templates (lean, agent-optimized)
    checklists/             # Review gate checklists
    hooks/                  # Hook definitions for deterministic enforcement
    personas/               # Persona layers (preserved from v2, simplified)
      process/
      technical/
      cognitive/
    config.template.yaml    # Project config schema
    claude-md.template      # Lean CLAUDE.md template (<100 lines)
  cli/                      # @sniper.ai/cli — project management
    src/
      commands/             # CLI commands (init, status, plugin)
      scaffolder.ts         # Scaffold .claude/ directory
      config.ts             # Config management
      plugin-manager.ts     # Language plugin system
  plugins/                  # @sniper.ai/plugin-* — language plugins
    plugin-typescript/
    plugin-python/
    plugin-go/
```

### 2.3 Mapping to Claude Code Primitives

| SNIPER Concept | Claude Code Primitive | Location |
|---|---|---|
| Personas | Agent definitions | `.claude/agents/<name>.md` |
| Skills/Commands | Skills | `.claude/skills/<name>/SKILL.md` |
| Review gates | Hooks (`Stop`, `TaskCompleted`) | `.claude/settings.json` hooks |
| Team coordination | Agent Teams | `~/.claude/teams/` + `~/.claude/tasks/` |
| Memory | Subagent persistent memory | `.claude/agent-memory/<name>/` |
| Domain packs | Plugin system | `.claude/plugins/<pack>/` |
| Agent routing | Expertise-based task assignment | `.sniper/config.yaml` routing table |

### 2.4 Runtime Flow

```
Intent → Protocol Selection → Decomposition → Agent Spawn → Execution → Gate → Checkpoint → Next Phase
  ↑                                                                          |
  └──────────────────────── Recovery (if stalled) ───────────────────────────┘
```

No CLI process management. No web dashboard. SNIPER v3 is a **context framework** that configures Claude Code's native agent infrastructure. The runtime is Claude Code itself.

---

## 3. Agent Orchestration Model

### 3.1 Current Model (v2) — Sprint-Based

```
Human runs /sniper-sprint
  → Skill reads team YAML
  → Skill composes spawn prompts (reads persona layers, fills template)
  → Skill creates Team + Tasks
  → Skill spawns N teammates
  → Lead enters delegate mode
  → Teammates work on tasks
  → Human runs /sniper-review
  → Human runs next sprint
```

**Problems**: Manual ceremony at every step. Sprint boundaries are artificial. No recovery if an agent dies. Lead duplicates work specifying what team YAML already defines.

### 3.2 Proposed Model (v3) — Flow-Based

```
Human declares intent (natural language or spec file)
  → /sniper-flow selects protocol based on scope
  → Protocol decomposes into phases automatically
  → Each phase:
      1. Lead agent (read-only orchestrator) delegates via Task tool, reads artifacts for routing decisions
      2. Implementation agents execute in isolated worktrees
      3. Agents return summary-only results (boomerang pattern — no raw diffs/output to lead)
      4. Agents self-review before marking complete (catches 30% more issues per Devin data)
      5. Stop hook runs review gate automatically
      6. If PASS → checkpoint → next phase
      7. If FAIL → feedback loop to agents
      8. If agent stalls → recovery from checkpoint
  → Human intervenes only at approval gates and when asked
```

**Read-only orchestrator** (inspired by Roo Code, adapted): The lead agent can inspect but never implement.

| Tool | Lead access | Why |
|---|---|---|
| `Task` | Yes | Core delegation mechanism |
| `SendMessage` | Yes | Agent coordination |
| `Read`, `Glob`, `Grep` | Yes | Informed routing decisions — read specs to assign the right agent, check artifacts exist before advancing |
| `Edit`, `Write` | **No** | Prevents "I'll just do it myself" instead of delegating |
| `Bash` | **No** | Prevents running builds/tests instead of delegating — hooks and qa-engineer handle verification |

This prevents context poisoning from implementation details (diffs, build output) while allowing the orchestrator to make informed decisions. Implementation agents still return concise summaries via the boomerang pattern — the lead reads artifacts only when it needs to make a routing or gating decision, not to review code.

### 3.3 Protocol Selection (Automatic)

Instead of one lifecycle, v3 auto-selects the right protocol:

| Protocol | Trigger | Phases | Human Gates |
|---|---|---|---|
| **full** | New project / major feature | discover → plan → decompose → implement → review | plan-approval, final-review |
| **feature** | Scoped feature request | plan → implement → review | plan-approval |
| **patch** | Bug fix / small change (<300 LOC estimate) | implement → review | final-review |
| **hotfix** | Critical fix, minimal ceremony | implement | none (auto-review) |
| **explore** | Research / analysis | discover | none |
| **refactor** | Code improvement, no behavior change | analyze → implement → review | final-review |
| **ingest** | Brownfield onboarding | scan → document → extract | none |

Protocol selection happens in the `/sniper-flow` skill. The human can override with `/sniper-flow --protocol full`.

### 3.4 Agent Spawning Strategy

**Small work (patch, hotfix)**: Single subagent via `Task` tool. No team overhead. Agent has all context in its system prompt.

**Medium work (feature, refactor)**: 2-3 subagents via `Task` tool with `isolation: worktree`. Background execution. Results synthesized by lead.

**Large work (full, ingest)**: Full Agent Team via `TeamCreate`. Shared task list. Inter-agent messaging. Lead coordinates but does not implement.

This eliminates the v2 problem of spinning up a full team for a 5-line fix.

---

## 4. Checkpoint & Recovery System

### 4.1 Checkpoint Architecture

Two complementary systems work together:

**Event log** (append-only, inspired by OpenHands): Every agent action, observation, and phase transition is an immutable event appended to `.sniper/checkpoints/<protocol-id>/events.jsonl`. This enables recovery from any point, not just phase boundaries.

**Phase snapshot** (human-readable summary): At each phase transition, a snapshot is written to `.sniper/checkpoints/<protocol-id>-<phase>.yaml`:

```yaml
# .sniper/checkpoints/<protocol-id>-<phase>.yaml
protocol: feature
protocol_id: feat-042
phase: implement
status: in_progress
started: 2026-02-27T14:30:00Z
updated: 2026-02-27T15:45:00Z
agents:
  - name: backend-dev
    status: completed
    output: .sniper/artifacts/feat-042/api-changes.md
    last_file_modified: src/api/routes/users.ts
    commits: [abc123, def456]
  - name: frontend-dev
    status: in_progress
    output: .sniper/artifacts/feat-042/ui-changes.md
    last_file_modified: src/components/UserProfile.tsx
    commits: [ghi789]
artifacts_produced:
  - path: .sniper/artifacts/feat-042/plan.md
    status: approved
  - path: .sniper/artifacts/feat-042/stories.md
    status: complete
# Structured artifact trail — survives compression (Factory.ai finding)
files_touched:
  - path: src/api/routes/users.ts
    action: modified
    agent: backend-dev
    timestamp: 2026-02-27T15:30:00Z
  - path: src/api/routes/__tests__/users.test.ts
    action: created
    agent: backend-dev
    timestamp: 2026-02-27T15:35:00Z
token_usage:
  total: 145000
  by_agent:
    backend-dev: 82000
    frontend-dev: 63000
gate_results:
  plan-approval: pass
# Factory.ai-style structured summary for agent respawn
context_summary:
  intent: "Add OAuth2 Google sign-in to existing JWT auth system"
  decisions: "Parallel auth strategy — keep JWT for API, add OAuth for web"
  completed: "Backend routes, Google OAuth callback, token exchange"
  remaining: "Frontend login button, session management, tests"
```

**Why both**: The event log enables precise recovery (replay from event N). The phase snapshot enables fast recovery (respawn agent with structured summary). The `files_touched` field exists because Factory.ai's research proved ALL compression methods fail at tracking file modifications (2.19-2.45/5.0 score) — this must be tracked separately.

### 4.2 Recovery Triggers

Recovery activates when:
1. An agent hits context window limits (auto-compact fires but summarization loses critical state)
2. An agent crashes or times out (no response for >5 minutes)
3. A session is interrupted (user closes terminal)
4. The human resumes work in a new session

### 4.3 Recovery Flow

```
/sniper-flow --resume
  → Reads latest checkpoint from .sniper/checkpoints/
  → Identifies incomplete agents and their last known state
  → Spawns replacement agents with:
      - Original task description
      - Checkpoint state (what's done, what's remaining)
      - Git diff of completed work
      - Any produced artifacts
  → Resumes execution from the interrupted point
```

### 4.4 Token Budget Management

**Two-threshold compression** (inspired by Factory.ai): Each phase uses dual thresholds rather than a single hard cap:

| Phase | T_retained (warn) | T_max (compress) | Enforcement |
|---|---|---|---|
| discover | 160K | 200K | Checkpoint + summarize at T_max |
| plan | 120K | 150K | Checkpoint + summarize at T_max |
| decompose | 80K | 100K | Auto-summarize at T_max |
| implement (per agent) | 160K | 200K | Checkpoint + respawn at T_max |
| review | 40K | 50K | Truncate context to diff + checklist |

When an agent reaches T_retained, it gets a warning to wrap up current work and checkpoint. At T_max, compression fires — only the newly-truncated span is summarized and merged with the existing structured summary (not regenerated from scratch). This avoids redundant re-summarization.

Token budgets are configurable in `config.yaml`. The `implement` budget is per-agent, not per-phase, since agents have independent context windows.

---

## 5. Persona System

### 5.1 Current Problems

v2 personas are 50-150 line Markdown files with sections for Role, Lifecycle Position, Responsibilities, Output Format, and Artifact Quality Rules. They're comprehensive but:
- Verbose — most content is boilerplate
- Hard to customize — editing a 100-line file to change one behavior is clunky
- Duplicative — similar content across personas
- Not directly usable as Claude Code agents — require composition via spawn prompt template

### 5.2 v3 Design: Personas ARE Agents

Each persona becomes a `.claude/agents/<name>.md` file with frontmatter + concise instructions:

```markdown
---
name: backend-dev
description: Implements backend code — API routes, database, services, middleware.
model: sonnet
permissionMode: bypassPermissions
memory: project
isolation: worktree
skills:
  - code-conventions
  - api-patterns
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, Task
---

You are a senior backend engineer. You implement server-side code following project conventions.

## Expertise
- Primary: API routes, services, middleware, database, auth
- You may modify any file needed to complete your task (shared types, configs, etc.)
- Always: write tests alongside implementation, validate against API contracts

## Output
- Working, tested code committed to your worktree branch
- Update .sniper/checkpoints/ after each completed unit of work
```

**No file boundaries.** Agents work in isolated worktrees and can touch any file needed to complete their task. Merge conflicts are resolved at PR time, just like a real team. The orchestrator assigns tasks to the right agent based on expertise routing (see Section 5.3), not file restrictions.

### 5.3 Composition via Layers (Simplified)

v2's 3+1 layer model is preserved but simplified. Instead of reading 3-4 separate files and interpolating a template, v3 uses a **mixin** pattern:

```yaml
# .sniper/config.yaml — agent composition
agents:
  backend-dev:
    base: backend-dev          # from core agents/
    mixins:
      - security-first         # cognitive layer
      - telephony              # domain layer (from plugin)

  frontend-dev:
    base: frontend-dev
    mixins:
      - user-empathetic
      - accessibility

# Expertise routing — tells the orchestrator which agent to ASSIGN tasks to
# based on the files involved. Agents are NOT restricted to these paths.
routing:
  src/api/**:        backend-dev
  src/services/**:   backend-dev
  src/db/**:         backend-dev
  src/components/**:  frontend-dev
  src/pages/**:       frontend-dev
  src/styles/**:      frontend-dev
  **/*.test.*:        qa-engineer
  docs/**:            doc-writer
```

The scaffolder reads this config and generates the final `.claude/agents/<name>.md` by concatenating the base agent instructions with mixin instructions. Routing hints guide the orchestrator's task assignment — they are suggestions, not access control. Agents work in isolated worktrees and can modify any file needed to complete their task.

### 5.4 Default Agent Library

**Core agents** (ship with `@sniper.ai/core`):

| Agent | Purpose |
|---|---|
| `analyst` | Discovery research, competitive analysis, market validation |
| `architect` | System design, API contracts, data models, tech decisions |
| `product-manager` | PRD creation, user stories, acceptance criteria |
| `backend-dev` | Server-side implementation |
| `frontend-dev` | Client-side implementation |
| `fullstack-dev` | Both sides (for smaller projects) |
| `qa-engineer` | Test writing, coverage analysis, regression testing |
| `code-reviewer` | PR review, quality assessment |
| `doc-writer` | Documentation generation |
| `code-archaeologist` | Brownfield codebase analysis |
| `retro-analyst` | Sprint retrospective analysis |

**Cognitive mixins** (optional behavioral overlays):

| Mixin | Effect |
|---|---|
| `security-first` | Prioritizes security considerations |
| `performance-focused` | Optimizes for speed and efficiency |
| `user-empathetic` | Centers user experience in decisions |
| `devils-advocate` | Challenges assumptions, finds edge cases |
| `mentor-explainer` | Explains decisions in detail |

---

## 6. Spec Lifecycle

### 6.1 Greenfield Flow

```
Intent → Spec → Plan → Stories → Implementation → Self-Review → Gate Review → Spec Reconciliation
```

1. **Intent**: Human describes what they want in natural language. Can be a sentence or a detailed brief.
2. **Spec**: Analyst + PM agents collaboratively produce a lean spec (~1-2 pages). Spec answers: What problem? For whom? What's success? What's out of scope? **Acceptance criteria use EARS notation** (from Amazon Kiro):
   - Ubiquitous: "The system shall [behavior]"
   - Event-driven: "When [trigger], the system shall [response]"
   - State-driven: "While [state], the system shall [behavior]"
   - Unwanted behavior: "If [error condition], then the system shall [response]"
   - Optional: "Where [feature is included], the system shall [behavior]"
3. **Plan**: Architect agent produces technical plan. Architecture decisions, data model, API contracts, component breakdown. Plan approval gate.
4. **Stories**: PM decomposes plan into implementable stories. Each story is self-contained with embedded context (not references).
5. **Implementation**: Dev agents implement stories in parallel. QA writes tests alongside.
6. **Self-review**: Each implementation agent performs a self-review pass before marking complete (Devin 2.2 data shows this catches 30% more issues before human review).
7. **Gate review**: Automated review gate + optional multi-model consultation.
8. **Spec reconciliation** (from Kiro): Code-reviewer agent checks whether implemented code matches the spec and flags divergences. Spec is updated to reflect what was actually built. Prevents `.sniper/artifacts/` from becoming stale.

### 6.2 Brownfield Flow

```
Scan → Map → Document → Extract → Plan → Implement → Self-Review → Gate Review
```

1. **Scan**: Code archaeologist agent analyzes existing codebase. Three scan levels:
   - Level 1 (Quick): Directory structure, package.json/Cargo.toml/pyproject.toml, README, entry points
   - Level 2 (Standard): Key modules, API surface, database schema, test coverage, dependency graph
   - Level 3 (Deep): Control flow analysis, dead code detection, security surface, performance hotspots
2. **Map** (inspired by Aider's RepoMap): Build a graph-ranked repository map. Uses code structure analysis to extract definitions/references, builds a dependency graph, and ranks files by relevance using PageRank with personalization. Output: `.sniper/artifacts/repo-map.md` — injected as Layer 1 context for all subsequent agent sessions. Includes trigger tables mapping file paths to appropriate agents (from Codified Context research).
3. **Document**: Produces AI-optimized codebase documentation:
   - `codebase-overview.md` — architecture, key modules, data flow
   - `api-surface.md` — all public APIs, endpoints, contracts
   - `conventions.md` — detected patterns, naming, structure
   - `risks.md` — technical debt, security concerns, fragile areas
4. **Extract**: Generate spec-equivalent artifacts from existing code. "Here's what the system does today" becomes the baseline spec.
5. **Plan**: Delta plan — what changes from current state to desired state.
6. **Implement**: Incremental changes with regression awareness.
7. **Self-review**: Implementation agents self-review before marking complete.
8. **Gate review**: Includes brownfield-specific checks (backward compatibility, migration safety, dependency impact).

### 6.3 Vague Spec Handling

When intent is vague ("make the app faster"), the framework:
1. Routes to `explore` protocol automatically
2. Spawns analyst agent to investigate (profile, benchmark, identify bottlenecks)
3. Produces a findings document with concrete recommendations
4. Asks human to approve scope before switching to `refactor` or `feature` protocol

---

## 7. Document Strategy

### 7.1 The Problem

v2 generates verbose artifacts. A PRD can be 20+ pages. Architecture docs repeat context from the PRD. Stories repeat context from both. By the time an implementation agent receives its full context, the window is half-consumed with redundant documentation.

### 7.2 Rules for Lean Documents

1. **Token budget per artifact type**:
   - Spec/PRD: max 3,000 tokens (~2 pages)
   - Architecture plan: max 4,000 tokens
   - Story: max 1,500 tokens (including embedded context)
   - Review report: max 1,000 tokens
   - Codebase overview: max 2,000 tokens

2. **Write for agents, not humans**: No introductions, no summaries of what you're about to say, no conclusions restating what you said. Dense, structured, scannable.

3. **Embed, don't reference**: Stories contain the relevant slice of spec and architecture inline. But only the relevant slice — not the whole document.

4. **Auto-summarization**: If an artifact exceeds its token budget, the framework auto-summarizes via a dedicated `compress` skill before passing to the next phase.

5. **Progressive disclosure**: Agents receive only phase-relevant context:
   - Discovery agents get: intent + domain knowledge
   - Planning agents get: spec (not raw discovery notes)
   - Implementation agents get: their story + relevant architecture slice + conventions
   - Review agents get: diff + checklist + relevant spec section

### 7.3 Template Design

Templates use a structured format with mandatory and optional sections:

```markdown
# {title}

## Context (required, max 200 tokens)
{why this exists, what problem it solves}

## Decisions (required, max 500 tokens)
{key technical decisions with rationale — not alternatives considered}

## Specification (required, max 1500 tokens)
{the actual content — API contracts, data models, component specs}

## Constraints (optional, max 300 tokens)
{non-obvious limitations, compatibility requirements}

## Open Questions (optional, max 200 tokens)
{unresolved items requiring human input}
```

---

## 8. Plugin / Language System

### 8.1 Architecture

The core framework is language-agnostic. Language intelligence is provided by installable plugins.

```
@sniper.ai/core           — language-agnostic orchestration
@sniper.ai/plugin-typescript  — TypeScript/JavaScript support
@sniper.ai/plugin-python      — Python support
@sniper.ai/plugin-go          — Go support
@sniper.ai/plugin-rust        — Rust support
@sniper.ai/pack-sales-dialer  — Domain pack (sales/telephony)
@sniper.ai/pack-fintech       — Domain pack (financial services)
```

### 8.2 Plugin Interface

Each plugin provides:

```yaml
# plugin.yaml
name: typescript
version: 1.0.0
provides:
  conventions:
    - tsconfig best practices
    - ESM module conventions
    - Type-safe patterns
  commands:
    build: pnpm build
    test: pnpm test
    lint: pnpm lint
    typecheck: pnpm tsc --noEmit
  review_checks:
    - strict TypeScript (no `any`)
    - proper error handling (no bare catch)
    - import organization
  agent_mixins:
    - typescript-backend    # Extends backend-dev with TS-specific knowledge
    - typescript-frontend   # Extends frontend-dev with TS-specific knowledge
  hooks:
    PostToolUse:
      - matcher: "Edit|Write"
        glob: "*.{ts,tsx}"
        command: "npx prettier --write $FILE_PATH"
```

### 8.3 Plugin Installation

```bash
sniper plugin install typescript
sniper plugin install python
sniper plugin list
sniper plugin remove go
```

Installation:
1. `pnpm add @sniper.ai/plugin-<name>`
2. Copy plugin content to `.sniper/plugins/<name>/`
3. Merge plugin hooks into `.claude/settings.json`
4. Add plugin mixins to available agent mixins
5. Update config.yaml with plugin-provided commands

### 8.4 Domain Packs (Preserved from v2)

Domain packs work the same way but use the plugin interface:

```bash
sniper plugin install pack-sales-dialer
```

Packs provide domain knowledge, specialized agent mixins, review checklists, and template addenda. The distinction between "language plugin" and "domain pack" is just the `type` field in `plugin.yaml`.

---

## 9. Self-Improvement Loop

### 9.1 Auto-Retros

In v2, retrospectives require manual invocation (`/sniper-review` or manual retro). In v3:

**Trigger**: A `Stop` hook fires after every protocol completion. This hook runs the retro-analyst agent automatically.

**Input**: Git diff of all changes, review gate results, any agent messages flagged as problems, token usage metrics.

**Output**: Structured retro written to `.sniper/memory/retros/<protocol-id>.yaml`:

```yaml
protocol_id: feat-042
protocol: feature
duration_minutes: 47
token_cost: 285000
agents_spawned: 3
gate_results: [plan-approval: pass, final-review: pass]
findings:
  - type: convention
    confidence: high
    content: "API routes should use zod validation middleware, not inline validation"
    applies_to: [backend-dev]
  - type: anti-pattern
    confidence: medium
    content: "Agents spent 40% of tokens on file exploration — need better routing hints and repo map"
    applies_to: [all]
  - type: estimate
    content: "Feature protocol took 47 min; estimated 30 min. Auth integration consistently underestimated."
```

### 9.2 Memory Codification

High-confidence findings (from 2+ retros agreeing) are automatically promoted to `.sniper/memory/conventions.yaml` and `.sniper/memory/anti-patterns.yaml`. These are injected into agent system prompts via mixins.

### 9.3 Agent-Level Learning

Each agent with `memory: project` builds its own persistent memory at `.claude/agent-memory/<name>/`. Over time:
- `backend-dev` learns which patterns the codebase uses
- `code-reviewer` learns which issues recur and focuses attention
- `architect` learns which tech decisions worked and which didn't

This is Claude Code's native feature — v3 just enables and configures it.

### 9.4 Velocity Calibration

Token usage and wall-clock time per protocol type are tracked. After 5+ completions of the same protocol type, the framework adjusts token budgets and time estimates based on actuals. This prevents both over-allocation (waste) and under-allocation (agent stalling).

---

## 10. Seven Spheres Mapping

### 10.1 Sphere 6 — Concrete UX in SNIPER v3

The human's interaction surface is reduced to three activities:

**1. Declare Intent**
```
User: "Add user authentication with OAuth2 Google sign-in"
→ Framework auto-selects `feature` protocol
→ Spawns architect agent to produce plan
→ Notifies human: "Plan ready for review"
```

**2. Approve at Gates**
```
[Plan approval notification]
User reviews plan.md (2 pages, dense, actionable)
User: "Approved" or "Change X"
→ Framework continues to implementation
→ Framework runs review gate automatically
→ Notifies human: "Feature ready for final review"
```

**3. Steer When Asked**
```
[Agent question]
Agent: "The existing auth middleware uses JWT. Should I migrate to session-based for OAuth, or add OAuth as a parallel auth strategy?"
User: "Parallel strategy, keep JWT for API consumers"
→ Agent continues with clear direction
```

The human never:
- Manually composes spawn prompts
- Selects which agents to use
- Runs sprint/review commands sequentially
- Manages agent lifecycle
- Monitors agent progress (unless they want to)

### 10.2 Sphere 7 — Aspirational

Multi-human coordination is the frontier. Concrete capabilities v3 should build toward:

**Shared context layer**: `.sniper/workspace/` contains cross-project state. Multiple humans working on the same codebase share conventions, anti-patterns, and architectural decisions.

**Cross-agent dependency detection**: When Agent A (owned by Human 1) modifies an API that Agent B (owned by Human 2) depends on, the framework flags the conflict before merge.

**Organizational learning**: Memory that transcends individual projects. "This organization prefers X pattern over Y" — learned from 50 projects, not manually configured.

v3 MVP does not include Sphere 7 features. The architecture should not preclude them.

### 10.3 Additional Innovations

**Multi-model review gate**: Inspired by Codev's 3-way consultation. The review gate skill can optionally invoke a secondary model (via MCP or headless Claude) to review agent output. Configuration:

```yaml
# config.yaml
review:
  multi_model: true
  models: [claude-sonnet, gemini-2.5-pro]  # Primary + secondary
  require_consensus: false  # Any model can flag issues
```

**Self-healing CI hook**: A `PostToolUse` hook on `Bash` commands that detects test failures and auto-triggers a fix cycle before the agent moves on. The agent doesn't need to be told to fix tests — the hook catches it.

**Intent decomposition**: Before protocol selection, a lightweight skill analyzes the intent and asks clarifying questions only if the intent is genuinely ambiguous. No clarification for clear requests.

---

## 11. Migration Path

### 11.1 v2 → v3 Migration

```bash
sniper migrate
```

The migrate command:

1. **Config migration**: Reads `.sniper/config.yaml` v2 schema, transforms to v3 schema. Preserves project, stack, memory. Converts v2 `ownership` map to v3 `routing` hints. Drops sprint-specific state (sprint counter, current_sprint) in favor of protocol-based tracking.

2. **Commands → Skills**: Moves `.claude/commands/sniper-*.md` to `.claude/skills/sniper-*/SKILL.md`. Updates frontmatter format.

3. **Personas → Agents**: For each persona composition in team YAMLs, generates a `.claude/agents/<name>.md` file. Maps process layer → base agent, cognitive layer → mixin, domain layer → plugin mixin.

4. **Memory preservation**: `.sniper/memory/` is preserved as-is. Conventions and anti-patterns carry forward.

5. **Artifacts**: Existing artifacts in `.sniper/artifacts/` are preserved. The new protocol system can read them.

### 11.2 Breaking Changes

- `/sniper-sprint` is replaced by `/sniper-flow` (the sprint concept is gone)
- `/sniper-solve` is absorbed into `/sniper-flow` (story creation is a phase, not a command)
- `/sniper-compose` is removed (composition happens via config, not manual prompting)
- Team YAML files are replaced by protocol YAML files
- Spawn prompt template is replaced by agent definition files
- `settings.template.json` is replaced by hooks configuration

### 11.3 Compatibility

v2 commands will work for one major version after v3 ships, with deprecation warnings pointing to v3 equivalents. The `sniper migrate` command handles the structural migration.

---

## 12. MVP Scope

### 12.1 MVP (v3.0) — Ships First

| Component | Scope |
|---|---|
| **Skills** | `/sniper-init`, `/sniper-flow`, `/sniper-status`, `/sniper-review` |
| **Protocols** | `full`, `feature`, `patch`, `ingest` |
| **Agents** | 8 core agents: analyst, architect, pm, backend-dev, frontend-dev, fullstack-dev, qa, code-reviewer + **read-only lead orchestrator** |
| **Mixins** | 3 cognitive: security-first, performance-focused, devils-advocate |
| **Checkpoints** | Event log + phase snapshots with resume support, structured artifact trail, Factory.ai-style context summaries |
| **Token management** | Two-threshold compression (T_retained/T_max) per phase |
| **Review gates** | Hook-based enforcement + **mandatory self-review before gate** |
| **Auto-retros** | Stop hook triggers retro after protocol completion |
| **Memory** | Conventions, anti-patterns, decisions (carried from v2) |
| **Lean templates** | Token-budgeted templates with **EARS acceptance criteria** |
| **Brownfield** | `ingest` protocol with 3-level scan + **repository map generation** |
| **Config** | v3 schema with agent composition via mixins |
| **CLI** | `sniper init`, `sniper status`, `sniper migrate`, `sniper plugin` |
| **Plugin** | Plugin interface spec + TypeScript plugin |
| **Docs** | Migration guide, getting started, protocol reference |

### 12.2 v3.1 — Fast Follow

| Component | Scope |
|---|---|
| **Protocols** | `explore`, `refactor`, `hotfix` |
| **Multi-model review** | Optional secondary model in review gates |
| **Multi-faceted review** | Scope validation, standards enforcement, risk scoring (Qodo pattern) |
| **Velocity calibration** | Token/time tracking and budget auto-adjustment |
| **Bidirectional spec sync** | Post-implementation spec reconciliation (Kiro pattern) |
| **Trigger tables** | File-change-based automatic agent routing (Codified Context pattern) |
| **Plugins** | Python, Go plugins |
| **Self-healing CI** | PostToolUse hook for automatic lint-test-fix loops (Aider pattern) |
| **Domain packs** | Updated sales-dialer pack for v3 plugin interface |

### 12.3 v3.2+ — Roadmap

| Component | Scope |
|---|---|
| **Workspace** | Multi-project orchestration with shared memory |
| **Logical revert** | Undo by protocol/phase/task, not commit hash (Conductor pattern) |
| **Headless mode** | `sniper run --ci` for pipeline integration |
| **Agent marketplace** | Community-contributed agents, mixins, plugins |
| **Sphere 7 foundations** | Cross-human agent coordination, conflict detection |
| **Custom protocols** | User-defined protocol YAML files |
| **Observability** | Token cost dashboard, agent performance analytics |
| **External signal learning** | Auto-learn from CI failures, PR review comments, production errors |
| **Domain-heavy agents** | >50% domain knowledge in agent specs (Codified Context pattern) |
| **MCP knowledge base** | Cold storage retrieval for domain knowledge via MCP server |

---

## Appendix: Deep Research Priority Actions

Based on comprehensive research across 12 frameworks and 7 academic/industry sources (full details: `plans/v3-deep-research.md`), these are the prioritized additions to the v3 plan:

| Priority | Pattern | Source | Effort | Impact | Status |
|---|---|---|---|---|---|
| P0 | EARS notation in spec templates | Amazon Kiro | Low | High | Integrated into Section 6.1 |
| P0 | Read-only orchestrator (lead can inspect, never implement) | Roo Code (adapted) | Low | High | Integrated into Section 3.2 |
| P0 | Self-review pass before review gate | Devin 2.2 | Low | High | Integrated into Section 6.1 |
| P1 | Structured artifact trail (separate from conversation) | Factory.ai | Medium | High | Integrated into Section 4.1 |
| P1 | Repository map as first-class artifact | Aider | Medium | High | Integrated into Section 6.2 |
| P1 | Two-threshold compression (T_max/T_retained) | Factory.ai | Medium | Medium | Integrated into Section 4.4 |
| P1 | Trigger tables for file-change-based agent routing | Codified Context | Medium | Medium | Integrated into Section 6.2 |
| P1 | Event-sourced checkpoint system | OpenHands | Medium | High | Integrated into Section 4.1 |
| P2 | Bidirectional spec synchronization | Amazon Kiro | Medium | Medium | Integrated into Section 6.1 |
| P2 | Logical revert by protocol/phase/task | Google Conductor | High | Medium | Roadmap (v3.2+) |
| P2 | Multi-faceted review (scope, standards, risk scoring) | Qodo | Medium | Medium | Roadmap (v3.1) |
| P3 | Domain knowledge >50% of agent specs | Codified Context | High | High (long-term) | Roadmap |
| P3 | Cross-session learning from external signals (CI, PR reviews) | Kiro Frontier | High | High (long-term) | Roadmap |

---

## Appendix A: Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime process management? | No — stay as context framework | Claude Code's native agent infrastructure handles process management. Adding our own creates maintenance burden and version coupling. Let Anthropic build the runtime. |
| Multi-model support? | Optional, via MCP or headless | Core value is orchestration, not model routing. Support it but don't require it. |
| State machine enforcement? | Via hooks, not custom runtime | Hooks are deterministic (exit 2 blocks), native to Claude Code, and don't require a separate process. |
| Persona composition? | Config-driven mixin concatenation | Simpler than v2's read-4-files-and-interpolate-template approach. Transparent, debuggable, version-controlled. |
| Sprint concept? | Removed entirely | Sprints are artificial ceremony. Protocols with phases achieve the same structure without the agile theater. |
| Document length? | Two-threshold compression | More nuanced than hard caps. Factory.ai research shows structured summaries outperform both Anthropic and OpenAI's native compression. |
| Lead agent capabilities? | Read-only (Task + Read/Glob/Grep, no Edit/Write/Bash) | Roo Code's zero-capability is too extreme — the lead needs to read artifacts for informed routing. But no implementation tools prevents "I'll just do it myself" and context poisoning from diffs/build output. |
| Acceptance criteria format? | EARS notation (mandatory) | Amazon Kiro's adoption proves this forces edge case coverage. Five patterns cover all requirement types. Low effort, high impact. |
| Checkpoint format? | Event log + phase snapshots | OpenHands proves event sourcing enables recovery from any point. Phase snapshots provide fast respawn. Both needed. |
| File tracking? | Separate structured trail | Factory.ai research proves ALL compression methods fail at artifact tracking (2.19-2.45/5.0). Must be tracked outside conversation context. |

## Appendix B: File Structure After `sniper init`

```
project/
  .claude/
    agents/
      analyst.md
      architect.md
      product-manager.md
      backend-dev.md
      frontend-dev.md
      qa-engineer.md
      code-reviewer.md
      retro-analyst.md
    skills/
      sniper-init/SKILL.md
      sniper-flow/SKILL.md
      sniper-status/SKILL.md
      sniper-review/SKILL.md
    settings.json           # Hooks for review gates, auto-retro, formatting
    settings.local.json     # User-specific overrides (gitignored)
  .sniper/
    config.yaml             # Project config (agents, protocols, routing)
    checkpoints/            # Protocol execution state
    artifacts/              # Generated specs, plans, stories
    memory/
      conventions.yaml
      anti-patterns.yaml
      decisions.yaml
      retros/
    plugins/                # Installed language/domain plugins
  CLAUDE.md                 # Lean project instructions (<100 lines)
```
