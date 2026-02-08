# SNIPER: Spawn, Navigate, Implement, Parallelize, Evaluate, Release
## The Agent Teams-Native Development Framework

> **Version:** 0.1.0-plan
> **Status:** Blueprint — ready to hand to Claude Code for implementation
> **Runtime:** Claude Code CLI (terminal)
> **First project:** AI-powered Sales Dialer SaaS

---

## TABLE OF CONTENTS

1. [Vision & Why This Exists](#1-vision--why-this-exists)
2. [Name & Lifecycle Mapping](#2-name--lifecycle-mapping)
3. [What SNIPER Borrows (and Doesn't)](#3-what-sniper-borrows-and-doesnt)
4. [Design Principles](#4-design-principles)
5. [Framework Architecture & Directory Structure](#5-framework-architecture--directory-structure)
6. [The CLAUDE.md (Progressive Disclosure Hub)](#6-the-claudemd)
7. [Configuration System](#7-configuration-system)
8. [The Persona Composition System (Core Innovation)](#8-the-persona-composition-system)
9. [The Lifecycle: Phases & Agent Teams](#9-the-lifecycle-phases--agent-teams)
10. [Slash Commands](#10-slash-commands)
11. [Review Gates (Flexible Mode)](#11-review-gates)
12. [Domain Packs](#12-domain-packs)
13. [Domain Pack: AI Sales Dialer](#13-domain-pack-ai-sales-dialer)
14. [Implementation Plan](#14-implementation-plan)
15. [Framework Comparison Matrix](#15-framework-comparison-matrix)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Success Criteria](#17-success-criteria)
18. [Appendix A: Persona Source Extraction Guide](#appendix-a-persona-source-extraction-guide)
19. [Appendix B: Complete File Inventory](#appendix-b-complete-file-inventory)
20. [Appendix C: Source References & Format Specifications](#appendix-c-source-references--format-specifications)

---

## 1. VISION & WHY THIS EXISTS

Every existing AI development framework was designed for a single-agent world:

| Framework | Designed For | Parallel Agents | Inter-Agent Messaging | Lifecycle Phases |
|-----------|-------------|----------------|----------------------|-----------------|
| BMAD | Sequential persona switching in IDE | ❌ | ❌ | ✅ |
| SuperClaude | Single-agent cognitive modes + flags | ❌ | ❌ | ❌ |
| VoltAgent | Subagent delegation (report back) | ❌ | ❌ | ❌ |
| claude-flow | External MCP orchestration layer | 🔶 External | 🔶 External | ❌ |
| SPARC | Single-agent phased development | ❌ | ❌ | 🔶 Partial |
| SPIDER | Spec-driven single-agent | ❌ | ❌ | 🔶 Partial |

Claude Code Agent Teams (experimental, shipped with Opus 4.6) changes the paradigm:

- **Multiple independent Claude instances** with their own context windows
- **Direct peer-to-peer messaging** between teammates (not just report-to-parent)
- **Shared task lists** with dependency blocking and self-claiming
- **Delegate mode** (lead coordinates without coding — Shift+Tab)
- **Plan approval gates** (teammates propose approach, lead approves before execution)

**SNIPER is the first framework designed from the ground up for Agent Teams.** It doesn't bolt parallelism onto a single-agent design. Every workflow assumes a team of specialized teammates working in parallel, communicating with each other, and coordinated by a lead in delegate mode.

---

## 2. NAME & LIFECYCLE MAPPING

**S.N.I.P.E.R.** — each letter maps to a lifecycle capability:

| Letter | Word | Lifecycle Function | Phase |
|--------|------|-------------------|-------|
| **S** | **Spawn** | Compose personas from layers and spawn Agent Teams teammates | All phases |
| **N** | **Navigate** | Navigate the problem space — discovery, research, analysis | Phase 1: Discover |
| **I** | **Implement** | Plan, architect, design — then build code from stories | Phases 2-4 |
| **P** | **Parallelize** | Execute teammates in parallel with messaging & task dependencies | All phases |
| **E** | **Evaluate** | Review gates, quality checklists, human approval | Phase boundaries |
| **R** | **Release** | Sprint complete, PR merge, deploy, iterate | End of sprints |

The full lifecycle phases:

```
NAVIGATE  →  IMPLEMENT (Plan)  →  IMPLEMENT (Build)  →  RELEASE
Phase 1        Phase 2-3              Phase 4            Sprint End
Discovery      Planning &             Sprint              Review &
& Analysis     Solutioning            Execution           Ship

Spawn teams    Spawn teams            Spawn teams         Evaluate
Parallelize    Parallelize            Parallelize         Release
Evaluate       Evaluate               Evaluate
```

---

## 3. WHAT SNIPER BORROWS (AND DOESN'T)

### From BMAD (Lifecycle & Governance)
- ✅ Four-phase lifecycle (Analysis → Planning → Solutioning → Implementation)
- ✅ Artifact-driven handoffs (Brief → PRD → Architecture → Stories → Code)
- ✅ Agent personas with distinct roles and communication styles
- ✅ Git-versioned governance and artifact review
- ✅ Epic sharding to prevent context drift
- ❌ Sequential single-agent execution model
- ❌ YAML-heavy `.agent.yaml` definition format
- ❌ Web UI planning phase (SNIPER is CLI-native)
- ❌ Named character personalities (Mary, Winston, etc. — we keep the role discipline, drop the fiction)

### From VoltAgent/awesome-claude-code-subagents (Technical Depth)
- ✅ Deep technical expertise in persona definitions
- ✅ Framework/language-specific knowledge
- ✅ Tool access control per agent (Read-only for reviewers, full Write for developers)
- ✅ Categorized agent library with modular installation
- ✅ YAML frontmatter format for agent metadata
- ❌ Subagent-only model (report back, no inter-agent messaging)
- ❌ Flat agent structure with no lifecycle phase awareness
- ❌ Plugin marketplace complexity

### From SuperClaude (Cognitive Modes)
- ✅ Cognitive modes as composable thinking lenses
- ✅ Evidence-based development patterns
- ✅ Persona chaining concept (architect → security → backend → QA)
- ✅ Thinking-depth flags (think → think-hard → ultrathink)
- ❌ Configuration-only framework (no orchestration runtime)
- ❌ Slash command architecture (`/sc:*`) — SNIPER uses `/sniper-*`
- ❌ Single-agent mental model

---

## 4. DESIGN PRINCIPLES

1. **Teams-Native**: Every workflow assumes parallel teammates, not sequential persona switching. If one agent can do it, don't use a team. If two or more can work in parallel with coordination, always use a team.

2. **Composable Personas**: Spawn prompts are assembled from four layers — Process (what to do) + Technical (how deeply) + Cognitive (how to think) + Domain (about what). Mix and match per project.

3. **Progressive Disclosure**: The CLAUDE.md is a lean pointer (< 2KB). Detailed instructions live in `.sniper/` docs and are loaded on demand. Spawn prompts pull only the layers they need. Stories embed their own context.

4. **Project-Agnostic Core**: The framework works for any project type (SaaS, API, CLI, mobile, library). Domain-specific knowledge lives in installable Domain Packs.

5. **Human-at-the-Helm (Flexible)**: Architecture and implementation phases require human approval. Discovery and story creation auto-advance unless configured otherwise. The human controls the big decisions, agents handle the work.

6. **Artifact-Driven**: Every phase produces versioned markdown artifacts (`docs/`) that feed the next phase. No context is held only in conversation — it's always in files.

7. **Convention over Configuration**: Sensible defaults work out of the box. `config.yaml` overrides when needed.

8. **File Ownership Prevents Chaos**: Every teammate in a sprint has explicit directory ownership boundaries in their spawn prompt. No two teammates touch the same files.

9. **Delegate Mode by Default**: The team lead (your Claude Code session) enters delegate mode (Shift+Tab) during team execution. It coordinates, it doesn't code.

10. **Lean Framework, Rich Domain**: The framework itself stays under 50KB total. Domain packs add project-specific depth without bloating the core.

---

## 5. FRAMEWORK ARCHITECTURE & DIRECTORY STRUCTURE

```
your-project/
├── CLAUDE.md                              # Lean pointer file (< 2KB)
├── .sniper/
│   ├── config.yaml                        # Project configuration
│   │
│   ├── personas/                          # Composable persona layers
│   │   ├── process/                       # Layer 1: Lifecycle roles (from BMAD)
│   │   │   ├── analyst.md                 # Discovery & market research
│   │   │   ├── product-manager.md         # PRD authorship
│   │   │   ├── architect.md               # System design
│   │   │   ├── ux-designer.md             # UX specification
│   │   │   ├── scrum-master.md            # Epic sharding & story creation
│   │   │   ├── developer.md               # Code implementation
│   │   │   └── qa-engineer.md             # Testing & quality
│   │   │
│   │   ├── technical/                     # Layer 2: Technical expertise (from VoltAgent)
│   │   │   ├── backend.md                 # Node/Python/Go, APIs, auth, queues
│   │   │   ├── frontend.md                # React/Vue/Svelte, state, a11y
│   │   │   ├── infrastructure.md          # AWS/GCP/Azure, Docker, K8s, CI/CD
│   │   │   ├── security.md                # OWASP, pen testing, encryption, compliance
│   │   │   ├── ai-ml.md                   # ML pipelines, NLP, model serving
│   │   │   ├── database.md                # Schema design, migrations, optimization
│   │   │   └── api-design.md              # REST, GraphQL, gRPC, OpenAPI
│   │   │
│   │   ├── cognitive/                     # Layer 3: Thinking modes (from SuperClaude)
│   │   │   ├── systems-thinker.md         # Scalability, coupling, design patterns
│   │   │   ├── security-first.md          # Threat modeling on every decision
│   │   │   ├── performance-focused.md     # Latency budgets, caching, profiling
│   │   │   ├── user-empathetic.md         # UX friction, accessibility, progressive disclosure
│   │   │   ├── devils-advocate.md         # Challenge assumptions, find edge cases
│   │   │   └── mentor-explainer.md        # Document decisions, explain trade-offs
│   │   │
│   │   └── domain/                        # Layer 4: Project-specific (user-created or from packs)
│   │       └── (populated by domain pack or manually)
│   │
│   ├── spawn-prompts/                     # Composed prompts for Agent Teams teammates
│   │   ├── _template.md                   # Template for composing layers
│   │   └── (generated by /sniper-compose)
│   │
│   ├── teams/                             # Team definitions for each phase
│   │   ├── discover.yaml                  # Phase 1 team composition
│   │   ├── plan.yaml                      # Phase 2 team composition
│   │   ├── solve.yaml                     # Phase 3 configuration (sequential)
│   │   └── sprint.yaml                    # Phase 4 sprint template
│   │
│   ├── workflows/                         # Orchestration instructions per phase
│   │   ├── full-lifecycle.md              # End-to-end project lifecycle
│   │   ├── sprint-cycle.md                # Single sprint execution
│   │   ├── discover-only.md               # Just research/analysis
│   │   └── quick-feature.md              # Fast feature — skip planning
│   │
│   ├── templates/                         # Artifact templates (what agents fill in)
│   │   ├── brief.md                       # Project brief template
│   │   ├── prd.md                         # Product requirements document template
│   │   ├── architecture.md                # System architecture template
│   │   ├── ux-spec.md                     # UX specification template
│   │   ├── epic.md                        # Epic template
│   │   ├── story.md                       # Story template (with embedded context)
│   │   └── sprint-review.md               # Sprint review template
│   │
│   ├── checklists/                        # Review gate checklists
│   │   ├── discover-review.md             # Phase 1 gate
│   │   ├── plan-review.md                 # Phase 2 gate (STRICT — always human)
│   │   ├── story-review.md                # Phase 3 gate
│   │   ├── sprint-review.md               # Phase 4 gate (STRICT — always human)
│   │   └── code-review.md                 # Per-story code quality check
│   │
│   └── domain-packs/                      # Installable domain knowledge packs
│       └── (e.g., sales-dialer/, fintech/, healthcare/, devtool/)
│
├── docs/                                  # Generated artifacts (phase outputs)
│   ├── brief.md                           # Phase 1 output
│   ├── prd.md                             # Phase 2 output
│   ├── architecture.md                    # Phase 2 output
│   ├── ux-spec.md                         # Phase 2 output
│   ├── security.md                        # Phase 2 output
│   ├── epics/                             # Phase 3 output
│   │   ├── 01-project-setup.md
│   │   ├── 02-telephony-core.md
│   │   └── ...
│   ├── stories/                           # Phase 3 output
│   │   ├── 01.1-monorepo-scaffold.md
│   │   ├── 02.1-twilio-integration.md
│   │   └── ...
│   └── reviews/                           # Phase 4 output
│       ├── sprint-1-review.md
│       └── ...
│
├── .claude/
│   ├── commands/                          # Slash commands for Claude Code
│   │   ├── sniper-init.md
│   │   ├── sniper-discover.md
│   │   ├── sniper-plan.md
│   │   ├── sniper-solve.md
│   │   ├── sniper-sprint.md
│   │   ├── sniper-review.md
│   │   ├── sniper-compose.md
│   │   └── sniper-status.md
│   └── agents/                            # Optional: Subagents for non-team tasks
│       └── sniper-orchestrator.md
│
└── src/                                   # Your actual application code
```

---

## 6. THE CLAUDE.md

Following best practices (progressive disclosure, lean, pointers not instructions):

```markdown
# [Project Name]

## Framework
This project uses SNIPER (Spawn, Navigate, Implement, Parallelize, Evaluate, Release).
See `.sniper/config.yaml` for project settings.

## Quick Reference
- Framework workflows: `.sniper/workflows/`
- Persona layers: `.sniper/personas/`
- Team definitions: `.sniper/teams/`
- Artifact templates: `.sniper/templates/`
- Quality gates: `.sniper/checklists/`
- Project artifacts: `docs/`
- Domain context: `.sniper/domain-packs/{pack-name}/`

## Commands
- `/sniper-init` — Initialize SNIPER in a new project
- `/sniper-discover` — Phase 1: Discovery & Analysis (parallel team)
- `/sniper-plan` — Phase 2: Planning & Architecture (parallel team)
- `/sniper-solve` — Phase 3: Epic Sharding & Story Creation (sequential)
- `/sniper-sprint` — Phase 4: Implementation Sprint (parallel team)
- `/sniper-review` — Run review gate for current phase
- `/sniper-compose` — Create a spawn prompt from persona layers
- `/sniper-status` — Show lifecycle status and artifact state

## Agent Teams Rules
When spawning teammates, always:
1. Read the relevant team YAML from `.sniper/teams/`
2. Compose spawn prompts using `/sniper-compose` with the layers specified in the YAML
3. Assign file ownership boundaries from `config.yaml` ownership rules
4. Create tasks with dependencies from the team YAML
5. Enter delegate mode (Shift+Tab) — the lead coordinates, it does not code
6. Require plan approval for tasks marked `plan_approval: true`
7. When a phase completes, run `/sniper-review` before advancing

## Code Standards
See `.sniper/config.yaml` → stack section for language/framework specifics.
```

---

## 7. CONFIGURATION SYSTEM

`.sniper/config.yaml`:

```yaml
# ─────────────────────────────────────────
# SNIPER Framework Configuration
# ─────────────────────────────────────────

project:
  name: ""                         # Set by /sniper-init
  type: saas                       # saas | api | mobile | cli | library | monorepo
  description: ""                  # One-line project description

stack:
  language: typescript             # Primary language
  frontend: react                  # Frontend framework (null if none)
  backend: node-express            # Backend framework
  database: postgresql             # Primary database
  cache: redis                     # Cache layer (null if none)
  infrastructure: aws              # Cloud provider
  test_runner: vitest              # Test framework
  package_manager: pnpm            # Package manager

# ─────────────────────────────────────────
# Review Gate Configuration
# ─────────────────────────────────────────
# strict  = full stop, human must approve before next phase
# flexible = auto-advance, human reviews async
# auto    = no gate (not recommended for architecture/implementation)

review_gates:
  after_discover: flexible         # Low risk — auto-advance
  after_plan: strict               # HIGH RISK — bad architecture cascades
  after_solve: flexible            # Low risk — stories can be refined later
  after_sprint: strict             # HIGH RISK — code must be reviewed before merge

# ─────────────────────────────────────────
# Agent Teams Configuration
# ─────────────────────────────────────────

agent_teams:
  max_teammates: 5                 # Max concurrent teammates (token budget)
  default_model: sonnet            # sonnet | opus — for implementation
  planning_model: opus             # Use Opus for planning & architecture
  delegate_mode: true              # Lead enters delegate mode during team execution
  plan_approval: true              # Require plan approval for complex/risky tasks
  coordination_timeout: 30         # Minutes before lead checks on stalled teammates

# ─────────────────────────────────────────
# Domain Pack
# ─────────────────────────────────────────

domain_pack: null                  # Set to pack name (e.g., "sales-dialer")

# ─────────────────────────────────────────
# File Ownership Rules
# ─────────────────────────────────────────
# These are injected into spawn prompts to prevent teammates from editing
# each other's files. Customize per project.

ownership:
  backend:
    - "src/backend/"
    - "src/api/"
    - "src/services/"
    - "src/db/"
    - "src/workers/"
  frontend:
    - "src/frontend/"
    - "src/components/"
    - "src/hooks/"
    - "src/styles/"
    - "src/pages/"
  infrastructure:
    - "docker/"
    - ".github/"
    - "infra/"
    - "terraform/"
    - "scripts/"
  tests:
    - "tests/"
    - "__tests__/"
    - "*.test.*"
    - "*.spec.*"
  docs:
    - "docs/"

# ─────────────────────────────────────────
# Lifecycle State (managed by SNIPER, don't edit manually)
# ─────────────────────────────────────────

state:
  current_phase: null              # discover | plan | solve | sprint
  phase_history: []                # [{phase, started_at, completed_at, approved_by}]
  current_sprint: 0
  artifacts:
    brief: null                    # null | draft | approved
    prd: null
    architecture: null
    ux_spec: null
    security: null
    epics: null
    stories: null
```

---

## 8. THE PERSONA COMPOSITION SYSTEM

### 8.1 Core Innovation

This is what makes SNIPER different from everything else. Instead of monolithic persona files, spawn prompts are **composed** from up to four independent layers:

```
Spawn Prompt = Process Layer + Technical Layer + Cognitive Layer + Domain Layer
                (BMAD)          (VoltAgent)      (SuperClaude)    (User/Pack)
```

Not every layer is required. A discovery-phase analyst might only need Process + Cognitive + Domain (no Technical layer). A sprint-phase backend developer needs all four.

### 8.2 The `/sniper-compose` Command

```bash
/sniper-compose --process architect --technical backend --cognitive security-first \
                --domain sales-dialer/telephony --name "Backend Architect"
```

This reads each layer file and merges them using `.sniper/spawn-prompts/_template.md`:

### 8.3 Spawn Prompt Template

`.sniper/spawn-prompts/_template.md`:

```markdown
# Teammate: {name}

## Your Role in the Lifecycle
{content from .sniper/personas/process/{process}.md}

## Technical Expertise
{content from .sniper/personas/technical/{technical}.md — or "General" if null}

## How You Think
{content from .sniper/personas/cognitive/{cognitive}.md}

## Domain Context
{content from .sniper/domain-packs/{domain_pack}/context/{domain}.md — or omitted if null}

## Rules for This Session
- You own these directories ONLY: {ownership from config.yaml}
- Do NOT modify files outside your ownership boundaries
- Read the relevant artifact files before starting (listed in your tasks)
- Message teammates directly when you need alignment (especially on API contracts)
- Message the team lead when: you're blocked, you've completed a task, or you need a decision
- Write all outputs to the file paths specified in your tasks
- If a task has `plan_approval: true`, describe your approach and wait for approval before executing
```

### 8.4 Layer 1: Process Personas

Each file defines the agent's **lifecycle role** — what they do, what they produce, what they read, how they hand off work.

**Example: `.sniper/personas/process/architect.md`**

```markdown
# Architect (Process Layer)

## Role
You are the System Architect. You design the technical architecture for the entire system
and produce a comprehensive Architecture Document.

## Lifecycle Position
- **Phase:** Plan (Phase 2)
- **Reads:** Project Brief (`docs/brief.md`), PRD (`docs/prd.md`)
- **Produces:** Architecture Document (`docs/architecture.md`)
- **Hands off to:** Scrum Master (who shards your architecture into epics and stories)

## Responsibilities
1. Define the system's component architecture and their boundaries
2. Choose technologies with documented rationale for each choice
3. Design data models, database schema, and migration strategy
4. Define API contracts (endpoints, payloads, auth) as the interface between frontend/backend
5. Design infrastructure topology (compute, storage, networking, scaling)
6. Identify cross-cutting concerns (logging, monitoring, error handling, auth)
7. Document non-functional requirements (performance targets, SLAs, security)

## Output Format
Follow the template at `.sniper/templates/architecture.md`. Every section must be filled.
Include diagrams as ASCII or Mermaid where they add clarity.

## Artifact Quality Rules
- Every technology choice must include: what, why, and what alternatives were considered
- API contracts must be specific enough that frontend and backend can implement independently
- Data models must include field types, constraints, indexes, and relationships
- Infrastructure must specify instance sizes, scaling triggers, and cost estimates
```

### 8.5 Layer 2: Technical Personas

Each file defines **deep technical knowledge** about specific technologies and frameworks.

**Example: `.sniper/personas/technical/backend.md`**

```markdown
# Backend Specialist (Technical Layer)

## Core Expertise
Node.js/TypeScript backend development with production-grade patterns:
- Express or Fastify with structured middleware chains
- TypeScript with strict mode, barrel exports, path aliases
- PostgreSQL with Prisma or Drizzle ORM (migrations, seeding, query optimization)
- Redis for caching, session storage, and pub/sub
- Bull/BullMQ for job queues and background processing
- WebSocket (ws or Socket.io) for real-time communication
- JWT + refresh token auth with bcrypt password hashing

## Architectural Patterns
- Repository pattern for data access
- Service layer for business logic (never in controllers)
- Dependency injection (manual or with tsyringe/awilix)
- Error handling: custom error classes, centralized error middleware
- Request validation with Zod schemas
- API versioning via URL prefix (/api/v1/)

## Testing
- Unit tests for service layer (vitest/jest)
- Integration tests for API endpoints (supertest)
- Database tests with test containers or in-memory PG
- Minimum 80% coverage for new code

## Code Standards
- ESLint + Prettier, enforced in CI
- Conventional commits
- No `any` types — strict TypeScript
- All async functions must have error handling
- Environment variables via validated config module (never raw process.env)
```

### 8.6 Layer 3: Cognitive Modes

Each file defines **how the agent thinks** — its mental model and decision-making framework.

**Example: `.sniper/personas/cognitive/security-first.md`**

```markdown
# Security-First (Cognitive Layer)

## Thinking Pattern
Every technical decision is evaluated through a security lens FIRST, then optimized
for other concerns. You don't bolt security on at the end — it's in the foundation.

## Decision Framework
For every component, API, or data flow you encounter, ask:
1. What's the threat model? (Who could attack this, how, and what would they gain?)
2. What's the blast radius? (If compromised, what else is exposed?)
3. What's the least privilege? (Does this component need all the access it has?)
4. What's the encryption story? (At rest, in transit, in processing?)
5. What's the auth boundary? (How is identity verified at this point?)

## Priority Hierarchy
1. Security correctness (no vulnerabilities)
2. Data protection (encryption, access control, audit logging)
3. Compliance (regulatory requirements met)
4. Functionality (it works)
5. Performance (it's fast)

## What You Flag
- Any endpoint without authentication → BLOCK
- Any PII stored unencrypted → BLOCK
- Any secret in code/config → BLOCK
- Missing input validation → WARN
- Overly permissive CORS → WARN
- Missing rate limiting → WARN
- Missing audit logging for sensitive operations → WARN
```

### 8.7 Layer 4: Domain Context

Project-specific knowledge loaded from Domain Packs. See Section 12-13.

### 8.8 Composed Example

What the final spawn prompt looks like after composition:

```markdown
# Teammate: Backend Architect (Security-First, Telephony Domain)

## Your Role in the Lifecycle
You are the System Architect. You design the technical architecture for the entire
system and produce a comprehensive Architecture Document at `docs/architecture.md`.
You read the Project Brief and PRD. You hand off to the Scrum Master.
[... full process layer content ...]

## Technical Expertise
Node.js/TypeScript backend development with production-grade patterns.
Express/Fastify, PostgreSQL with Prisma/Drizzle, Redis, WebSockets, Bull queues.
[... full technical layer content ...]

## How You Think
Every technical decision is evaluated through a security lens FIRST.
For every component: threat model, blast radius, least privilege, encryption, auth.
[... full cognitive layer content ...]

## Domain Context: Telephony
Twilio Programmable Voice SDK, WebRTC browser-based calling, TwiML call flows,
multi-line dialing architecture, voicemail detection (AMD), call recording and storage.
[... full domain context ...]

## Rules for This Session
- You own: docs/ (architecture artifacts only)
- Read docs/brief.md and docs/prd.md before starting
- Message security-analyst teammate to align on threat model
- Message team lead when architecture doc is ready for review
- This task has plan_approval: true — describe approach before writing
```

---

## 9. THE LIFECYCLE: PHASES & AGENT TEAMS

### 9.1 Phase Overview

```
┌─────────────────┐   ┌─────────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Phase 1:       │   │  Phase 2:           │   │  Phase 3:        │   │  Phase 4:        │
│  DISCOVER       │──▶│  PLAN               │──▶│  SOLVE           │──▶│  BUILD           │
│  (Navigate)     │   │  (Implement/Design) │   │  (Implement/Shard)│   │  (Parallelize)   │
├─────────────────┤   ├─────────────────────┤   ├──────────────────┤   ├──────────────────┤
│ Agent Team: 3   │   │ Agent Team: 4       │   │ Single Agent     │   │ Agent Team: 4-5  │
│ Parallel        │   │ Parallel + Messaging│   │ Sequential       │   │ Parallel Sprint  │
├─────────────────┤   ├─────────────────────┤   ├──────────────────┤   ├──────────────────┤
│ Analyst         │   │ Product Manager     │   │ Scrum Master     │   │ Backend Dev      │
│ Researcher      │   │ Architect       ◄──►│   │ (reads all Phase │   │ Frontend Dev     │
│ User Researcher │   │ UX Designer     ◄──►│   │  2 artifacts)    │   │ Infra Dev        │
│                 │   │ Security Analyst ◄──►│   │                  │   │ QA Engineer      │
├─────────────────┤   ├─────────────────────┤   ├──────────────────┤   ├──────────────────┤
│ Output:         │   │ Output:             │   │ Output:          │   │ Output:          │
│ docs/brief.md   │   │ docs/prd.md         │   │ docs/epics/*.md  │   │ src/**           │
│ docs/risks.md   │   │ docs/architecture.md│   │ docs/stories/*.md│   │ tests/**         │
│ docs/personas.md│   │ docs/ux-spec.md     │   │                  │   │                  │
│                 │   │ docs/security.md    │   │                  │   │                  │
├─────────────────┤   ├─────────────────────┤   ├──────────────────┤   ├──────────────────┤
│ Gate: FLEXIBLE  │   │ Gate: STRICT        │   │ Gate: FLEXIBLE   │   │ Gate: STRICT     │
│ (auto-advance)  │   │ (human approval)    │   │ (auto-advance)   │   │ (human review)   │
└─────────────────┘   └─────────────────────┘   └──────────────────┘   └──────────────────┘
```

### 9.2 Phase 1: DISCOVER (Navigate)

**Goal:** Understand the problem, market, users, risks, and feasibility.
**Execution:** Parallel Agent Team (3 teammates)
**Review Gate:** FLEXIBLE (auto-advance, human reviews async)

**Team YAML** (`.sniper/teams/discover.yaml`):

```yaml
team_name: sniper-discover
phase: discover

teammates:
  - name: analyst
    compose:
      process: analyst
      technical: null
      cognitive: systems-thinker
      domain: null   # Uses pack default context
    tasks:
      - id: market-research
        name: "Market Research & Competitive Analysis"
        output: "docs/brief.md"
        template: ".sniper/templates/brief.md"
        description: >
          Research the market landscape. Identify competitors, their features,
          pricing, and positioning. Define the project's unique value proposition.
          Use the domain pack context for industry-specific knowledge.

  - name: risk-researcher
    compose:
      process: analyst
      technical: infrastructure   # Needs technical context for feasibility
      cognitive: devils-advocate
      domain: null
    tasks:
      - id: risk-assessment
        name: "Technical Feasibility & Risk Assessment"
        output: "docs/risks.md"
        description: >
          Assess technical feasibility, integration risks, compliance hurdles,
          and scalability challenges. Challenge optimistic assumptions.
          Be specific about what could go wrong and mitigation strategies.

  - name: user-researcher
    compose:
      process: analyst
      technical: null
      cognitive: user-empathetic
      domain: null
    tasks:
      - id: user-personas
        name: "User Persona & Journey Mapping"
        output: "docs/personas.md"
        description: >
          Define 2-4 user personas with goals, pain points, and workflows.
          Map the primary user journey for each persona.
          Identify key moments of friction and delight.

coordination: []   # No inter-teammate messaging needed — parallel independent work

review_gate:
  checklist: ".sniper/checklists/discover-review.md"
  mode: flexible   # Auto-advance
```

### 9.3 Phase 2: PLAN (Implement/Design)

**Goal:** Produce PRD, system architecture, UX specification, security requirements.
**Execution:** Parallel Agent Team (4 teammates) WITH inter-agent messaging
**Review Gate:** STRICT (human MUST approve architecture before Phase 3)

**Team YAML** (`.sniper/teams/plan.yaml`):

```yaml
team_name: sniper-plan
phase: plan
model_override: opus   # Use Opus for planning — higher quality, worth the cost

teammates:
  - name: product-manager
    compose:
      process: product-manager
      technical: api-design       # PM understands API surface
      cognitive: systems-thinker
      domain: null                # Full pack context
    tasks:
      - id: prd
        name: "Product Requirements Document"
        output: "docs/prd.md"
        template: ".sniper/templates/prd.md"
        reads: ["docs/brief.md", "docs/personas.md", "docs/risks.md"]
        description: >
          Write a comprehensive PRD covering: problem statement, user stories,
          feature requirements (P0/P1/P2), success metrics, constraints,
          and out-of-scope items. This is the single source of truth for what to build.

  - name: architect
    compose:
      process: architect
      technical: backend
      cognitive: security-first
      domain: [telephony, ai-pipeline]  # Multiple domain context files
    tasks:
      - id: architecture
        name: "System Architecture Document"
        output: "docs/architecture.md"
        template: ".sniper/templates/architecture.md"
        reads: ["docs/prd.md", "docs/brief.md", "docs/risks.md"]
        blocked_by: [prd]
        plan_approval: true       # MUST describe approach before writing
        description: >
          Design the complete system architecture. Include: component diagram,
          data models, API contracts, infrastructure topology, technology choices
          with rationale, and non-functional requirements.

  - name: ux-designer
    compose:
      process: ux-designer
      technical: frontend
      cognitive: user-empathetic
      domain: [sales-workflows]
    tasks:
      - id: ux-spec
        name: "UX Specification"
        output: "docs/ux-spec.md"
        template: ".sniper/templates/ux-spec.md"
        reads: ["docs/prd.md", "docs/personas.md"]
        blocked_by: [prd]
        description: >
          Define the UX: information architecture, screen inventory,
          key user flows (with decision trees), component hierarchy,
          interaction patterns, and responsive breakpoints.

  - name: security-analyst
    compose:
      process: architect          # Uses architect process (produces design artifact)
      technical: security
      cognitive: security-first
      domain: [compliance]
    tasks:
      - id: security
        name: "Security & Compliance Requirements"
        output: "docs/security.md"
        reads: ["docs/prd.md", "docs/risks.md"]
        blocked_by: [prd]
        description: >
          Define security architecture: auth model, data encryption strategy,
          compliance requirements (with specific regulations), threat model,
          and security testing requirements.

coordination:
  - between: [architect, security-analyst]
    topic: "Align security architecture with system architecture"
  - between: [architect, ux-designer]
    topic: "Align frontend component boundaries with backend API contracts"

review_gate:
  checklist: ".sniper/checklists/plan-review.md"
  mode: strict   # HUMAN MUST APPROVE before Phase 3
```

### 9.4 Phase 3: SOLVE (Epic Sharding & Stories)

**Goal:** Break the PRD and architecture into implementable epics and stories.
**Execution:** Single agent (NOT a team) — consistency matters more than speed here.
**Review Gate:** FLEXIBLE (auto-advance, human reviews stories async)

```yaml
team_name: null   # No team — single agent execution
phase: solve

agent:
  compose:
    process: scrum-master
    technical: null           # Reads architecture doc for technical context
    cognitive: systems-thinker
    domain: null
  reads:
    - "docs/prd.md"
    - "docs/architecture.md"
    - "docs/ux-spec.md"
    - "docs/security.md"

  tasks:
    - id: epic-sharding
      name: "Epic Sharding"
      output: "docs/epics/"
      description: >
        Break the PRD into 6-12 epics. Each epic file must include:
        - Scope and clear boundaries (what's in, what's out)
        - Relevant sections from architecture doc (EMBEDDED, not just referenced)
        - Dependencies on other epics
        - Acceptance criteria for the epic as a whole
        - Estimated total story points
        Use template at .sniper/templates/epic.md

    - id: story-creation
      name: "Story Creation"
      output: "docs/stories/"
      blocked_by: [epic-sharding]
      description: >
        For each epic, create 3-8 stories. Each story file must include:
        - Full context from PRD + Architecture (EMBEDDED in the story file)
        - Acceptance criteria as testable assertions
        - Test requirements (unit, integration, e2e as applicable)
        - File ownership (which directories this story's implementation touches)
        - Dependencies on other stories
        - Complexity estimate (S/M/L/XL)
        Use template at .sniper/templates/story.md

        CRITICAL: Stories must be self-contained. A teammate reading ONLY the story
        file must have enough context to implement it without reading any other docs.
        This is why PRD/Architecture context is embedded, not referenced.

review_gate:
  checklist: ".sniper/checklists/story-review.md"
  mode: flexible
```

### 9.5 Phase 4: BUILD (Sprint Cycle)

**Goal:** Implement stories in parallel sprints using Agent Teams.
**Execution:** Parallel Agent Team (4-5 teammates per sprint)
**Review Gate:** STRICT (human reviews code, merges PR)

**Sprint Template** (`.sniper/teams/sprint.yaml`):

```yaml
team_name: "sniper-sprint-{number}"
phase: build

# Teammates populated dynamically based on selected stories
# These are the available roles — the /sniper-sprint command selects which to spawn

available_teammates:
  - name: backend-dev
    compose:
      process: developer
      technical: backend
      cognitive: systems-thinker  # Can be overridden per sprint
      domain: null                # Set based on stories assigned
    owns_from_config: backend     # References ownership.backend in config.yaml
    model: sonnet

  - name: frontend-dev
    compose:
      process: developer
      technical: frontend
      cognitive: user-empathetic
      domain: null
    owns_from_config: frontend
    model: sonnet

  - name: infra-dev
    compose:
      process: developer
      technical: infrastructure
      cognitive: systems-thinker
      domain: null
    owns_from_config: infrastructure
    model: sonnet

  - name: ai-dev
    compose:
      process: developer
      technical: ai-ml
      cognitive: performance-focused
      domain: null
    owns_from_config: backend     # AI code lives in backend
    model: opus                   # Use Opus for complex AI pipeline work

  - name: qa-engineer
    compose:
      process: qa-engineer
      technical: backend          # Can be overridden to frontend
      cognitive: devils-advocate
      domain: null
    owns_from_config: tests
    model: sonnet

sprint_rules:
  - "Each teammate reads their assigned story file(s) COMPLETELY before writing any code"
  - "Backend and frontend must agree on API contracts via inter-agent messaging BEFORE implementing"
  - "All new code must include tests — no story is complete without passing tests"
  - "QA engineer is blocked until implementation stories are complete"
  - "Every teammate messages the team lead when their task is complete"
  - "If any teammate is blocked for > 10 minutes, message the lead immediately"

coordination:
  - between: [backend-dev, frontend-dev]
    topic: "API contracts — agree on endpoints, payloads, and auth before coding"
  - between: [backend-dev, ai-dev]
    topic: "AI pipeline integration points — data flow, WebSocket events, API boundaries"
  - between: [backend-dev, qa-engineer]
    topic: "Share testable endpoints as they're completed"

review_gate:
  checklist: ".sniper/checklists/sprint-review.md"
  mode: strict   # Human reviews code, runs tests, merges PR
```

---

## 10. SLASH COMMANDS

### `/sniper-init`
Initialize SNIPER in a new or existing project.

**What it does:**
1. Creates the `.sniper/` directory structure
2. Prompts for project config (name, type, stack, domain pack)
3. Generates `config.yaml` with answers
4. Installs all default persona layers (process, technical, cognitive)
5. Installs the spawn prompt template
6. Installs all team YAML definitions
7. Installs artifact templates and checklists
8. Installs the specified domain pack (if any)
9. Creates the lean `CLAUDE.md`
10. Creates `.claude/commands/sniper-*.md` slash commands
11. Prints a summary and next steps

### `/sniper-compose`
Compose a spawn prompt from persona layers.

**Usage:**
```
/sniper-compose --process architect --technical backend --cognitive security-first \
                --domain telephony --name "Backend Architect"
```

**What it does:**
1. Reads each specified layer file from `.sniper/personas/`
2. Reads domain context from the active domain pack
3. Merges them using `.sniper/spawn-prompts/_template.md`
4. Reads ownership rules from `config.yaml`
5. Outputs the composed prompt to `.sniper/spawn-prompts/{name}.md`
6. Displays a preview for human review

### `/sniper-discover`
Run Phase 1: Discovery & Analysis.

**What it does:**
1. Pre-flight: Check that `/sniper-init` has been run
2. Read `.sniper/teams/discover.yaml`
3. For each teammate: run `/sniper-compose` with the specified layers
4. Create an Agent Team called `sniper-discover`
5. Create tasks in the shared task list with dependencies from the YAML
6. Spawn each teammate with their composed prompt
7. Enter delegate mode (Shift+Tab)
8. Monitor progress — when all tasks complete:
   - If gate is `flexible`: auto-advance, note artifacts for async review
   - If gate is `strict`: present artifacts and wait for human approval
9. Update `config.yaml` state

### `/sniper-plan`
Run Phase 2: Planning & Architecture.

**What it does:**
1. Pre-flight: Verify Phase 1 artifacts exist (`docs/brief.md`, etc.)
2. Same team creation flow as `/sniper-discover` but with `plan.yaml`
3. Uses `model_override: opus` from the YAML
4. Enables inter-agent messaging for coordination pairs
5. Requires plan approval for architect task
6. **ALWAYS stops for human review** (strict gate, non-negotiable)

### `/sniper-solve`
Run Phase 3: Epic Sharding & Story Creation.

**What it does:**
1. Pre-flight: Verify Phase 2 artifacts exist AND are approved
2. Does NOT create an Agent Team — runs as single agent
3. Loads the scrum-master persona
4. Reads all Phase 2 artifacts
5. Creates epics, then creates stories for each epic
6. Self-reviews stories against checklist
7. Auto-advances (flexible gate)

### `/sniper-sprint`
Run Phase 4: Implementation Sprint.

**What it does:**
1. Pre-flight: Verify stories exist
2. Prompt human to select stories for this sprint (or read from a sprint backlog file)
3. Determine which teammates are needed based on story file ownership
4. Compose spawn prompts for each needed teammate
5. Include the full story file content in each teammate's spawn prompt
6. Create an Agent Team called `sniper-sprint-{N}`
7. Create tasks with dependencies (e.g., QA blocked by implementation)
8. Spawn teammates, enter delegate mode
9. Facilitate API contract alignment between backend/frontend via messaging
10. When complete, **ALWAYS stops for human review** (strict gate)
11. Presents code diff summary and test results

### `/sniper-review`
Run the review gate for the current phase.

**What it does:**
1. Identifies current phase from `config.yaml` state
2. Reads the appropriate checklist from `.sniper/checklists/`
3. Evaluates each artifact against checklist criteria
4. Reports: ✅ PASS / ⚠️ WARN / ❌ FAIL for each item
5. On all-pass: marks phase as approved in config state
6. On any fail: reports specific issues and blocks advancement

### `/sniper-status`
Show lifecycle status.

**What it does:**
1. Reads `config.yaml` state section
2. Shows: current phase, artifact status (draft/approved), sprint count
3. Shows: which stories are complete/in-progress/pending
4. Shows: estimated remaining work

---

## 11. REVIEW GATES (FLEXIBLE MODE)

SNIPER uses a two-tier gate system matching your preference:

### Strict Gates (Human MUST approve)
Applied to: `after_plan` and `after_sprint`

**Behavior:**
- Team execution stops completely
- All artifacts are presented to the human
- Checklist is run and results shown
- Human must explicitly type "approved" or provide feedback
- On feedback: relevant teammates can be re-spawned to address issues
- Phase state only advances on explicit approval

### Flexible Gates (Auto-advance, async review)
Applied to: `after_discover` and `after_solve`

**Behavior:**
- Artifacts are generated and checklist is self-evaluated
- If self-evaluation passes, phase auto-advances
- Artifacts are flagged for "async human review" in the status
- Human can review at any time with `/sniper-review`
- If human finds issues, they can re-run the phase or manually edit artifacts
- Development is not blocked

### Why This Split Works
- **Discovery** (flexible): Low risk. Bad research can be caught during planning. Better to move fast.
- **Planning** (strict): HIGH RISK. A bad architecture poisons everything downstream. Worth stopping.
- **Solve** (flexible): Stories can be refined during sprint. Not worth blocking for perfect stories.
- **Sprint** (strict): Code must be reviewed before merging. Non-negotiable.

---

## 12. DOMAIN PACKS

### 12.1 What They Are

Domain Packs are installable bundles of project-specific knowledge that teach SNIPER agents about a particular industry, technology stack, or problem domain. They plug into Layer 4 of the persona composition system.

### 12.2 Pack Structure

```
.sniper/domain-packs/{pack-name}/
├── pack.yaml                    # Metadata: name, description, version, author
├── context/                     # Domain knowledge files (loaded into Layer 4)
│   ├── {topic-1}.md
│   ├── {topic-2}.md
│   └── ...
├── templates/                   # Domain-specific artifact templates (optional)
│   └── ...
├── checklists/                  # Domain-specific review gates (optional)
│   └── ...
└── suggested-epics.md           # Pre-defined epic structure (optional)
```

### 12.3 pack.yaml

```yaml
name: sales-dialer
version: 1.0.0
description: "AI-powered sales dialer SaaS — telephony, CRM, compliance, AI coaching"
author: "Taranveer"

# Which context files exist in this pack
contexts:
  - telephony          # Twilio, WebRTC, call routing
  - sales-workflows    # Dialer types, cadences, dispositions
  - compliance         # TCPA, DNC, recording consent
  - crm-integration    # Salesforce, HubSpot APIs
  - ai-pipeline        # STT, sentiment, coaching, scoring
  - analytics          # Call metrics, dashboards, KPIs

# Default context for agents that don't specify a domain file
default_context: sales-workflows

# Recommended team overrides for this domain
team_overrides:
  plan:
    # Add an extra teammate for this domain
    extra_teammates:
      - name: compliance-analyst
        compose:
          process: architect
          technical: security
          cognitive: security-first
          domain: compliance
        tasks:
          - id: compliance-reqs
            name: "Regulatory Compliance Requirements"
            output: "docs/compliance.md"
            reads: ["docs/prd.md"]
            blocked_by: [prd]
```

### 12.4 Future Domain Packs (Validates Project-Agnosticism)

| Pack | Industry | Key Contexts |
|------|----------|-------------|
| `fintech` | Financial services | Payment rails, PCI-DSS, KYC/AML, ledger systems |
| `healthcare` | Health tech | HIPAA, HL7/FHIR, PHI handling, telehealth |
| `devtool` | Developer tools | CLI design, SDK patterns, API documentation, DX |
| `marketplace` | Two-sided platforms | Matching algorithms, trust/safety, payments, reviews |
| `ai-saas` | AI-powered SaaS | LLM integration, prompt management, token economics |

---

## 13. DOMAIN PACK: AI SALES DIALER

The first pack, built alongside the framework to validate the design.

### 13.1 Context Files

**`context/telephony.md`** — Key topics:
- Twilio Programmable Voice SDK (Node.js): making calls, receiving calls, call control
- TwiML: `<Dial>`, `<Say>`, `<Record>`, `<Gather>`, `<Conference>`
- StatusCallback webhooks: call state transitions, call events
- WebRTC: browser-based calling, Twilio Client SDK
- Multi-line dialing: parallel call placement, connect-on-answer, queue management
- Voicemail detection: Answering Machine Detection (AMD), beep detection
- Call recording: dual-channel recording, storage (S3), encryption at rest
- DTMF handling: keypad inputs for IVR and navigation
- Number management: provisioning, caller ID, local presence dialing
- SIP: trunking basics, SRTP, NAT traversal

**`context/sales-workflows.md`** — Key topics:
- Power dialer: sequential auto-dial, one call at a time, agent always on
- Parallel dialer: multiple simultaneous calls, connect first live answer to agent
- Predictive dialer: algorithm-based multi-line, adjusts dial ratio to minimize idle time
- Cadences: multi-touch sequences (call → email → LinkedIn → call → email)
- Disposition workflows: connected / voicemail / no answer / busy / DNC / callback
- Contact queue management: list upload, priority sorting, timezone-aware filtering
- SDR workflows: prospect research, talk tracks, objection handling
- Manager features: live monitoring, whisper coaching, barge-in, call takeover
- Voicemail drop: pre-recorded messages, one-click drop during ringing
- Local presence: matching caller ID to prospect's area code

**`context/compliance.md`** — Key topics:
- TCPA (Telephone Consumer Protection Act): calling hours (8am-9pm local), express consent requirements, auto-dialer rules, cell phone vs landline rules
- DNC (Do Not Call) lists: national DNC, state DNC, internal DNC, DNC scrubbing before dialing
- Call recording consent: one-party states vs two-party states (complete list), required disclosures, recording notification requirements
- FCC telemarketing rules: caller ID requirements, abandoned call limits (3%), ring time requirements
- GDPR: international prospect data handling, right to erasure, consent management
- SOC 2: data security controls, access logging, encryption, annual audits
- PCI-DSS: if handling payment data, tokenization, secure fields

**`context/crm-integration.md`** — Key topics:
- Salesforce: REST API (CRUD), Bulk API 2.0 (mass data sync), Streaming API (CDC), Connected Apps / OAuth2, standard objects (Lead, Contact, Account, Opportunity, Task, Activity), custom fields and objects
- HubSpot: API v3, contacts, deals, engagements API, timeline API, custom events, OAuth2 private app flow
- Bi-directional sync: webhook-based real-time sync, batch sync for historical data, conflict resolution (CRM-wins vs dialer-wins), dedup strategies
- Activity logging: auto-log calls as activities/tasks, call recording links, disposition mapping to CRM fields, notes and next steps
- Field mapping: configurable per-tenant, custom field support, data transformation rules

**`context/ai-pipeline.md`** — Key topics:
- Real-time STT: Deepgram (streaming WebSocket API), AssemblyAI (real-time), OpenAI Whisper (batch)
- Audio streaming architecture: browser → WebSocket → STT service → transcript events
- Sentiment analysis: per-utterance sentiment, rolling conversation sentiment, trigger thresholds
- Call scoring: configurable rubric (opening, discovery, objection handling, closing), ML model training with human-labeled data, real-time vs post-call scoring
- Real-time coaching: talk ratio monitoring (agent vs prospect), filler word detection, pace/speed alerts, objection detection with suggested responses, coaching prompts via WebSocket to agent UI
- Post-call intelligence: call summarization (LLM), action item extraction, follow-up recommendations, deal risk signals
- Voicemail detection with ML: audio classification (human vs machine vs silence), AMD accuracy tuning (speed vs accuracy tradeoff)

**`context/analytics.md`** — Key topics:
- Call metrics: connect rate, talk time (avg/median), calls per hour, disposition breakdown, voicemail drop rate, callback conversion
- Rep performance: daily/weekly scorecards, talk ratio trends, sentiment trends, score progression
- Team/manager views: team leaderboard, coaching opportunities (low scores), activity compliance
- Pipeline attribution: calls → meetings booked → opportunities → closed/won, marketing lead source tracking through dialer
- Time-series data: InfluxDB/TimescaleDB or PostgreSQL with time partitioning, granularity (minute for real-time, hour for dashboards, day for reports)
- Dashboard implementation: React + Recharts or Tremor, real-time via WebSocket, configurable date ranges and filters

---

## 14. IMPLEMENTATION PLAN

### 14.1 Phase 0: Bootstrap the Framework (Target: 1 Week)

Build SNIPER itself. This is manual work — you're building the tool before using it.

**Milestone 0.1: Core Structure (Day 1-2)**

| # | Task | Output File(s) |
|---|------|----------------|
| 0.1.1 | Create `.sniper/` directory structure | Directory tree |
| 0.1.2 | Write `config.yaml` schema with defaults | `.sniper/config.yaml` |
| 0.1.3 | Write the lean CLAUDE.md | `CLAUDE.md` |
| 0.1.4 | Write spawn prompt template | `.sniper/spawn-prompts/_template.md` |

**Milestone 0.2: Persona Layers (Day 2-3)**

| # | Task | Source | Output |
|---|------|--------|--------|
| 0.2.1 | Write 7 process personas | Extract from BMAD agent definitions | `.sniper/personas/process/*.md` |
| 0.2.2 | Write 7 technical personas | Extract from VoltAgent subagents | `.sniper/personas/technical/*.md` |
| 0.2.3 | Write 6 cognitive modes | Extract from SuperClaude personas | `.sniper/personas/cognitive/*.md` |

**Milestone 0.3: Team Definitions & Templates (Day 3-4)**

| # | Task | Output |
|---|------|--------|
| 0.3.1 | Write 4 team YAML files | `.sniper/teams/*.yaml` |
| 0.3.2 | Write 4 workflow orchestration docs | `.sniper/workflows/*.md` |
| 0.3.3 | Write 7 artifact templates | `.sniper/templates/*.md` |
| 0.3.4 | Write 5 review gate checklists | `.sniper/checklists/*.md` |

**Milestone 0.4: Slash Commands (Day 4-5)**

| # | Task | Output |
|---|------|--------|
| 0.4.1 | Write `/sniper-init` command | `.claude/commands/sniper-init.md` |
| 0.4.2 | Write `/sniper-compose` command | `.claude/commands/sniper-compose.md` |
| 0.4.3 | Write `/sniper-discover` command | `.claude/commands/sniper-discover.md` |
| 0.4.4 | Write `/sniper-plan` command | `.claude/commands/sniper-plan.md` |
| 0.4.5 | Write `/sniper-solve` command | `.claude/commands/sniper-solve.md` |
| 0.4.6 | Write `/sniper-sprint` command | `.claude/commands/sniper-sprint.md` |
| 0.4.7 | Write `/sniper-review` command | `.claude/commands/sniper-review.md` |
| 0.4.8 | Write `/sniper-status` command | `.claude/commands/sniper-status.md` |

**Milestone 0.5: Sales Dialer Domain Pack (Day 5-6)**

| # | Task | Output |
|---|------|--------|
| 0.5.1 | Write `pack.yaml` | `.sniper/domain-packs/sales-dialer/pack.yaml` |
| 0.5.2 | Write telephony context | `.sniper/domain-packs/sales-dialer/context/telephony.md` |
| 0.5.3 | Write sales workflows context | `.sniper/domain-packs/sales-dialer/context/sales-workflows.md` |
| 0.5.4 | Write compliance context | `.sniper/domain-packs/sales-dialer/context/compliance.md` |
| 0.5.5 | Write CRM integration context | `.sniper/domain-packs/sales-dialer/context/crm-integration.md` |
| 0.5.6 | Write AI pipeline context | `.sniper/domain-packs/sales-dialer/context/ai-pipeline.md` |
| 0.5.7 | Write analytics context | `.sniper/domain-packs/sales-dialer/context/analytics.md` |
| 0.5.8 | Write suggested epics | `.sniper/domain-packs/sales-dialer/suggested-epics.md` |

**Milestone 0.6: Integration Testing (Day 6-7)**

| # | Task | Method |
|---|------|--------|
| 0.6.1 | Test `/sniper-init` end-to-end | Run in a fresh directory |
| 0.6.2 | Test `/sniper-compose` with all layer combinations | Verify prompt output quality |
| 0.6.3 | Test a mini-discovery phase with Agent Teams | Spawn 2 teammates, verify task flow |
| 0.6.4 | Fix any issues discovered | Iterate |

### 14.2 Phase 1: Validate with Sales Dialer (Weeks 2-4)

Use SNIPER to build the actual sales dialer project. This is the validation run.

```
Week 2:
  /sniper-init → config project
  /sniper-discover → 3 parallel teammates → brief, risks, personas
  [Review async]
  /sniper-plan → 4 parallel teammates → PRD, architecture, UX, security
  [REVIEW GATE — human approves architecture]

Week 3:
  /sniper-solve → Scrum Master creates epics & stories
  [Review async]
  /sniper-sprint (Sprint 1) → 4 teammates → Project setup + Telephony core
  [REVIEW GATE — human reviews code]

Week 4:
  /sniper-sprint (Sprint 2) → 4 teammates → Contact management + CRM integration
  [REVIEW GATE]
  /sniper-sprint (Sprint 3) → 4 teammates → AI pipeline + Dialer UI
  [REVIEW GATE]
```

### 14.3 Phase 2: Validate Project-Agnosticism (Week 5)

Test SNIPER with a completely different project type (e.g., a CLI developer tool or an API service) using no domain pack or a different pack. This validates the framework isn't accidentally coupled to the sales dialer.

### 14.4 Phase 3: Open Source (Week 6+)

- Write README.md with quick-start guide
- Create installation script (or npx installer)
- Write domain pack contribution guide
- Publish to GitHub
- Create 1-2 additional domain packs as examples

---

## 15. FRAMEWORK COMPARISON MATRIX

| Capability | BMAD | VoltAgent | SuperClaude | claude-flow | SNIPER |
|-----------|------|-----------|-------------|-------------|--------|
| Agent Teams native | ❌ | ❌ | ❌ | ❌ | ✅ |
| Parallel team execution | ❌ | ❌ | ❌ | 🔶 External | ✅ |
| Inter-agent messaging | ❌ | ❌ | ❌ | 🔶 External | ✅ |
| Delegate mode | ❌ | ❌ | ❌ | ❌ | ✅ |
| Plan approval | ❌ | ❌ | ❌ | ❌ | ✅ |
| Composable personas | ❌ | ❌ | ❌ | ❌ | ✅ |
| Domain packs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lifecycle phases | ✅ | ❌ | ❌ | ❌ | ✅ |
| Review gates | ✅ | ❌ | ❌ | ❌ | ✅ |
| Artifact-driven | ✅ | ❌ | ❌ | ❌ | ✅ |
| Technical depth | ❌ | ✅ | 🔶 | 🔶 | ✅ |
| Cognitive modes | ❌ | ❌ | ✅ | ❌ | ✅ |
| File ownership rules | ❌ | ❌ | ❌ | ❌ | ✅ |
| Task dependencies | ❌ | ❌ | ❌ | 🔶 | ✅ |
| Project-agnostic | 🔶 | ✅ | ✅ | ✅ | ✅ |
| CLI-native | 🔶 | ✅ | ✅ | ✅ | ✅ |
| Total ✅ | 4 | 2 | 2 | 1 | **16** |

---

## 16. RISKS & MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Agent Teams API changes (experimental) | High | High | Abstract all team interactions behind team YAML definitions. If API changes, only slash commands need updating, not personas or workflows |
| Token costs multiply with N teammates | High | Medium | Configurable `max_teammates` and `model` per role in config. Use Sonnet for implementation, Opus only for planning. Monitor costs per sprint |
| Teammates editing same files = conflicts | High | High | File ownership rules enforced in spawn prompts. Config.yaml defines boundaries. Sprint command validates no overlap before spawning |
| Context loss between phases | Medium | High | Artifact-driven: all context lives in versioned files. Stories embed PRD+architecture context. No phase depends on conversation history |
| Composed spawn prompts too large | Medium | Medium | Template enforces max ~2000 tokens per section. Progressive disclosure — agents read detail docs on demand |
| Framework too complex for small features | Medium | Low | `/sniper-sprint` with `quick-feature.md` workflow skips all planning for a single story. Full lifecycle is optional |
| Agent Teams no session resumption | Medium | Medium | Each phase creates a fresh team. If a sprint fails mid-way, re-run with remaining stories. Completed code is already on disk |
| Domain packs become stale | Low | Medium | Context files are markdown — easy to update. Version in pack.yaml. Community contributions keep them fresh |

---

## 17. SUCCESS CRITERIA

The framework is ready for release when:

1. **Quick Start:** A new developer can `/sniper-init` and have a working project in < 5 minutes
2. **End-to-End:** The sales dialer reaches MVP using SNIPER for the full lifecycle (discover → plan → solve → sprint × N)
3. **Agnostic:** A second, unrelated project works with SNIPER + a different domain pack
4. **Faster:** Sprint velocity with parallel Agent Teams is measurably faster than sequential single-agent development (target: 2x+ for multi-story sprints)
5. **Lean:** Total framework size stays under 50KB (all persona files, templates, configs combined)
6. **Composable:** The same framework serves different team compositions by swapping persona layers and domain packs
7. **Recoverable:** If a sprint fails or an agent produces bad output, recovery takes < 5 minutes (re-run the phase, don't rebuild everything)

---

## APPENDIX A: PERSONA SOURCE EXTRACTION GUIDE

### What to extract from BMAD → Layer 1 (Process)

Source: BMAD V6 `.agent.yaml` files (bmad-code-org GitHub)

Extract for each agent:
- **Role description:** What this agent does in the lifecycle
- **Artifact responsibility:** What files it produces and their expected format
- **Input requirements:** What it needs to read before starting
- **Handoff protocol:** Who it hands off to and what the handoff artifact looks like
- **Quality criteria:** What makes a good output for this role
- **Communication rules:** When to message the lead, when to message teammates

Do NOT extract:
- Character names/personalities (Mary, Winston, etc.) — keep role discipline, drop the fiction
- YAML config structure — SNIPER uses its own format
- Web UI workflows — SNIPER is CLI-native

### What to extract from VoltAgent → Layer 2 (Technical)

Source: VoltAgent/awesome-claude-code-subagents GitHub (categories 01-05)

Extract for each specialist:
- **Technology expertise list:** Specific frameworks, libraries, tools
- **Architectural patterns:** Design patterns this specialist uses
- **Best practices:** Coding standards, testing expectations
- **Anti-patterns:** What this specialist avoids
- **Tool access:** What tools (Read, Write, Bash, etc.) this specialist needs

Do NOT extract:
- YAML frontmatter format — SNIPER uses its own
- Subagent communication protocol — Agent Teams uses direct messaging
- Model routing — SNIPER config controls this

### What to extract from SuperClaude → Layer 3 (Cognitive)

Source: SuperClaude Framework GitHub (MODE_*.md files, persona definitions)

Extract for each cognitive mode:
- **Thinking pattern:** How this mode approaches decisions
- **Priority hierarchy:** What matters most in this mode
- **Decision framework:** Questions to ask for every decision
- **Flag behavior:** What this mode looks for, warns about, blocks on
- **Output modifications:** How outputs change in this mode

Do NOT extract:
- Slash command integration — SNIPER has its own commands
- MCP server configuration — separate concern
- Configuration file structure — SNIPER uses its own

---

## APPENDIX B: COMPLETE FILE INVENTORY

Total files to create for framework + sales dialer domain pack:

| Category | Count | Files |
|----------|-------|-------|
| Config | 2 | `CLAUDE.md`, `.sniper/config.yaml` |
| Process personas | 7 | analyst, product-manager, architect, ux-designer, scrum-master, developer, qa-engineer |
| Technical personas | 7 | backend, frontend, infrastructure, security, ai-ml, database, api-design |
| Cognitive modes | 6 | systems-thinker, security-first, performance-focused, user-empathetic, devils-advocate, mentor-explainer |
| Spawn prompt template | 1 | `_template.md` |
| Team definitions | 4 | discover, plan, solve, sprint |
| Workflows | 4 | full-lifecycle, sprint-cycle, discover-only, quick-feature |
| Artifact templates | 7 | brief, prd, architecture, ux-spec, epic, story, sprint-review |
| Checklists | 5 | discover-review, plan-review, story-review, sprint-review, code-review |
| Slash commands | 8 | sniper-init, sniper-discover, sniper-plan, sniper-solve, sniper-sprint, sniper-review, sniper-compose, sniper-status |
| Domain pack (sales-dialer) | 8 | pack.yaml, 6 context files, suggested-epics |
| **TOTAL** | **59** | |

Estimated total size: ~35-45KB (well within the 50KB target)

---

## APPENDIX C: SOURCE REFERENCES & FORMAT SPECIFICATIONS

Claude Code should read these sources when building persona files. This appendix provides
the exact formats, URLs, and extraction patterns needed.

### C.1 BMAD V6 Agent Persona Format

**Source repo:** https://github.com/bmad-code-org/BMAD-METHOD (branch: `v6-alpha`)
**Install command:** `npx bmad-method@alpha install`
**Agent customization guide:** https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/agent-customization-guide.md

BMAD V6 agent YAML structure (this is what you're extracting FROM, not copying):
```yaml
agent:
  metadata:
    id: bmad/module/agents/agent-name.md
    name: Agent Name
    title: Agent Title
    icon: "🔍"
    module: module_code
  persona:
    role: "Strategic Business Analyst + Requirements Expert"
    identity: |
      Senior analyst with deep expertise in market research,
      competitive analysis, and requirements elicitation...
    communication_style: |
      Analytical and systematic in approach...
    principles:
      - "Every business challenge has underlying root causes"
      - "Data-driven decisions over assumptions"
  critical_actions:
    - "Always validate assumptions with evidence"
  commands: [...]
  menu: [...]
  startup_message: |
    Welcome message when agent loads...
```

**Known BMAD V6 personas to extract from (BMM module):**

| Agent ID | Name | Title | What to extract |
|----------|------|-------|-----------------|
| bmm-analyst | Mary | Business Analyst | Market research, competitive analysis, requirements elicitation methodology |
| bmm-pm | John/Sarah Chen | Product Manager | PRD authorship, user story creation, acceptance criteria writing |
| bmm-architect | Winston | System Architect | Architecture document structure, technology decision framework, API design |
| bmm-dev | Amelia/James | Developer | Implementation patterns, TDD approach, code quality standards |
| bmm-ux | Sally | UX Designer | UX spec format, wireframe methodology, user flow design |
| bmm-scrum | Bob | Scrum Master | Epic sharding methodology, story creation format, sprint planning |
| bmm-po | (Product Owner) | Product Owner | Backlog prioritization, acceptance criteria validation |
| bmm-qa | Murat | QA/Test Architect | Testing strategy, test plan creation, quality gate criteria |
| core-bmad-master | BMad Orchestrator | Orchestrator | Workflow coordination patterns (adapt for team lead behavior) |

**What makes BMAD personas effective (preserve these qualities in SNIPER):**
- Each persona has a distinct `communication_style` that makes outputs consistent
- `principles` constrain the agent's decision-making (e.g., architect prioritizes scalability)
- `critical_actions` define non-negotiable behaviors (e.g., "never skip acceptance criteria")
- Personas reference specific artifact templates and output locations
- Handoff protocols are explicit — each agent knows who comes before and after them

**Integration note from real-world BMAD+PAI integration (Benny Cheung's article):**
> "BMAD's agent files are verbose, containing XML-embedded markdown with activation
> protocols, menus, and persona definitions. Loading them at runtime was slow and
> cluttered the context. The solution: extract just the persona essentials to clean
> YAML files."
>
> Source: https://bennycheung.github.io/harmonizing-two-ai-agent-systems

This is exactly what SNIPER does — we extract the persona essence (role, principles,
communication style) into lean Layer 1 files and discard the BMAD-specific XML/menu/
activation overhead.

### C.2 VoltAgent Subagent Format

**Source repo:** https://github.com/VoltAgent/awesome-claude-code-subagents
**CLAUDE.md with structure:** https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/CLAUDE.md
**Install:** `./install-agents.sh` (interactive) or `curl` individual files

**Directory structure:**
```
categories/
├── 01-core-development/      # Backend, frontend, fullstack, mobile, API, GraphQL, microservices
├── 02-language-specialists/   # TypeScript, Python, Rust, Go, Java, React, Vue, etc. (22 agents)
├── 03-infrastructure/         # DevOps, K8s, cloud (AWS/Azure/GCP), Docker
├── 04-quality-security/       # Testing, security auditing, code review, pen testing
├── 05-data-ai/                # ML, data engineering, AI specialists
├── 06-developer-experience/   # Tooling, documentation, DX optimization
├── 07-specialized-domains/    # Blockchain, IoT, fintech, gaming
├── 08-business-product/       # Product management, business analysis
├── 09-meta-orchestration/     # Multi-agent coordination, agent installer
└── 10-research-analysis/      # Research and analysis specialists
```

**VoltAgent subagent file format (what you're extracting FROM):**
```markdown
---
name: backend-developer
description: Expert in building robust server applications, RESTful APIs,
  and microservices. Use proactively for backend implementation tasks.
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

You are a senior backend developer specializing in server-side architecture...

## Core Expertise
- Node.js/TypeScript, Python, Java backend development
- RESTful API design with proper error handling
- Database design and optimization (PostgreSQL, MongoDB)
...

## Architectural Patterns
- Repository pattern for data access
- Service layer for business logic
...

## Code Standards
- TypeScript strict mode
- ESLint + Prettier
...

<example>
<context>User needs a new REST API service...</context>
<user>"Build a user management microservice..."</user>
<assistant>"I'll design and implement this service..."</assistant>
</example>
```

**Key agents to read and extract from for SNIPER Layer 2:**

| Category | Agent File | Extract For |
|----------|-----------|-------------|
| 01-core-development | `backend-developer.md` | Backend specialist persona |
| 01-core-development | `frontend-developer.md` | Frontend specialist persona |
| 01-core-development | `api-designer.md` | API design specialist persona |
| 01-core-development | `microservices-architect.md` | Microservices patterns |
| 03-infrastructure | `devops-engineer.md` | Infrastructure specialist persona |
| 04-quality-security | `security-auditor.md` | Security specialist persona |
| 04-quality-security | `test-automation-engineer.md` | QA patterns |
| 05-data-ai | `ai-engineer.md` | AI/ML specialist persona |
| 05-data-ai | `data-engineer.md` | Database specialist persona |

**What makes VoltAgent personas effective (preserve in SNIPER):**
- Tool access restrictions per agent (Read-only for reviewers, full Write for developers)
- Deep framework-specific knowledge (not just "knows React" but specific hooks, patterns, testing)
- Example interactions that show expected behavior
- Granular — one agent per specialty, not a jack-of-all-trades

### C.3 SuperClaude Cognitive Mode Format

**Source repo:** https://github.com/SuperClaude-Org/SuperClaude_Framework
**ClaudeLog reference:** https://claudelog.com/claude-code-mcps/super-claude/
**Agent docs:** https://github.com/SuperClaude-Org/SuperClaude_Framework/blob/master/docs/user-guide/agents.md

**SuperClaude's 9 cognitive personas:**
```
architect     — Systems thinking, scalability, design patterns, diagrams
frontend      — UX optimization, interface quality, browser testing, accessibility
backend       — Server architecture, database design, API optimization
security      — Vulnerability identification, defense-in-depth, OWASP, threat modeling
analyzer      — Root-cause detective, debugging, problem decomposition
qa            — Test strategy, coverage analysis, edge case identification
performance   — Latency budgets, profiling, caching, load testing
refactorer    — Code improvement, pattern application, tech debt reduction
mentor        — Step-by-step explanation, learning, onboarding, documentation
```

**SuperClaude's 16 specialist agents (v4.1):**
```
system-architect       — System design and architecture decisions
backend-architect      — Backend-specific architectural patterns
frontend-architect     — Frontend architecture and component design
security-engineer      — Security assessment and compliance
performance-engineer   — Performance optimization and profiling
quality-engineer       — Testing strategy and quality assurance
devops-architect       — CI/CD, infrastructure as code, deployment
python-expert          — Python language specialist
typescript-expert      — TypeScript/JavaScript specialist
react-expert           — React framework specialist
root-cause-analyst     — Debugging and root cause analysis
refactoring-expert     — Code improvement and modernization
technical-writer       — Documentation and technical writing
PM agent               — Project management and documentation meta-layer
```

**SuperClaude MODE file structure (what SNIPER cognitive layers are based on):**
```markdown
# MODE_[Name].md

## Activation Triggers
- Flag: --mode-name
- Keywords: [triggers]
- Complexity: threshold

## Behavioral Modifications
- Communication style changes
- Decision-making adjustments
- Output format modifications

## Interaction Patterns
- How to respond
- What to prioritize

## Priority Hierarchy
1. Highest priority concern
2. Second priority
3. ...
```

**Key insight from SuperClaude's approach:**
Personas are applied as universal flags to ANY command. This means the same task
(e.g., "build auth system") gets fundamentally different treatment based on the
cognitive mode:
- `--persona-architect` → focuses on component boundaries, scalability, patterns
- `--persona-security` → focuses on OWASP, input validation, auth boundaries
- `--persona-performance` → focuses on latency, caching, N+1 queries

SNIPER's Layer 3 cognitive modes work the same way — they modify HOW the agent
thinks, regardless of what process role or technical specialty they have.

### C.4 Agent Teams API Reference

**Official docs:** https://code.claude.com/docs/en/agent-teams
**Swarm orchestration skill (community):** https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea
**Addy Osmani's guide:** https://addyosmani.com/blog/claude-code-agent-teams/

**Enable:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json or env

**Key tools available to the team lead:**

| Tool | Operations | Purpose |
|------|-----------|---------|
| `Teammate` | spawnTeam, cleanup, requestShutdown | Team lifecycle management |
| `SendMessage` | message, broadcast, shutdown_request, shutdown_response, plan_approval_response | Inter-agent communication |
| `TaskCreate` | Create tasks with dependencies | Work item management |
| `TaskUpdate` | Update task status | Progress tracking |
| `TaskList` | List all tasks | Visibility |
| `TaskGet` | Get specific task | Detail inspection |

**Task states:** pending → in_progress → completed (with `blocked_by` for dependencies)

**Team filesystem:**
```
~/.claude/teams/{team-name}/config.json   # Team members and config
~/.claude/tasks/{team-name}/              # Shared task list
~/.claude/teams/{team-name}/inboxes/      # Per-agent message inboxes
```

**Critical behaviors for SNIPER slash commands to leverage:**

1. **Delegate mode (Shift+Tab):** Locks lead to coordination-only tools (spawning,
   messaging, task management). NO file editing. This is essential — without it,
   the lead starts implementing instead of coordinating.

2. **Plan approval:** When spawning with "require plan approval", teammates work
   in read-only mode until the lead approves their approach. The lead reviews and
   either approves or rejects with feedback.

3. **Self-claiming:** Teammates automatically pick up the next unassigned, unblocked
   task after completing their current one. Uses file locking to prevent race conditions.

4. **CLAUDE.md inheritance:** Teammates automatically load CLAUDE.md from the working
   directory. They do NOT inherit the lead's conversation history. This is why spawn
   prompts must include all necessary context.

5. **No session resumption:** `/resume` does not restore teammates. Each phase must
   create a fresh team. Completed work persists in files (artifacts, code), not in
   conversation history.

6. **Permission inheritance:** Teammates inherit the lead's permission settings.
   Pre-approve common operations to reduce friction.

**Common pitfalls the SNIPER slash commands should guard against:**
- Lead coding instead of delegating → enforce delegate mode in all team workflows
- Teammates editing same files → ownership rules checked before spawning
- Lead declaring team "done" prematurely → check all tasks are actually completed
- Teammates stuck on errors → monitor and intervene via messaging
- Orphaned tmux sessions → cleanup in team shutdown

**Example spawn pattern (what SNIPER slash commands generate):**
```
Create an agent team called "sniper-plan" with 4 teammates:

1. "product-manager" — [composed spawn prompt from Layer 1+2+3+4]
   Tasks: Write PRD at docs/prd.md using template at .sniper/templates/prd.md
   Reads: docs/brief.md, docs/personas.md

2. "architect" — [composed spawn prompt]
   Tasks: Write architecture at docs/architecture.md (BLOCKED BY: PRD task)
   Require plan approval before writing.
   Reads: docs/prd.md, docs/brief.md

3. "ux-designer" — [composed spawn prompt]
   Tasks: Write UX spec at docs/ux-spec.md (BLOCKED BY: PRD task)
   Reads: docs/prd.md, docs/personas.md

4. "security-analyst" — [composed spawn prompt]
   Tasks: Write security requirements at docs/security.md (BLOCKED BY: PRD task)
   Reads: docs/prd.md

Coordination: architect and security-analyst should message each other to align
on security architecture. architect and ux-designer should align on frontend
component boundaries.

Enter delegate mode. Do not implement anything yourself.
When all tasks complete, run the checklist at .sniper/checklists/plan-review.md
and present results to me for approval.
```

### C.5 Key Implementation Notes for Claude Code

**When building persona Layer 1 (Process) files:**
- Install BMAD first: `npx bmad-method@alpha install` in a temp directory
- Read the compiled agent files in `_bmad/agents/` (not the raw YAML)
- Extract: role, identity, communication_style, principles, critical_actions
- Rewrite in SNIPER's markdown format, removing BMAD-specific menu/command/startup sections
- Add lifecycle position (which phase), artifact outputs, reads/produces, handoff protocol

**When building persona Layer 2 (Technical) files:**
- Clone VoltAgent repo: `git clone https://github.com/VoltAgent/awesome-claude-code-subagents.git`
- Read the specific agent .md files listed in C.2 table above
- Extract: core expertise, architectural patterns, code standards, testing approach
- Rewrite as focused technical knowledge without the subagent YAML frontmatter
- Keep the depth — these should be genuinely expert-level, not surface summaries

**When building persona Layer 3 (Cognitive) files:**
- Clone SuperClaude: `git clone https://github.com/SuperClaude-Org/SuperClaude_Framework.git`
- Read MODE_*.md files and the persona definitions in the agents directory
- Extract: thinking patterns, priority hierarchies, decision frameworks, flag behaviors
- Rewrite as cognitive lenses that can be applied to ANY process role or technical specialty

**When building slash commands:**
- Each command is a `.md` file in `.claude/commands/`
- The command file should be a detailed prompt that Claude Code executes when the user types the slash command
- Include pre-flight checks (verify required artifacts exist)
- Include the full Agent Teams spawn pattern (team creation, task list, spawn prompts, delegate mode)
- Include post-completion behavior (run checklist, update config state, present results)
- Reference: https://code.claude.com/docs/en/slash-commands

**When building the sales dialer domain pack context files:**
- These should contain REAL technical knowledge, not vague descriptions
- telephony.md: Include actual Twilio SDK code patterns, TwiML examples, webhook payload structures
- compliance.md: Include the actual list of two-party consent states, TCPA calling hour restrictions, FCC abandoned call rate limits
- crm-integration.md: Include actual Salesforce REST API endpoint patterns, HubSpot API v3 examples
- ai-pipeline.md: Include actual Deepgram streaming WebSocket API patterns, audio processing architecture
- Use web search to verify current API patterns and regulations if needed

**Token budget guidance for spawn prompts:**
- Target: ~1500-2000 tokens per composed spawn prompt
- Layer 1 (Process): ~400-500 tokens — role, lifecycle, artifact format
- Layer 2 (Technical): ~400-500 tokens — expertise, patterns, standards
- Layer 3 (Cognitive): ~200-300 tokens — thinking mode, priorities, decision framework
- Layer 4 (Domain): ~300-500 tokens — project-specific context
- Rules section: ~150-200 tokens — ownership, messaging, completion behavior
- If a composed prompt exceeds 2500 tokens, use progressive disclosure: put detail in a separate file and tell the agent to read it

### C.6 Framework Quality Checklist

Before considering SNIPER ready for use, verify:

- [ ] All 7 process personas capture the full BMAD lifecycle handoff chain
- [ ] All 7 technical personas have genuine depth (not surface-level)
- [ ] All 6 cognitive modes meaningfully change agent decision-making
- [ ] `/sniper-compose` correctly merges all 4 layers using the template
- [ ] `/sniper-discover` successfully spawns 3 teammates in delegate mode
- [ ] `/sniper-plan` correctly blocks architecture task on PRD task
- [ ] `/sniper-plan` enforces plan approval for architect teammate
- [ ] `/sniper-solve` produces stories with embedded context (not just references)
- [ ] `/sniper-sprint` assigns file ownership and prevents overlap
- [ ] `/sniper-review` runs checklists and reports pass/fail per item
- [ ] `/sniper-status` accurately reads config.yaml state
- [ ] Config.yaml state section updates correctly after each phase
- [ ] All slash commands include pre-flight artifact checks
- [ ] Sales dialer domain pack context files contain real, accurate technical detail
- [ ] Total framework size (excluding domain packs) is under 40KB
- [ ] A fresh `/sniper-init` in an empty directory produces a working setup

---

*This document is the complete blueprint for building SNIPER. Hand it to Claude Code with: "Read this plan and build Phase 0 — the framework itself. Start with Milestone 0.1."*
