---
title: Personas
---

# Personas

The persona system is how SNIPER gives each agent a focused identity. Rather than a single monolithic prompt, agent identity is composed from independent layers that combine to create specialized teammates.

## The Four Layers

### Process Layer

Defines what the agent does -- their role in the project lifecycle.

Process personas are stored in `.sniper/personas/process/` and include:

| Persona | Role | Phase |
|---------|------|-------|
| `analyst` | Research markets, competitors, and user needs | Discover |
| `product-manager` | Write PRDs and requirement specifications | Plan |
| `architect` | Design system architecture and component boundaries | Plan |
| `ux-designer` | Define information architecture and user flows | Plan |
| `scrum-master` | Shard PRDs into epics and stories | Solve |
| `developer` | Implement stories following architecture patterns | Sprint |
| `qa-engineer` | Write tests, validate acceptance criteria | Sprint |
| `code-reviewer` | Review PRs for quality, security, and patterns | Audit |
| `doc-analyst` | Analyze project structure for documentation | Doc |
| `doc-writer` | Generate documentation from artifacts | Doc |
| `doc-reviewer` | Validate documentation accuracy | Doc |

Additional specialized process personas exist for specific commands:

- `code-archaeologist`, `architecture-cartographer`, `convention-miner` -- for `/sniper-ingest`
- `log-analyst`, `code-investigator` -- for `/sniper-debug`
- `impact-analyst`, `migration-architect` -- for `/sniper-audit --target refactor`
- `threat-modeler`, `vuln-scanner` -- for `/sniper-audit --target security`
- `coverage-analyst`, `flake-hunter` -- for `/sniper-audit --target tests`
- `perf-profiler` -- for `/sniper-audit --target performance`
- `retro-analyst` -- for sprint retrospectives
- `workspace-orchestrator` -- for multi-repo coordination
- `release-manager` -- for release readiness assessments

Each process persona file defines the agent's responsibilities, output format, quality rules, and lifecycle position.

### Technical Layer

Adds domain-specific technical expertise. Stored in `.sniper/personas/technical/`:

| Persona | Expertise |
|---------|-----------|
| `backend` | Node.js/TypeScript, Express/Fastify, PostgreSQL, Redis, queues, WebSocket, JWT auth |
| `frontend` | React, component hierarchy, responsive design, state management |
| `infrastructure` | Docker, Terraform, CI/CD, cloud providers, monitoring |
| `security` | Auth models, encryption, compliance, OWASP, threat modeling |
| `ai-ml` | AI pipelines, model integration, real-time APIs, embeddings |
| `database` | Schema design, migrations, query optimization, indexing |
| `api-design` | REST contracts, versioning, validation, error handling |

Technical personas define core expertise, architectural patterns, testing approaches, and code standards specific to that technical domain.

### Cognitive Layer

Shapes how the agent thinks and what it prioritizes. Stored in `.sniper/personas/cognitive/`:

| Persona | Thinking Pattern |
|---------|-----------------|
| `systems-thinker` | Focuses on boundaries, interfaces, dependencies, coupling, and scaling behavior |
| `devils-advocate` | Challenges assumptions, identifies failure modes, questions optimistic estimates |
| `user-empathetic` | Prioritizes user experience, friction points, accessibility, emotional design |
| `security-first` | Evaluates every decision through a security lens, flags vulnerabilities |
| `performance-focused` | Optimizes for speed, efficiency, and resource usage |
| `mentor-explainer` | Produces clear, educational content with examples and rationale |

Cognitive personas define a decision framework, priority hierarchy, and what the agent flags or blocks.

### Domain Layer

Injects industry-specific knowledge from a domain pack. Domain context is loaded from the active domain pack's knowledge files.

For example, with the `sales-dialer` pack, an agent might receive context about telephony protocols, CRM integration patterns, TCPA compliance requirements, and AI coaching pipelines.

## How Composition Works

The `/sniper-compose` command reads persona files and merges them into a spawn prompt template.

### The Template

The spawn prompt template at `.sniper/spawn-prompts/_template.md` has this structure:

```markdown
# Teammate: {name}

## Your Role in the Lifecycle
{process_layer}

## Technical Expertise
{technical_layer}

## How You Think
{cognitive_layer}

## Domain Context
{domain_layer}

## Project Memory
{memory_layer}

## Rules for This Session
- You own these directories ONLY: {ownership}
- Do NOT modify files outside your ownership boundaries
- Read the relevant artifact files before starting
- Message teammates directly when you need alignment
- Message the team lead when blocked, complete, or needing a decision
- Write all outputs to the file paths specified in your tasks
- If a task has plan_approval: true, describe your approach and wait for approval
```

### Composing Manually

You can compose a prompt directly:

```
/sniper-compose --process architect --technical backend --cognitive security-first --name "Backend Architect" --ownership backend
```

This reads:
- `.sniper/personas/process/architect.md`
- `.sniper/personas/technical/backend.md`
- `.sniper/personas/cognitive/security-first.md`
- Domain pack context (if configured)
- Memory layer (conventions, anti-patterns, decisions filtered by role)
- Ownership paths from `config.yaml`

The result is saved to `.sniper/spawn-prompts/backend-architect.md`.

### Automatic Composition

During phase commands (`/sniper-discover`, `/sniper-plan`, `/sniper-sprint`), composition happens automatically. The team YAML specifies which layers each teammate uses:

```yaml
teammates:
  - name: architect
    compose:
      process: architect
      technical: backend
      cognitive: security-first
      domain: null
```

The phase command reads each persona file, fills the template, and appends task-specific context.

## Customizing Personas

### Editing Existing Personas

Modify any persona file in `.sniper/personas/` to adjust agent behavior. For example, if your project uses Go instead of TypeScript, edit `.sniper/personas/technical/backend.md` to reflect Go patterns.

### Creating New Personas

Add new `.md` files to the appropriate layer directory. The filename (minus `.md`) becomes the persona name used in team YAML and compose commands.

### Pack-Provided Personas

Domain packs can provide additional process personas. For example, the sales-dialer pack adds a `telephony-specialist` process persona. Pack personas are discovered in `.sniper/packs/*/personas/`.

If a pack persona has the same name as a framework persona, the pack content is appended after the framework content -- the pack extends rather than replaces.

## Memory Layer

When the memory system is active, composed prompts also include a memory layer with:

- **Conventions** the agent must follow (filtered by role)
- **Anti-patterns** the agent must avoid (with severity levels)
- **Key decisions** the agent should be aware of

The memory layer is subject to a token budget (default: 2000 tokens). If memory exceeds the budget, entries are prioritized by severity and enforcement level.

## Next Steps

- [Teams](/guide/teams) -- how personas are assembled into agent teams
- [Memory System](/guide/memory) -- how conventions feed into spawn prompts
- [Reference: Personas](/reference/personas/) -- browse all persona files
