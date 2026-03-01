---
title: Memory System
description: How SNIPER agents persist learnings across sessions with the memory system
---

# Memory System

The SNIPER memory system tracks conventions, anti-patterns, and decisions that agents learn over time. This accumulated knowledge is injected into future spawn prompts, allowing agents to improve across protocol executions.

## How Memory Works

Memory operates in three channels:

### Conventions

Rules that agents must follow. Each convention has:

- **Rule** -- the specific convention (e.g., "All API routes use Zod validation middleware")
- **Applies to** -- which agent roles this convention affects
- **Enforcement** -- where the convention is enforced (`spawn_prompt`, `review_gate`, or `both`)
- **Status** -- `confirmed` (verified across multiple executions) or `candidate` (needs more evidence)
- **Examples** -- positive and negative code examples

### Anti-Patterns

Practices to avoid. Each anti-pattern has:

- **Description** -- what the anti-pattern looks like
- **Severity** -- critical, high, medium, or low
- **Fix pattern** -- what to do instead
- **Detection hint** -- pattern for automated scanning during review gates

### Decisions

Architectural or design decisions that agents should respect. Each decision has:

- **Title and description** -- what was decided
- **Rationale** -- why it was decided
- **Status** -- `active` or `superseded`

## Memory Files

Memory is stored in `.sniper/memory/`, with retrospectives in `.sniper/retros/`:

```
.sniper/memory/
  conventions.yaml       # Confirmed and candidate conventions
  anti-patterns.yaml     # Known anti-patterns with severity
  decisions.yaml         # Active architectural decisions
  velocity.yaml          # Protocol execution history for calibration
  signals/               # Runtime signals from hooks and agents
.sniper/retros/          # Protocol retrospective reports
  retro-001.yaml
  retro-002.yaml
```

## Configuration

In v3, there is no dedicated `memory` config section. Memory behavior is driven by the `auto_retro` flag in protocol YAML files (e.g., `auto_retro: true` in `full.yaml`) and the retro-analyst agent. The visibility config exposes a single flag:

```yaml
# In .sniper/config.yaml
visibility:
  auto_retro: true        # Enable automatic retrospectives after protocol completion
```

When `auto_retro` is enabled in the protocol, the retro-analyst agent runs automatically after the review phase completes, updating memory files in `.sniper/memory/`.

### Token Budget

The `token_budget` controls how much memory context is included in each spawn prompt. When memory exceeds the budget, entries are prioritized:

1. High-severity anti-patterns (always included)
2. Conventions with `enforcement: both` or `enforcement: review_gate`
3. Active decisions
4. Medium-severity anti-patterns
5. Conventions with `enforcement: spawn_prompt` only
6. Low-severity anti-patterns

## Managing Memory

Memory is stored as YAML files in `.sniper/memory/` and managed automatically by the framework. You can also edit the files directly.

### Viewing Memory

Run `/sniper-status` to see a summary of memory entries, or inspect the YAML files directly:

```
.sniper/memory/
  conventions.yaml      # Coding conventions
  anti-patterns.yaml    # Known anti-patterns to avoid
  decisions.yaml        # Architecture/design decisions
  retros/               # Retrospective reports
  velocity.yaml         # Protocol execution history
```

### Adding Entries

Add entries directly to the YAML files. Each entry follows this format:

```yaml
# .sniper/memory/conventions.yaml
- id: conv-001
  text: "Use barrel exports for all module directories"
  status: confirmed       # confirmed | candidate
  source: manual
  created: 2026-01-15
```

### Automatic Memory Updates

The retro-analyst agent automatically updates memory after protocol completion:
- **High-confidence findings** (appeared in 3+ files) are added with `status: confirmed`
- **Medium-confidence findings** are added with `status: candidate`
- Duplicate entries are skipped

## Retrospectives

When `auto_retro` is enabled, a retrospective runs automatically after each review gate passes.

### How Retrospectives Work

1. A retro-analyst agent is spawned with context from:
   - Completed story files from the implementation
   - Review gate results
   - Existing memory (for deduplication)
   - Code changes (git diff summary)

2. The agent analyzes patterns:
   - What conventions were followed consistently?
   - What anti-patterns appeared?
   - What estimation errors occurred?
   - What positive patterns should be codified?

3. Results are written to `.sniper/memory/retros/retro-{N}.yaml`

### Auto-Codification

When `auto_codify` is enabled:

- **High-confidence findings** (appeared in 3+ files, consistent pattern) are automatically added to memory with `status: confirmed`
- **Medium-confidence findings** are added with `status: candidate` -- promote them by changing `status` to `confirmed` in the YAML file
- Duplicate entries are skipped

### Manual Retrospectives

Retrospectives run automatically when `auto_retro` is enabled. If disabled, the retro-analyst agent can be triggered by re-running the protocol's review phase.

## Memory in Spawn Prompts

When an agent is spawned, the memory layer is filtered by role and formatted:

```markdown
## Project Memory -- Conventions You Must Follow

- **conv-001:** All API routes use Zod validation middleware
  Example: router.post('/users', validate(createUserSchema), handler)
  NOT: router.post('/users', handler)  // no validation

## Anti-Patterns -- Do NOT Do These

- **ap-001 (high):** Direct DB queries in handlers. Instead: use repository pattern

## Key Decisions

- **dec-001:** Use Zod for validation -- type-safe runtime validation
```

Conventions are filtered by the `applies_to` field, so backend developers see backend conventions and frontend developers see frontend conventions.

## Workspace Memory

When workspace mode is enabled, workspace-level memory also exists at `{workspace_path}/memory/`. Workspace conventions apply across all repos and are labeled `[WORKSPACE]` in spawn prompts.

Cross-repo patterns that appear consistently in 2+ repos can be promoted to workspace memory. This can happen automatically during retrospectives (if `auto_promote: true`) or manually.

## Estimation Calibration

The memory system also tracks estimation accuracy in `.sniper/memory/estimates.yaml`:

```yaml
calibration:
  velocity_factor: 1.0
  common_underestimates: []
  last_updated: null
  executions_analyzed: 0
```

Over multiple executions, this data helps calibrate story complexity estimates.

## Next Steps

- [Review Gates](/guide/review-gates) -- how memory compliance is checked during reviews
- [Personas](/guide/personas) -- how memory integrates into spawn prompts
- [Workspace Mode](/guide/workspace-mode) -- workspace-level memory
