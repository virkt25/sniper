---
title: Advanced Features
description: Trigger tables, multi-model review, spec sync, logical revert, and velocity calibration
---

# Advanced Features

Deep dives into SNIPER v3.1 and v3.2 capabilities for power users.

## Trigger Tables

Map file patterns to specific agents or protocols. When `/sniper-flow` auto-detects scope, it evaluates changed files against trigger rules to refine its decision.

```yaml
# .sniper/config.yaml
triggers:
  - pattern: "src/api/**/*.ts"
    agent: backend-dev
  - pattern: "src/components/**/*.tsx"
    agent: frontend-dev
  - pattern: "*.proto"
    protocol: api-review
  - pattern: "infrastructure/**"
    agent: fullstack-dev
    protocol: full
  - pattern: "*.test.*"
    agent: qa-engineer
```

### How Trigger Tables Work

1. `/sniper-flow` detects which files are likely affected by the user's request
2. Each affected file is matched against trigger patterns (glob syntax)
3. If a trigger matches, the specified agent is prioritized for that work
4. If a trigger specifies a protocol, that protocol overrides auto-detection

Triggers are evaluated in order. The first matching trigger wins.

## Multi-Faceted Review

The code reviewer evaluates implementations across three dimensions, producing structured findings with severity scores.

### Scope Validation

- Does the implementation match the spec?
- Are all acceptance criteria (EARS format) satisfied?
- Is there scope creep beyond the story definition?

### Standards Enforcement

- Do conventions from `.sniper/memory/conventions/` hold?
- Do all tests pass? Is lint clean? Does typecheck succeed?
- Are file ownership boundaries respected?

### Risk Scoring

Each finding receives a severity:

| Severity | Meaning | Blocking? |
|----------|---------|-----------|
| **critical** | Security vulnerability, data loss risk, or broken functionality | Yes |
| **high** | Significant bug, missing error handling, or performance regression | Yes |
| **medium** | Code quality issue, missing test, or convention violation | No |
| **low** | Style nit, documentation gap, or minor improvement | No |

The gate evaluates blocking vs non-blocking findings to determine pass/fail.

## Multi-Model Review

Run review gates with multiple models for higher confidence. Useful for critical phases where a single model's blind spots could miss issues.

### Configuration

```yaml
# .sniper/config.yaml
review:
  multi_model: true
  models:
    - claude-opus-4-6
    - claude-sonnet-4-6
  require_consensus: true
```

### How It Works

1. The gate-reviewer spawns with each configured model
2. Each model evaluates the same checklist independently
3. Results are aggregated:
   - **Consensus mode** (`require_consensus: true`) -- all models must agree on pass
   - **Majority mode** (`require_consensus: false`) -- majority wins

### When to Use

- **Strict gates on architecture** -- catch design issues a single model might miss
- **Security reviews** -- multiple perspectives on threat surface
- **Pre-production releases** -- extra confidence before shipping

::: tip
Multi-model review doubles or triples your token spend per gate. Use it selectively on high-stakes phases rather than everywhere.
:::

## Spec Sync

After the code reviewer finishes, it reconciles `docs/spec.md` (or the relevant spec artifact) with the implementation reality. This bidirectional sync ensures documentation stays accurate as code evolves.

### What Spec Sync Does

1. Reads the spec artifact (PRD, architecture, or feature spec)
2. Compares stated behavior against actual implementation
3. Identifies drift:
   - Features described in spec but not implemented
   - Features implemented but not described in spec
   - Behavior that diverges from spec
4. Produces a reconciliation section in the review report
5. Optionally updates the spec artifact with `<!-- sniper:managed -->` sections

### Configuration

Spec sync is enabled by default when the code reviewer runs. No additional configuration needed.

## Logical Revert

Track git commits per phase for safe rollback if a phase goes wrong.

### How It Works

1. The lead-orchestrator records commit SHAs at each phase boundary
2. If a phase fails (gate failure, timeout, critical error), a revert plan is generated
3. The revert plan specifies which commits to revert to restore the previous state

### Revert Plan Schema

```yaml
protocol: feature
target_state: plan_complete
backup_branch: "sniper/backup/feature-20260228"
commits_to_revert:
  - sha: "abc123"
    message: "implement: backend API endpoints"
    agent: fullstack-dev
  - sha: "def456"
    message: "implement: frontend components"
    agent: fullstack-dev
phase: implement
```

### Using Revert

```bash
sniper revert
```

The CLI reads checkpoint files to determine which commits belong to the failed phase, generates a revert plan, and executes the rollback. It never force-pushes -- it creates new revert commits.

## Domain Knowledge Injection

Inject external knowledge into agent context beyond what's in the codebase.

### Knowledge Manifest

```yaml
# .sniper/knowledge-manifest.yaml
sources:
  - name: API documentation
    description: External API docs for payment gateway
    path: .sniper/knowledge/payment-api.md
    token_limit: 5000

  - name: Compliance requirements
    description: HIPAA compliance requirements
    path: .sniper/knowledge/hipaa.md
    token_limit: 3000
```

### Configuration

```yaml
# .sniper/config.yaml
knowledge:
  directory: .sniper/knowledge/
  manifest: .sniper/knowledge-manifest.yaml
  max_total_tokens: 50000
```

Knowledge files are injected into agent spawn prompts when relevant. The manifest controls which files are included and their token budgets to prevent context overflow.

## MCP Knowledge Server

The `@sniper.ai/mcp-knowledge` package provides a Model Context Protocol server for context-aware code intelligence. When enabled, agents can query project knowledge through MCP tools.

### Configuration

```yaml
# .sniper/config.yaml
mcp_knowledge:
  enabled: true
  directory: .sniper/knowledge/
  auto_index: true
```

## Next Steps

- [Signals & Learning](/guide/signals-and-learning) -- how the framework learns from failures
- [Configuration](/guide/configuration) -- configure all advanced features
- [Custom Protocols](/guide/custom-protocols) -- build workflows that use these features
