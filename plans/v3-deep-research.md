# SNIPER v3 Deep Research: Frameworks, Patterns & Techniques

> **Date**: 2026-02-27
> **Purpose**: Deep technical research on specific tools and patterns to inform the SNIPER v3 rewrite
> **Scope**: Concrete architecture, code patterns, configuration formats, and stealable techniques

---

## 1. Roo Code

### 1.1 Architecture Overview

Roo Code is an open-source VS Code extension (22k+ GitHub stars, ~300 contributors) that provides multi-agent orchestration inside the editor. It raised funding in 2025, achieved SOC 2 Type 2 compliance, and launched team-oriented cloud features. The core architectural insight is that **modes are personas with enforced tool boundaries**, and an **orchestrator mode coordinates them through task delegation with isolated contexts**.

### 1.2 The Modes System

Roo ships five built-in modes, each with distinct tool permissions:

| Mode | Persona | Tool Access | Key Constraint |
|------|---------|-------------|----------------|
| **Code** | Skilled software engineer | Full (read, edit, command, mcp) | No restrictions |
| **Ask** | Technical consultant | read, mcp only | Cannot edit files or run commands |
| **Architect** | Technical leader/planner | read, mcp, markdown-only edit | Can only edit `.md` files |
| **Debug** | Expert problem solver | Full (read, edit, command, mcp) | Custom instructions for reflection, logging, confirmation |
| **Orchestrator** | Strategic workflow orchestrator | **None directly** (uses `new_task` tool only) | Cannot read files, write code, run commands, or use MCP |

The critical design decision: **the orchestrator has zero direct capabilities**. It can only delegate via `new_task`. This prevents "context poisoning" where the coordinator accumulates implementation details that degrade its planning ability.

### 1.3 Custom Mode Configuration

Modes are defined in YAML (preferred) or JSON:

```yaml
# .roomodes (project-level) or custom_modes.yaml (global)
customModes:
  - slug: security-auditor
    name: Security Auditor
    roleDefinition: "You are a security expert specializing in OWASP Top 10..."
    description: Short UI summary
    whenToUse: "When tasks involve security review or vulnerability assessment"
    customInstructions: "Always check for injection, XSS, CSRF..."
    groups:
      - read
      - - edit
        - fileRegex: \.(md|yaml)$
          description: Documentation only
      - command
```

Key properties:
- `slug`: Unique identifier (pattern: `/^[a-zA-Z0-9-]+$/`)
- `roleDefinition`: Core identity and expertise (becomes system prompt)
- `whenToUse`: Guidance for automated mode selection (not shown in UI)
- `customInstructions`: Behavioral guidelines appended to system prompt
- `groups`: Tool access with optional file regex restrictions

Tool groups are: `read`, `edit`, `command`, `mcp`. Each can be unrestricted or restricted with `fileRegex` patterns. The regex supports path-scoping (`^src/.*`) and extension filtering (`\.(js|ts)$`).

### 1.4 The Boomerang Pattern (Orchestrator)

The orchestrator's sole tool is `new_task`, with two parameters:

- `mode`: Which specialized mode handles the subtask (e.g., "code", "architect", "debug")
- `message`: Complete context for the subtask (instructions, relevant files, constraints)

**Lifecycle:**
1. Orchestrator receives a complex request
2. Decomposes into subtasks
3. For each subtask, calls `new_task(mode, message)`
4. Parent task **pauses**; subtask runs in **isolated context** with its own conversation history
5. Subtask completes by calling `attempt_completion(result)` with a concise summary
6. Summary "boomerangs" back to the orchestrator
7. Orchestrator decides next step based on the summary

**Context isolation is absolute**: the parent never sees the subtask's detailed execution (code diffs, file contents, debug output). It only receives the completion summary. This prevents the orchestrator's context window from filling with implementation noise.

### 1.5 Instruction File Hierarchy

Mode-specific instructions load from:
1. `.roo/rules-{mode-slug}/` (directory, preferred, files loaded alphabetically)
2. `.roorules-{mode-slug}` (single file fallback)
3. `.clinerules-{mode-slug}` (legacy backward compatibility)

Project modes (`.roomodes`) completely override global modes with the same slug -- no property merging.

### 1.6 Model Assignment

Each mode remembers its last-used AI model ("sticky models"). This means:
- Orchestrator can use a cheap/fast model (it only plans)
- Code mode can use the strongest model (it implements)
- Ask mode can use a reasoning model (it analyzes)

Model selection persists across sessions.

### 1.7 What SNIPER v3 Should Steal

1. **Zero-capability orchestrator**: The orchestrator having no direct tools is a pattern SNIPER v3's lead agent should adopt. The lead should only use `Task` (subagent spawn), not `Edit`, `Write`, `Bash`, etc. This is more extreme than v3's current plan where the lead "enters delegate mode."

2. **Tool permission enforcement via groups**: Roo's `fileRegex` restrictions on the `edit` group map directly to SNIPER's ownership boundaries. Instead of just documenting ownership in config.yaml, SNIPER v3 should enforce it via Claude Code agent `allowed-tools` patterns.

3. **`whenToUse` field for automated mode selection**: This is directly applicable to SNIPER's protocol auto-selection. Each protocol could have a `whenToUse` description that an intent-analysis skill uses to route.

4. **Sticky model per agent**: SNIPER v3 agents should support model assignment in frontmatter (`model: sonnet` for implementation, `model: haiku` for documentation).

5. **Boomerang summary pattern**: The `attempt_completion(result)` pattern -- where subtasks return only a concise summary to the parent -- prevents context pollution. SNIPER v3's subagent pattern should enforce summary-only returns.

---

## 2. Aider

### 2.1 Architecture (2025-2026 State)

Aider is a terminal-based AI pair programming tool (21k+ stars). Its architecture centers on three innovations: the **architect/editor dual-agent pattern**, a **graph-based repository map using tree-sitter and PageRank**, and **lint-test-fix feedback loops**.

### 2.2 The Architect/Editor Dual-Agent Pattern

The core insight: **reasoning and code editing are different skills that benefit from specialization**. Some models (like o1-series) excel at reasoning about solutions but struggle to produce properly formatted file edits. Others (like Sonnet) excel at precise editing.

