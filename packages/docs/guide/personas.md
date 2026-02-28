---
title: Personas
description: Agents, cognitive mixins, and domain layers that shape how SNIPER teammates think and work
---

# Personas

The persona system is how SNIPER gives each agent a focused identity. Rather than a single monolithic prompt, agent identity is composed from independent layers that combine to create specialized teammates.

## The Three Layers

### Agent Layer

Defines what the agent does -- their role in the project lifecycle.

Agent definitions are stored in `packages/core/agents/` and scaffolded into `.claude/agents/` in your project. Each agent has YAML frontmatter specifying its model, tool access, and write scope, followed by Markdown instructions.

| Agent | Role | Typical Phase |
|-------|------|---------------|
| `lead-orchestrator` | Coordinates agent teams through protocol phases; delegates but never codes | All |
| `analyst` | Researches, analyzes codebases, and produces discovery artifacts | Discover |
| `architect` | Designs system architecture and produces technical plans | Plan |
| `product-manager` | Translates requirements into structured stories with EARS criteria | Plan |
| `backend-dev` | Implements server-side code in an isolated worktree | Implement |
| `frontend-dev` | Implements client-side code in an isolated worktree | Implement |
| `fullstack-dev` | Handles both backend and frontend for small-to-medium projects | Implement |
| `qa-engineer` | Writes tests, analyzes coverage, and validates acceptance criteria | Implement |
| `code-reviewer` | Reviews implementations with multi-faceted scope, standards, and risk scoring | Review |
| `gate-reviewer` | Runs automated checklist checks at phase boundaries | Review |
| `retro-analyst` | Runs automated retrospectives and tracks velocity metrics | Post-protocol |

The lead-orchestrator is a zero-capability orchestrator -- its Write access is scoped exclusively to `.sniper/` for checkpoints, status, and configuration. It reads the codebase to make informed delegation decisions but never edits project source code directly.

### Cognitive Layer

Shapes how the agent thinks and what it prioritizes. Cognitive mixins are stored in `packages/core/personas/cognitive/` and are applied to agents through `config.yaml`.

| Mixin | Thinking Pattern |
|-------|-----------------|
| `devils-advocate` | Challenges assumptions, identifies failure modes, stress-tests edge cases, questions optimistic estimates |
| `security-first` | Evaluates every decision through a security lens, applies threat-first analysis, enforces least privilege |
| `performance-focused` | Optimizes for speed and efficiency, checks for N+1 queries, unbounded collections, and blocking operations |

Cognitive mixins are short, focused documents that define a decision framework and priority hierarchy. They augment an agent's base instructions without replacing them.

### Domain Layer

Injects industry-specific knowledge from a domain pack. Domain context is loaded from the active domain pack's knowledge files.

For example, with the `sales-dialer` pack, an agent might receive context about telephony protocols, CRM integration patterns, TCPA compliance requirements, and AI coaching pipelines.

## How Composition Works

In v3, persona composition is handled through `config.yaml` rather than a standalone command. The `agents.mixins` section maps cognitive mixins to specific agents, and the protocol system handles agent selection automatically.

### Configuring Mixins

In your project's `.sniper/config.yaml`, the `agents.mixins` section controls which cognitive layers are applied to each agent:

```yaml
agents:
  base:
    - lead-orchestrator
    - analyst
    - architect
    - product-manager
    - backend-dev
    - frontend-dev
    - qa-engineer
    - code-reviewer
    - gate-reviewer
    - retro-analyst

  # Cognitive mixins applied to agents during scaffolding
  # Format: agent-name: [mixin1, mixin2]
  mixins:
    backend-dev: [security-first, performance-focused]
    architect: [devils-advocate]
    code-reviewer: [security-first]
    frontend-dev: [performance-focused]
```

When agents are scaffolded into `.claude/agents/`, the mixin content is appended to the agent's base instructions. An agent can receive multiple mixins, and each mixin augments rather than replaces the agent's core identity.

### Protocol-Driven Agent Selection

During `/sniper-flow` execution, the active protocol determines which agents participate in each phase. Each protocol YAML defines the agent roster per phase:

```yaml
phases:
  - name: discover
    agents: [analyst]
    spawn_strategy: single

  - name: plan
    agents: [architect, product-manager]
    spawn_strategy: team

  - name: implement
    agents: [backend-dev, frontend-dev, qa-engineer]
    spawn_strategy: team

  - name: review
    agents: [code-reviewer]
    spawn_strategy: single
```

The lead-orchestrator reads this configuration and spawns the right agents for each phase, applying any cognitive mixins configured in `config.yaml`.

### Available Protocols

Rather than standalone commands for different workflows, v3 uses `/sniper-flow --protocol <name>` to select the appropriate protocol:

| Protocol | Phases | Use Case |
|----------|--------|----------|
| `full` | discover, plan, implement, review | Greenfield features or major changes |
| `feature` | plan, implement, review | Well-understood features with clear requirements |
| `patch` | implement, review | Small changes to existing code |
| `ingest` | scan, document, extract | Analyzing and documenting an existing codebase |
| `explore` | discover | Research and analysis only |
| `refactor` | analyze, implement, review | Restructuring existing code |
| `hotfix` | implement | Emergency fixes with no gate checks |

For example, to run a codebase analysis that was previously handled by a standalone ingest command:

```bash
/sniper-flow --protocol ingest
```

## Customizing Agents

### Editing Existing Agents

After scaffolding with `sniper init`, agent definitions live in `.claude/agents/` in your project. You can modify any agent file to adjust its behavior, responsibilities, or constraints.

### Adjusting Cognitive Mixins

To change how an agent thinks, update the `agents.mixins` mapping in `.sniper/config.yaml` and re-scaffold. You can also edit the mixin files directly in `packages/core/personas/cognitive/` to customize the thinking patterns.

### Pack-Provided Knowledge

Domain packs inject industry-specific context into agents. For example, the sales-dialer pack adds telephony, compliance, CRM, and AI pipeline knowledge. Pack knowledge is loaded from the configured domain pack and made available to agents during execution.

## Memory Layer

When the memory system is active, composed prompts also include a memory layer with:

- **Conventions** the agent must follow (filtered by role)
- **Anti-patterns** the agent must avoid (with severity levels)
- **Key decisions** the agent should be aware of

The memory layer is subject to a token budget (default: 2000 tokens). If memory exceeds the budget, entries are prioritized by severity and enforcement level.

## Next Steps

- [Teams](/guide/teams) -- how agents are assembled into teams by protocols
- [Memory System](/guide/memory) -- how conventions feed into agent prompts
- [Reference: Agents](/reference/agents/) -- browse all agent definitions
