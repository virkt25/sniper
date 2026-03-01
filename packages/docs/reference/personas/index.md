---
title: Personas Reference
description: Cognitive persona mixins that shape how SNIPER agents think and prioritize
---

# Personas Reference

In SNIPER v3, agent behavior is defined directly in agent definition files (`packages/core/agents/*.md`). Cognitive personas are optional mixins that shape _how_ an agent thinks — they overlay a thinking style onto any agent.

## Cognitive Personas

Cognitive personas influence an agent's reasoning and decision-making priorities. They are applied as mixins via configuration.

| Persona | Description |
|---------|-------------|
| [Devil's Advocate](/reference/personas/cognitive/devils-advocate) | Challenges assumptions, finds weaknesses, stress-tests proposals |
| [Performance Focused](/reference/personas/cognitive/performance-focused) | Prioritizes runtime performance, efficiency, and resource optimization |
| [Security First](/reference/personas/cognitive/security-first) | Prioritizes security in every decision, identifies threats early |

## Agents vs Personas

In v3, the distinction between "agents" and "personas" has been simplified:

- **Agents** (`packages/core/agents/*.md`) define _who_ does the work — their role, tools, constraints, and output. There are 11 specialized agents including lead-orchestrator, architect, backend-dev, code-reviewer, and more.
- **Cognitive personas** (`packages/core/personas/cognitive/*.md`) define _how_ agents think — overlaying a reasoning style like security-first or performance-focused.

Agents are assigned to protocol phases. Cognitive personas are optionally applied to agents via configuration to adjust their approach.

## Applying Cognitive Personas

Configure cognitive personas in `.sniper/config.yaml`:

```yaml
agents:
  architect:
    cognitive: security-first    # Architect will prioritize security
  backend-dev:
    cognitive: performance-focused  # Backend dev will prioritize performance
```

## Related

- [Personas Guide](/guide/personas) — how persona composition works in detail
- [Architecture](/guide/architecture) — how agents map to Claude Code primitives
- [Configuration](/guide/configuration) — configuring cognitive overlays