**Workflow:**
1. User sends coding request
2. **Architect phase**: Reasoning-strong model receives the problem. It proposes a solution "however comes naturally to it" -- no formatting constraints, no edit syntax, just natural language description of what to change and why.
3. **Editor phase**: The architect's output is fed to a second model. This model translates the proposal into specific file editing instructions (diffs or whole-file rewrites).

**Edit formats supported:**
- `editor-diff`: Incremental diffs (more efficient, less token usage)
- `editor-whole`: Complete file rewrites (more reliable for complex changes)
- `editor-diff-fenced`: Fenced diff blocks

**Benchmark results:** SOTA at 85% pass rate pairing o1-preview (Architect) + Deepseek/o1-mini (Editor) with whole format. Practical configs like o1-preview + Claude 3.5 Sonnet scored 82.7% with diff format. Many models scored higher as architect/editor pairs than solo, confirming the separation provides consistent gains across model families.

**Configuration:**
- `--architect` flag enables the pattern
- `--editor-model` specifies which model handles editing
- `--auto-accept-architect` (default: true) auto-accepts architect proposals
- Separate `.aiderrules` files can be configured per model role

### 2.3 Chat Modes

Aider provides four modes that can be switched mid-conversation:

| Mode | Command | Behavior |
|------|---------|----------|
| **Code** | `/code` | Default. Makes file changes. |
| **Ask** | `/ask` | Read-only consultant. Answers questions without modifying files. |
| **Architect** | `/architect` | Dual-model reasoning+editing pipeline. |
| **Help** | `/help` | Aider-specific usage questions. |

Recommended workflow: bounce between `/ask` (discuss approach, get suggestions) and `/code` (implement). All conversation from ask mode provides context for code mode.

### 2.4 Repository Map -- Deep Technical Architecture

This is Aider's most technically sophisticated subsystem and the most relevant to SNIPER v3.

**The `RepoMap` class** (`aider/repomap.py`) performs:
1. Extract code definitions and references using tree-sitter parsers
2. Build a NetworkX MultiDiGraph of file relationships
3. Rank nodes using PageRank with personalization
4. Format top-ranked definitions into a token-limited context string

**Tag Extraction Pipeline:**

Tags represent code identifiers with structure:
```
{rel_fname, fname, line, name, kind: "def"|"ref"}
```

Tree-sitter query files (`.scm` format in `aider/queries/`) define extraction patterns for 100+ languages. The system uses a Pygments fallback for languages where tree-sitter only provides definitions.

**Three-level caching:**
1. `TAGS_CACHE` (diskcache): Persistent disk cache per file, invalidated on mtime change
2. `map_cache` (dict): In-memory cache of formatted repo maps
3. `tree_cache` (dict): In-memory cache of rendered code snippets

If SQLite fails (NFS, corruption), falls back to in-memory dict with warning.

**Graph Construction:**

The algorithm builds a `networkx.MultiDiGraph`:
- **Nodes**: Relative file paths
- **Edges**: References from one file to another via shared identifiers
- **Edge attributes**: `weight` (computed multiplier) and `ident` (identifier name)

**Edge Weight Multipliers** (the secret sauce):

| Condition | Multiplier |
|-----------|-----------|
| Base weight | 1.0 |
| Identifier mentioned in chat | x10 |
| Snake/kebab/camelCase >= 8 chars | x10 |
| Private identifier (starts with `_`) | x0.1 |
| Identifier referenced in >5 files | x0.1 |
| Reference in chat files | x50 |
| Multiple references | x sqrt(num_refs) |

**PageRank Personalization Vector:**
- Files in `chat_fnames`: +100 / len(fnames)
- Files in `mentioned_fnames`: +100 / len(fnames)
- Files with path components in `mentioned_idents`: +100 / len(fnames)

These accumulate if multiple conditions match.

**Token Budget Optimization:**

Uses binary search to fit tags within `max_map_tokens` (default: 1024):
- Starts with `middle = min(max_map_tokens // 25, num_tags)`
- Terminates when output is within 15% of target token count
- Typically converges in O(log N) iterations
- For efficiency, samples every Nth line (N = num_lines // 100) for texts >= 200 chars

When no chat files are present and `max_context_window` is set, map budget expands to `min(map_tokens * 8, max_context_window - 4096)`.

### 2.5 Lint-Test-Fix Loop

After every LLM edit, Aider:
1. Runs tree-sitter AST parsing on modified files (built-in linter)
2. Optionally runs configured linter (`--lint-cmd`)
3. If errors found, sends error report back to LLM
4. LLM attempts fix
5. Iterate (configurable max iterations)

This creates a self-healing feedback loop where syntax errors and lint violations are caught and fixed before the user ever sees them.

### 2.6 What SNIPER v3 Should Steal

1. **Architect/editor separation principle**: For SNIPER's planning phases, use a reasoning model to propose the solution, then a coding model to implement. This is not just about model selection -- it is about separating the "think about what to do" and "do it precisely" phases into distinct LLM calls.

2. **Repository map with PageRank**: SNIPER v3's `ingest` protocol (brownfield onboarding) should build a similar graph-ranked codebase map. The edge weight multipliers (boosting identifiers relevant to current work, penalizing private/widely-used identifiers) are directly applicable. This could be implemented as a skill that builds a `.sniper/codebase-map.md` artifact.

3. **Token budget binary search**: For SNIPER's lean document strategy, the binary-search-to-fit approach is more sophisticated than hard token caps. Instead of "max 3000 tokens for a spec," use binary search to find the densest representation that fits the budget.

4. **Self-healing lint loop**: SNIPER v3's `PostToolUse` hook for automatic test fix cycles should mirror Aider's pattern: detect failure, send error report to agent, let agent fix, iterate with a cap.

5. **Chat file boosting**: The concept of boosting context relevance based on what files are actively being discussed is applicable to SNIPER's progressive disclosure. When an implementation agent is working on `src/api/users.ts`, the repo map should heavily weight related files.

---

## 3. OpenHands (formerly OpenDevin)

### 3.1 Architecture Overview

OpenHands is an open platform for AI software agents (38k+ stars). Its V1 release (late 2025) refactored the monolithic V0 architecture into a modular SDK with clear boundaries. The key architectural insight is **event sourcing as the foundation for agent state, with opt-in sandboxing and a typed tool system**.

### 3.2 Event-Sourced State Model

All agent interactions are immutable events appended to a log. The event hierarchy:

```
Event (base: id, timestamp, source)
├── LLMConvertibleEvent (adds to_llm_message())
│   ├── ActionEvent (tool calls with agent reasoning)
│   └── ObservationBaseEvent (tool execution results)
└── Internal Events (state updates, control flow -- NOT sent to LLM)
```

**`ConversationState`** is the single mutable component and the single source of truth. All other entities (Agent, Tool, LLM) are immutable and serializable. State updates follow two paths: metadata changes (via `__setattr__` hook that auto-serializes to `base_state.json`) and event-based appends to an EventLog.

**Why this matters**: Deterministic replay. Given the same event log, the system reproduces the same state. This enables debugging, auditing, and -- crucially -- **recovery from any point in execution**.

### 3.3 Action-Execution-Observation Pattern

The tool system enforces a strict three-phase pattern:

1. **Action**: Validates tool inputs using Pydantic models before execution (type safety, preventing malformed requests)
2. **Execution**: `ToolExecutor` implements actual logic, receiving validated Actions
3. **Observation**: Structures output in LLM-compatible format, converting results or errors

This separation means tool specs can cross process boundaries (they are JSON-serializable) while execution stays local.

### 3.4 AgentDelegateAction (Multi-Agent)

Hierarchical agent coordination through delegation. Sub-agents operate as independent conversations inheriting the parent's model configuration and workspace context.

Key design: **delegation is implemented as a standard tool, not core SDK logic**. This means it is an extensible capability rather than a hardcoded feature, enabling structured parallelism without framework modifications.

### 3.5 Runtime Sandboxing

Sandboxing is **opt-in, not mandatory**. Three workspace abstractions:

| Workspace | Behavior |
|-----------|----------|
| `LocalWorkspace` | Executes in-process against host filesystem |
| `DockerWorkspace` | Isolated containers with dedicated filesystems |
| `RemoteWorkspace` | Delegates operations over HTTP to Agent Server |

The `Conversation` factory pattern abstracts local vs. remote: `LocalConversation` runs the full agent loop in-process; `RemoteConversation` serializes agent configuration and delegates over HTTP/WebSocket. Both share identical APIs ("local-first, deploy-anywhere").

Official Docker images bundle: API server, VSCode Web, VNC desktop, Chromium browser -- enabling SaaS-style multi-tenancy with workspace isolation.

### 3.6 MCP Integration

MCP tools are first-class SDK tools: JSON Schemas translate into Action models; results surface as structured Observations. `MCPToolDefinition` and `MCPToolExecutor` extend standard tool interfaces, allowing external MCP tools to behave identically to native ones.

### 3.7 Security Model

Two core abstractions:

1. **SecurityAnalyzer**: Rates each tool call as LOW, MEDIUM, HIGH, or unknown risk
2. **ConfirmationPolicy**: Determines whether user approval is required before execution

The default `LLMSecurityAnalyzer` appends a `security_risk` field to tool calls. `ConfirmRisky` blocks actions exceeding a configurable threshold. When approval is needed, the agent pauses in `WAITING_FOR_CONFIRMATION` state.

**SecretRegistry**: Secure, late-bound credentials with automatic masking -- secrets appearing in outputs are replaced with constant masks, preventing exposure in logs or LLM context.

### 3.8 Conversation Persistence and Recovery

State is persisted automatically via:
- `base_state.json`: Core conversation state (agent config, execution status)
- Event log: Appended incrementally

Saved state includes: complete message history, execution state (agent status, iteration count, stuck detection), tool outputs, LLM usage statistics, workspace context, and activated skills.

Recovery: conversations can be restored using the same conversation ID and persistence directory, allowing cross-session restoration.

### 3.9 What SNIPER v3 Should Steal

1. **Event-sourced state model**: SNIPER v3's checkpoint system should adopt event sourcing. Instead of writing checkpoint YAML files at phase transitions, maintain an append-only event log. Each agent action, observation, and phase transition is an event. Checkpoints become snapshots of the event log position, not separate state files. This enables recovery from any point, not just phase boundaries.

2. **Action-Execution-Observation pattern**: SNIPER v3's hooks system could benefit from this structured pattern. Instead of hooks being opaque shell commands, they could follow Action (what the hook will do) -> Execution (doing it) -> Observation (structured result) with Pydantic-style validation.

3. **Delegation as a tool, not a primitive**: SNIPER v3 should ensure agent delegation is implemented through Claude Code's standard `Task` tool rather than custom infrastructure. This keeps the framework compatible with Claude Code's evolution.

4. **Security risk classification**: SNIPER v3's agents could tag actions with risk levels. Low-risk actions (read, lint) proceed automatically. High-risk actions (delete, deploy, modify infrastructure) pause for human approval. This is more granular than v3's current gate-based approach.

5. **Secret masking in agent context**: The SecretRegistry pattern -- automatically masking secrets in agent output -- should be adopted for any SNIPER agent working with environment variables, API keys, or credentials.

---

## 4. Amazon Kiro

### 4.1 Spec-Driven Development

Kiro (launched mid-2025, built on Code OSS / VS Code) transforms single prompts into comprehensive specifications before any code is written. The core philosophy: assumptions the model makes should become explicit, documented, and verifiable.

### 4.2 Three-Phase Workflow

**Phase 1 -- Requirements Specs**: A prompt like "Add a review system" generates structured user stories covering viewing, creating, filtering, and rating. Each story includes EARS-notation acceptance criteria.

**Phase 2 -- Design Generation**: Kiro analyzes the existing codebase and generates technical designs including:
- Data flow diagrams
- TypeScript interfaces
- Database schemas
- API endpoints

All generated automatically from the requirements + codebase analysis.

**Phase 3 -- Task Sequencing**: Creates ordered task lists with dependencies, integrating testing requirements, responsive design considerations, and accessibility standards per task.

### 4.3 EARS Notation

EARS (Easy Approach to Requirements Syntax) was developed at Rolls Royce for constraining textual requirements. Kiro uses it to make acceptance criteria unambiguous. The patterns:

- **Ubiquitous**: "The [system] shall [behavior]"
- **Event-driven**: "When [trigger], the [system] shall [response]"
- **State-driven**: "While [state], the [system] shall [behavior]"
- **Unwanted behavior**: "If [condition], then the [system] shall [response]"
- **Optional**: "Where [feature is included], the [system] shall [behavior]"

This notation forces explicit coverage of edge cases, error states, and conditional behavior that natural-language specs typically miss.

### 4.4 Agent Hooks System

Event-driven automations triggered on file save, creation, or deletion:

- Automatically update test files when React components are saved
- Refresh README documentation when API endpoints change
- Scan for credential leaks before commits

Hooks enforce team-wide consistency through **Git-committed system prompts** that validate code against defined standards. This is the key insight: hooks are not just automation -- they are **codified team standards that persist across sessions and developers**.

### 4.5 Bidirectional Spec Synchronization

Specs remain synchronized with evolving codebases:
- Code changes can trigger spec updates ("here is what we actually built")
- Spec updates can refresh dependent tasks ("requirements changed, update plan")
- This prevents documentation drift, which is the #1 failure mode of spec-driven development

### 4.6 Frontier Agent (re:Invent 2025)

At AWS re:Invent 2025, Amazon announced three "Frontier Agents" including an autonomous Kiro agent with three defining characteristics:

1. **Autonomous**: Directed toward a goal, figures out how to achieve it
2. **Scalable**: Performs multiple tasks simultaneously
3. **Long-running**: Operates for hours or days without intervention

The frontier agent:
- **Maintains persistent context across sessions** (not just within a session)
- **Learns from feedback**: Code reviews, ticket comments, and architectural decisions inform its understanding over time
- **Integrates with team infrastructure**: Connects to repos, CI/CD pipelines, Jira, GitHub, Slack
- **Asynchronous operation**: Works while the developer does other things

### 4.7 What SNIPER v3 Should Steal

1. **EARS notation for acceptance criteria**: SNIPER v3's spec templates should mandate EARS-formatted acceptance criteria. The event-driven ("When X, then Y") and unwanted behavior ("If error, then Z") patterns ensure agents implement edge cases, not just happy paths. This is a concrete improvement to the spec template in section 7.3 of the v3 plan.

2. **Bidirectional spec sync**: SNIPER v3's `feature` protocol should include a "spec reconciliation" step after implementation. The code-reviewer agent checks whether the implemented code matches the spec and flags divergences. The spec is then updated to reflect what was actually built. This prevents `.sniper/artifacts/` from becoming stale.

3. **Hooks as codified team standards**: SNIPER v3's hooks should be viewed not just as automation but as **encoding team conventions in deterministic, enforceable rules**. "Always run prettier after editing TypeScript" is a team standard, not just a tool configuration.

4. **Persistent cross-session learning**: The frontier agent's ability to learn from code reviews and architectural decisions over time directly maps to SNIPER v3's self-improvement loop (section 9). The key addition: SNIPER should also learn from external signals (CI failures, PR review comments) not just internal retros.

5. **Spec-first, not code-first**: Kiro's three-phase pipeline (requirements -> design -> tasks) should be the default for SNIPER's `full` and `feature` protocols. The current v3 plan has this structure but should make it non-skippable: even if the spec is one paragraph, it must exist before implementation begins.

---

## 5. Google Conductor

### 5.1 Architecture

Conductor is an open-source Gemini CLI extension that implements "context-driven development." It shifts project context out of transient chat sessions into persistent Markdown files stored in the repository, treating **context as a managed artifact alongside code**.

### 5.2 Directory Structure

```
conductor/
├── product.md                 # Project goals, user personas, feature roadmap
├── product-guidelines.md      # Style, messaging, visual identity standards
├── tech-stack.md             # Language, database, framework preferences
├── workflow.md               # Team preferences (TDD, commit strategy, CI/CD)
├── code_styleguides/         # Language-specific style guides
├── tracks.md                 # Master track registry with completion status
└── tracks/
    └── <track_id>/
        ├── spec.md           # Detailed requirements for this track
        ├── plan.md           # Phases -> Tasks -> Sub-tasks
        └── metadata.json     # Track metadata
```

### 5.3 Context Layer Design

**Three persistent context layers:**

1. **Product Layer** (`product.md`, `product-guidelines.md`): User definitions, product goals, high-level features, brand guidelines. Referenced during planning to align implementations with product vision.

2. **Tech Stack Layer** (`tech-stack.md`): Technical decisions -- language choice, database, frameworks, dependencies. Ensures AI maintains consistency with established patterns.

3. **Workflow Layer** (`workflow.md`): Team processes -- TDD practices, commit strategies, CI/CD expectations, code review standards. Conductor uses this as baseline for planning phases.

### 5.4 Track System

A "track" is a logical unit of work (feature or bug fix) with a persistent lifecycle:

1. **Creation** (`/conductor:newTrack`): Generates spec.md and plan.md from context + user prompt
2. **Approval**: Human reviews spec and plan before implementation
3. **Implementation** (`/conductor:implement`): Agent executes tasks sequentially, marking completion in plan.md
4. **Tracking**: `tracks.md` maintains registry with completion status

Tracks support hierarchical breakdown: Phases -> Tasks -> Sub-tasks.

### 5.5 Three-Phase Lifecycle

**Phase 1 -- Context Setup** (`/conductor:setup`): Scaffolds project once per repository. Creates product, guidelines, tech stack, and workflow documents.

**Phase 2 -- Specification & Planning** (`/conductor:newTrack`): Generates two artifacts per track:
- `spec.md`: What are we building and why?
- `plan.md`: Actionable to-do list with phases and tasks

Conductor suggests answers based on existing context to help quickly build specs and plans.

**Phase 3 -- Implementation** (`/conductor:implement`): Agent works through plan.md, checking off tasks as completed. Features mid-flight plan editing and checkpoint-based version reverting.

### 5.6 Review and Revert System

`/conductor:review`: Compares completed work against plan.md and product-guidelines.md to ensure quality. The Automated Review feature generates post-implementation reports on code quality and guideline compliance.

`/conductor:revert`: Git-aware undo that understands logical units (tracks/phases/tasks) rather than just commit hashes. This means you can "revert phase 2 of track auth-feature" rather than manually identifying commits.

### 5.7 Context Persistence Across Sessions and Teams

Because all context is Markdown in git:
- Team members share the same context foundation
- Agents maintain context across sessions by reading established documents
- History is inspectable and rollbackable via git
- Guidelines evolve collaboratively over time

The architecture treats context as a managed artifact with the same lifecycle as code: versioned, reviewed, merged.

### 5.8 What SNIPER v3 Should Steal

1. **Context-as-code philosophy**: SNIPER v3's `.sniper/` directory already stores artifacts, but the approach should be formalized: all context documents are versioned, reviewed, and evolved like code. The v3 plan has this implicitly but Conductor makes it explicit and first-class.

2. **Three-layer context architecture**: The product/tech-stack/workflow separation maps cleanly to SNIPER v3:
   - `product.md` -> `.sniper/artifacts/<protocol-id>/spec.md` (already planned)
   - `tech-stack.md` -> `.sniper/conventions.yaml` + language plugin config
   - `workflow.md` -> `.sniper/config.yaml` workflow section + hook definitions

   The missing piece is a dedicated `product-guidelines.md` equivalent in SNIPER -- a persistent document that captures brand/quality standards separate from the per-feature spec.

3. **Track registry pattern**: `tracks.md` as a master registry of all work units with status is something SNIPER v3's `/sniper-status` should generate. Currently the v3 plan reads checkpoints -- it should also maintain a human-readable registry file.

4. **Logical revert**: The ability to revert by logical unit (track/phase/task) rather than by commit is a significant UX improvement. SNIPER v3's checkpoint system should tag git commits with protocol/phase metadata, enabling `sniper revert --protocol feat-042 --phase implement`.

5. **Context-guided spec generation**: Conductor's approach of suggesting spec content based on existing project context (product.md, tech-stack.md) should be adopted. When SNIPER's architect agent creates a plan, it should automatically incorporate conventions.yaml and anti-patterns.yaml into its planning context.

---

## 6. Factory.ai

### 6.1 The Five-Layer Context Stack

Factory.ai treats context as a scarce, high-value resource. Their architecture progressively distills "everything the company knows" into "exactly what the agent needs right now":

**Layer 1 -- Repository Overviews**: Auto-generated summary per connected repo containing project structure, key packages, build commands, core files, and directory tree. Injected at session start, eliminating thousands of exploratory tokens.

**Layer 2 -- Semantic Search**: Code-tuned vector embeddings return ranked candidate files and folder summaries for queries. Provides initial direction without overwhelming the agent.

**Layer 3 -- File System Commands**: Targeted operations specifying line numbers/ranges to fetch precise code sections. No dumping entire files -- surgical retrieval only.

**Layer 4 -- Enterprise Context Integrations**: Beyond code:
- **Sentry**: Error traces, performance data, production incidents
- **Notion/Google Docs**: Design docs, architectural decisions, onboarding guides, tribal knowledge

**Layer 5 -- Hierarchical Memory**:
- **User Memory**: Development environment details, past work history, style preferences
- **Org Memory**: Company-wide style guides, code review checklists, documentation templates

### 6.2 Anchored Iterative Summarization

This is Factory's core differentiator for long-running sessions. The system maintains a **structured, persistent summary** with explicit sections for:
- Session intent
- File modifications
- Decisions made
- Next steps

**How it works:**

The system uses two thresholds:
- **T_max** (compression threshold): When total context reaches this, compression begins
- **T_retained** (retention threshold): Max tokens kept post-compression (always < T_max)

When compression triggers:
1. Only the newly-truncated span is summarized
2. The new summary is merged with the existing persistent summary
3. The persistent summary is anchored to its position in the conversation

**This differs from Anthropic's approach** (used by Claude Code): Anthropic regenerates the full summary on each compression cycle. Factory incrementally merges new information into the persistent summary. This avoids redundant re-summarization of previously compressed content.

**Performance tradeoffs:**
- Narrow gap between T_max and T_retained: frequent compression, higher overhead, better preservation
- Wide gap: less frequent compression, risk of aggressive truncation

### 6.3 Compression Evaluation Results

Factory developed a probe-based evaluation framework using 36,611 production messages across debugging, PR review, feature implementation, and CI troubleshooting sessions.

**Four probe types:**
- **Recall**: Tests factual retention ("What was the original error message?")
- **Artifact**: Tests file tracking ("Which files have we modified?")
- **Continuation**: Tests task planning capability
- **Decision**: Tests reasoning chain preservation

**Results (scored by GPT-5.2 judge, 0-5 scale):**

| Method | Overall | Accuracy | Context | Artifact | Completeness | Continuity | Instruction |
|--------|---------|----------|---------|----------|--------------|-----------|-------------|
| Factory | **3.70** | 4.04 | 4.01 | 2.45 | 4.44 | 3.80 | 4.99 |
| Anthropic | 3.44 | 3.74 | 3.56 | 2.33 | 4.37 | 3.67 | 4.95 |
| OpenAI | 3.35 | 3.43 | 3.64 | 2.19 | 4.37 | 3.77 | 4.92 |

**Key insight**: All methods scored poorly on artifact tracking (2.19-2.45/5.0). File modification tracking needs specialized handling beyond summarization.

**Counter-intuitive finding**: OpenAI achieves 99.3% compression ratio but scores lowest. The dropped details force re-fetching that exceeds the initial token savings. The right optimization target is tokens per task, not tokens per request.

### 6.4 What SNIPER v3 Should Steal

1. **Structured summary with explicit sections**: SNIPER v3's checkpoint files should maintain the Factory-style structured summary: session intent, file modifications, decisions, next steps. When an agent reaches context limits and must be respawned, this structured summary (not a freeform narrative) is what gets passed to the replacement agent.

2. **Two-threshold compression system**: SNIPER v3's token budget management (section 4.4 of v3 plan) should adopt the T_max/T_retained dual-threshold approach rather than a single hard limit. The agent gets warned at T_retained and compression fires at T_max, leaving room for the summary.

3. **Artifact tracking as a separate concern**: Since all approaches fail at tracking file modifications through summarization, SNIPER v3 should maintain a **separate, structured artifact trail** outside the conversation context. The checkpoint file already has an `artifacts_produced` field -- this should be expanded to track every file read, modified, and created, with timestamps.

4. **Repository overview as session primer**: SNIPER v3's `ingest` protocol output should be used as a session primer for all subsequent protocols. When any agent spawns, it receives the codebase overview as part of its initial context, similar to Factory's Layer 1.

5. **Proactive compression at natural breakpoints**: Factory's future direction -- agents recognizing natural breakpoints and self-directing compression -- maps to SNIPER's phase transitions. Each phase boundary is a natural compression point. The checkpoint at phase transitions should include a compressed summary of everything that happened in that phase.

---

## 7. Emerging Patterns (2025-2026)

### 7.1 Codified Context Infrastructure

A significant 2026 paper (arxiv:2602.20478) documents a three-tier "codified context" infrastructure built during construction of a 108,000-line C# distributed system across 283 development sessions.

**Three-tier architecture:**

**Tier 1 -- Hot Memory Constitution** (~660 lines, always loaded):
A single Markdown file encoding code quality standards, naming conventions, build commands, and orchestration protocols. Critically, it includes **trigger tables** routing tasks to appropriate specialist agents based on observable signals (primarily which files are modified). Example: network synchronization changes trigger the network-protocol-designer agent.

**Tier 2 -- Domain-Expert Agents** (19 agents, ~9,300 lines):
Specialized agent specifications where **over 50% of each specification is domain knowledge, not behavioral instructions**. The networking agent embeds full determinism theory to prevent desynchronization bugs. Agents emerged from observed failure patterns: "if debugging a particular domain consumed an extended session without resolution, it was faster to create a specialized agent and restart."

**Tier 3 -- Cold Memory Knowledge Base** (34 documents, ~16,250 lines):
On-demand specifications with symptom-cause-fix tables. Retrieved via MCP server with keyword search (five functions: `list_subsystems()`, `get_files_for_subsystem()`, `find_relevant_context()`, `search_context_documents()`, `suggest_agent()`).

**Metrics from 283 sessions:**
- 2,801 human prompts, 1,197 agent invocations, 16,522 autonomous agent turns
- ~6 agent turns per human prompt through agent-to-agent chaining
- 57% of invocations targeted specialized agents vs. built-in tools
- 1,478 MCP knowledge-base calls across 218 sessions

**Cross-session propagation**: A save-system spec (283 lines) referenced in 74 sessions enabled consistent architecture across five features with zero bugs. Lessons from a problematic implementation were codified into a specification document, which then guided the next implementation to correct on first attempt.

**Maintenance overhead**: 1-2 hours weekly, ~5 minutes per session for spec updates. Primary failure mode: specification staleness when code changes without documentation updates.

**SNIPER v3 relevance**: This validates SNIPER's entire approach. The three tiers map directly: constitution -> CLAUDE.md + config.yaml, domain agents -> `.claude/agents/`, knowledge base -> `.sniper/memory/` + domain packs. The key additions for SNIPER:
- Trigger tables for automatic agent routing (file-change-based, not just intent-based)
- 50%+ domain knowledge in agent specs (SNIPER agents are currently more behavioral than knowledge-heavy)
- MCP-based knowledge retrieval from cold storage

### 7.2 OpenAI Codex Multi-Agent Architecture

Codex (launched February 2026) provides multi-agent orchestration:

**Agent spawning**: Codex spawns specialized sub-agents in parallel. Orchestration includes spawning, routing follow-up instructions, waiting for results, and closing agent threads. Sub-agents inherit sandbox policy but run with non-interactive approvals -- if a sub-agent attempts an action requiring approval, it fails and the error surfaces to the parent.

**AGENTS.md configuration** (three-tier precedence):
1. Global: `~/.codex/AGENTS.override.md` then `AGENTS.md`
2. Project: Git root to current directory, checking each for overrides
3. Files concatenate root-to-leaf with blank-line separators

Customizable via `config.toml`:
- `project_doc_fallback_filenames`: Alternate instruction file names
- `project_doc_max_bytes`: Size limit (default 32 KiB, max 65,536)

**Agent roles in TOML:**
```toml
[agents.explorer]
description = "Read-only codebase exploration"
config_file = "agents/explorer.toml"
sandbox_mode = "read-only"
model = "gpt-5.3-codex-spark"
```

Built-in roles: `default`, `worker`, `explorer`, `monitor`. Limits: `max_threads` (concurrent agents), `max_depth` (nesting depth, default 1).

**`wait` tool**: Supports long polling windows up to 1 hour per call for monitoring workflows.

### 7.3 Claude Code Teams and Swarms (Control Plane Pattern)

An emerging architecture pattern describes Claude Code multi-agent systems using infrastructure metaphors:

**Data plane vs. control plane separation:**
- Data plane: Normal work products (messages, diffs, suggestions, code)
- Control plane: Coordination traffic (approvals, permissions, policies, cancellation, shutdown, health)

**Single authority pattern**: One leader as the policy engine. Workers are execution engines with bounded autonomy. This prevents concurrent side effects that are "locally reasonable and globally wrong."

**Six control plane operations:**
1. Work assignment (leader -> worker)
2. Plan gating (worker proposes, leader approves)
3. Permission gating (worker requests, leader grants/denies)
4. Sandbox changes (capability modifications)
5. Cancellation/shutdown (clean termination with acknowledgment)
6. Health monitoring (progress signals for retry/replacement)

**Durable messaging**: Control-plane messages must be durable and replayable. File mailboxes or any persistent queue. Policy changes apply before data-plane content delivery.

**SNIPER v3 relevance**: This framing maps perfectly to SNIPER's orchestration model. The lead agent is the control plane; implementation agents are the data plane. The six operations map to SNIPER's protocol phases and gates. The durable messaging requirement validates SNIPER's checkpoint system.

### 7.4 Anthropic's 2026 Agentic Coding Trends

Anthropic's official report identifies eight trends, with several directly relevant:

1. **Multi-agent coordination**: Organizations deploy specialized agents working in parallel under an orchestrator, each with dedicated context. Requires task decomposition, coordination methods, and visibility across concurrent sessions.

2. **Extended execution**: Agents progress from brief tasks to work continuing for hours or days. Systems maintain project context across extended runs with human checkpoints at milestones.

3. **Uncertainty detection**: Agents detect uncertainty and flag risks at decision points rather than proceeding autonomously. Agents increasingly review AI-generated code for security and consistency.

4. **Scaling beyond engineering**: Agent support expands to non-traditional developers in security, operations, design, and data roles.

5. **Autonomous 30+ hour operation**: Claude 4.5 Sonnet can code for 30+ hours without major performance degradation, using context summarization and sub-agent delegation to manage context limits.

### 7.5 Autonomous Code Review Systems

**Qodo (formerly CodiumAI)**:
- Named a Visionary in Gartner's September 2025 Magic Quadrant for AI Coding Assistants
- "Codebase Intelligence Engine" understands architectural patterns across repos
- 15+ automated PR workflows: scope validation, missing tests, standards enforcement, risk scoring
- Ticket-aware validation against Jira/ADO intent
- System-aware: understands contracts, dependencies, production impact

**Graphite Agent**:
- Full-codebase understanding combined with stacked PRs
- Under 3% unhelpful comment rate
- When it flags an issue, developers change code 55% of the time
- Merge queue coordinates landing changes in order
- Shopify: 33% more PRs merged per developer; Asana: 7 hours/week saved per engineer

**Ellipsis**:
- Reads reviewer comments and auto-generates fixing commits
- Maintains codebase understanding and coding standards
- Generates code, runs tests, commits results
- Best for mechanical/straightforward fixes; struggles with complex logic

**SNIPER v3 relevance**: The review gate system should support multi-faceted review similar to Qodo: not just "does this code work" but scope validation, standards enforcement, risk scoring, and regression detection. The v3 plan's code-reviewer agent should be expanded with these specific review dimensions.

### 7.6 Devin 2.x Architecture

Devin (by Cognition AI) represents the fully autonomous end of the spectrum:

- **Devin 2.0** (April 2025): Complete overhaul, 83% more tasks completed per ACU vs 1.x
- **Devin 2.2** (February 2026): Desktop computer-use, self-reviewing PR system catching 30% more issues before human review
- **Dynamic re-planning**: v3.0 supports re-planning when hitting roadblocks, altering strategy without human intervention
- **Goldman Sachs pilot**: 12,000 developer org, 20% efficiency gains, described as "hybrid workforce"

**Self-reviewing PR pattern**: Devin generates code, then reviews its own PR before submission, catching 30% more issues. SNIPER v3 could adopt this: before the review gate fires, the implementation agent does a self-review pass.

### 7.7 Context Engineering Patterns (Martin Fowler)

A synthesis of context engineering practices across tools:

**Three categories of context:**
1. **Reusable prompts**: Instructions (direct directives) and guidance (general conventions)
2. **Context interfaces**: Tools (built-in), MCP servers (structured API access), Skills (on-demand resources)
3. **Workspace files**: Direct codebase access

**Context loading triggers:**
| Trigger | Mechanism | Examples |
|---------|-----------|---------|
| LLM-driven | Model decides relevance | Skills, MCP servers |
| Human-triggered | Manual invocation | Slash commands |
| Deterministic | Software-controlled | Hooks, CLAUDE.md loading |

**Critical principle**: Context size management -- minimize bloat, larger is not automatically better. Build configurations iteratively, not by pre-loading everything.

### 7.8 Claude Code Subagent Worktree Isolation

Claude Code now supports (2026):
- Subagents with worktree isolation (`isolation: worktree` in agent frontmatter)
- `--worktree (-w)` flag for creating isolated worktrees from CLI
- Parallel agents working on separate branches simultaneously
- Community frameworks like `ccswarm` for multi-agent coordination with worktree isolation

**SNIPER v3 relevance**: This is the runtime mechanism for SNIPER's parallel agent execution. The v3 plan already specifies `isolation: worktree` in agent definitions. The key addition: SNIPER should manage worktree lifecycle (creation, merge, cleanup) as part of the protocol, not leave it to the developer.

---

## 8. Synthesis: Patterns for SNIPER v3

### 8.1 Highest-Impact Additions Not in Current v3 Plan

Based on the research, these are concrete capabilities missing from the current v3 plan that would be highest-impact:

1. **Event-sourced checkpoint system** (from OpenHands): Replace YAML checkpoint files with an append-only event log. Phase transitions become snapshots, not separate state. Enables recovery from any point, not just phase boundaries.

2. **Repository map as a first-class artifact** (from Aider): The `ingest` protocol should produce a PageRank-weighted codebase map that is stored as `.sniper/artifacts/repo-map.md` and injected as Layer 1 context for all subsequent agent sessions.

3. **Trigger tables for agent routing** (from Codified Context): In addition to intent-based protocol selection, add file-change-based agent routing. When files in `src/api/` change, the backend-dev agent is automatically suggested. This makes agent selection deterministic rather than relying on LLM judgment.

4. **EARS notation in spec templates** (from Kiro): Mandate EARS-format acceptance criteria in all spec templates. This is a low-effort, high-impact change to template design.

5. **Structured artifact trail** (from Factory.ai evaluation): Since all compression methods fail at tracking file modifications, maintain a separate structured log of every file read/modified/created, outside the conversation context. This survives compression.

6. **Self-review before gate** (from Devin 2.2): Before the review gate fires, the implementation agent performs a self-review pass. 30% more issues caught.

7. **Zero-capability orchestrator** (from Roo Code): The lead agent should have NO direct tools except `Task` (subagent spawn). This prevents context pollution and forces proper delegation.

### 8.2 Configuration Format Comparison

| Tool | Config Format | Config Location | Layering |
|------|--------------|-----------------|----------|
| Roo Code | YAML/JSON | `.roomodes` (project), `custom_modes.yaml` (global) | Project overrides global (no merge) |
| Aider | CLI flags + `.aider.conf.yml` | Home dir + project dir | Project overrides global |
| OpenHands | Pydantic models + TOML | `base_state.json` + config files | Event-sourced state |
| Kiro | Specs as Markdown + YAML steering | In-project `.kiro/` | Three-phase cascade |
| Conductor | Markdown | `conductor/` in project root | Track-based isolation |
| Codex | AGENTS.md + TOML | `~/.codex/` + project dirs | Root-to-leaf concatenation |
| **SNIPER v3** | **YAML + Markdown agents** | **`.sniper/` + `.claude/`** | **Config-driven mixin composition** |

### 8.3 Multi-Agent Coordination Comparison

| Tool | Coordination Model | Context Isolation | Recovery Mechanism |
|------|-------------------|-------------------|-------------------|
| Roo Code | Boomerang (new_task -> attempt_completion) | Full (separate conversation per subtask) | None (stateless) |
| Aider | Sequential (single agent, mode switching) | None (single context) | None |
| OpenHands | Event-sourced delegation (AgentDelegateAction) | Full (sub-conversations) | Event log replay |
| Kiro | Sequential phases + async frontier agent | Session-based | Cross-session memory |
| Conductor | Track-based sequential phases | Track-level (spec + plan per track) | Git-based revert by logical unit |
| Codex | Parallel sub-agents with sandbox inheritance | Full (separate threads) | Parent orchestrates retry |
| **SNIPER v3** | **Protocol-driven with worktree isolation** | **Worktree per agent** | **Checkpoint + respawn** |

### 8.4 Context Management Comparison

| Tool | Context Strategy | Compression | Persistence |
|------|-----------------|-------------|-------------|
| Aider | Graph-ranked repo map + token-budgeted context | Binary search to fit budget | None (per-session) |
| Factory.ai | 5-layer stack + anchored iterative summarization | Two-threshold (T_max/T_retained) | User + Org memory |
| Conductor | Persistent Markdown files in git | None (all files loaded) | Git-versioned |
| Codified Context | Three-tier (hot constitution + domain agents + cold KB) | Tier-based loading | Git + MCP retrieval |
| **SNIPER v3** | **Progressive disclosure by phase + lean templates** | **Token budgets per artifact** | **Checkpoints + memory YAML** |

### 8.5 Priority Ranking for v3 Implementation

| Priority | Pattern | Source | Effort | Impact |
|----------|---------|--------|--------|--------|
| P0 | EARS notation in spec templates | Kiro | Low | High |
| P0 | Zero-capability orchestrator (lead has no tools except Task) | Roo Code | Low | High |
| P0 | Self-review pass before review gate | Devin 2.2 | Low | High |
| P1 | Structured artifact trail (separate from conversation) | Factory.ai | Medium | High |
| P1 | Repository map as first-class artifact | Aider | Medium | High |
| P1 | Trigger tables for file-change-based agent routing | Codified Context | Medium | Medium |
| P1 | Two-threshold compression (T_max/T_retained) | Factory.ai | Medium | Medium |
| P2 | Event-sourced checkpoint system | OpenHands | High | High |
| P2 | Bidirectional spec synchronization | Kiro | Medium | Medium |
| P2 | Logical revert by protocol/phase/task | Conductor | High | Medium |
| P2 | Multi-faceted review (scope, standards, risk scoring) | Qodo | Medium | Medium |
| P3 | Domain knowledge > 50% of agent specs | Codified Context | High | High (long-term) |
| P3 | Cross-session learning from external signals | Kiro Frontier | High | High (long-term) |

---

## Sources

### Roo Code
- [Roo Code Documentation: Using Modes](https://docs.roocode.com/basic-usage/using-modes)
- [Roo Code Documentation: Customizing Modes](https://docs.roocode.com/features/custom-modes)
- [Roo Code Documentation: Boomerang Tasks](https://docs.roocode.com/features/boomerang-tasks)
- [Roo Code GitHub Repository](https://github.com/RooCodeInc/Roo-Code)
- [Roo Custom Modes - This Dot Labs](https://www.thisdot.co/blog/roo-custom-modes)

### Aider
- [Aider: Repository Map Documentation](https://aider.chat/docs/repomap.html)
- [Aider: Separating Code Reasoning and Editing](https://aider.chat/2024/09/26/architect.html)
- [Aider: Chat Modes](https://aider.chat/docs/usage/modes.html)
- [Aider: Linting and Testing](https://aider.chat/docs/usage/lint-test.html)
- [DeepWiki: Aider Repository Mapping Architecture](https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping)
- [Aider GitHub Repository](https://github.com/Aider-AI/aider)

### OpenHands
- [OpenHands Software Agent SDK Paper (arxiv:2511.03690)](https://arxiv.org/html/2511.03690v1)
- [OpenHands SDK Documentation](https://docs.openhands.dev/sdk)
- [OpenHands SDK Conversation Persistence](https://docs.openhands.dev/sdk/guides/convo-persistence)
- [OpenHands GitHub Repository](https://github.com/OpenHands/OpenHands)

### Amazon Kiro
- [Introducing Kiro - Official Blog](https://kiro.dev/blog/introducing-kiro/)
- [Amazon Previews Frontier AI Agents - TechCrunch](https://techcrunch.com/2025/12/02/amazon-previews-3-ai-agents-including-kiro-that-can-code-on-its-own-for-days/)
- [AWS re:Invent 2025 Announcements - Caylent](https://caylent.com/blog/aws-reinvent-2025-every-ai-announcement-including-amazon-nova-2-and-kiro)
- [Beyond Vibe Coding: Kiro - InfoQ](https://www.infoq.com/news/2025/08/aws-kiro-spec-driven-agent/)

### Google Conductor
- [Conductor: Context-Driven Development - Google Developers Blog](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/)
- [Conductor GitHub Repository](https://github.com/gemini-cli-extensions/conductor)
- [Conductor Update: Automated Reviews](https://developers.googleblog.com/conductor-update-introducing-automated-reviews/)
- [Google Conductor - MarkTechPost](https://www.marktechpost.com/2026/02/02/google-releases-conductor-a-context-driven-gemini-cli-extension-that-stores-knowledge-as-markdown-and-orchestrates-agentic-workflows/)

### Factory.ai
- [Compressing Context - Factory.ai](https://factory.ai/news/compressing-context)
- [The Context Window Problem - Factory.ai](https://factory.ai/news/context-window-problem)
- [Evaluating Context Compression - Factory.ai](https://factory.ai/news/evaluating-compression)

### Emerging Patterns
- [Codified Context Infrastructure (arxiv:2602.20478)](https://arxiv.org/html/2602.20478v1)
- [Context Engineering for Coding Agents - Martin Fowler](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
- [Claude Code Teams and Swarms - Decode Claude](https://decodeclaude.com/teams-and-swarms/)
- [Anthropic 2026 Agentic Coding Trends](https://tessl.io/blog/8-trends-shaping-software-engineering-in-2026-according-to-anthropics-agentic-coding-report/)
- [OpenAI Codex Multi-Agent Documentation](https://developers.openai.com/codex/multi-agent/)
- [AGENTS.md Documentation](https://developers.openai.com/codex/guides/agents-md/)
- [Qodo AI Code Review Tools 2026](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/)
- [Graphite AI Code Review](https://graphite.com/)
- [Devin 2025 Performance Review - Cognition AI](https://cognition.ai/blog/devin-annual-performance-review-2025)
