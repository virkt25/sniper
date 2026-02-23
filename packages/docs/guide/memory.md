---
title: Memory System
---

# Memory System

The SNIPER memory system tracks conventions, anti-patterns, and decisions that agents learn over time. This accumulated knowledge is injected into future spawn prompts, allowing agents to improve across sprints.

## How Memory Works

Memory operates in three channels:

### Conventions

Rules that agents must follow. Each convention has:

- **Rule** -- the specific convention (e.g., "All API routes use Zod validation middleware")
- **Applies to** -- which agent roles this convention affects
- **Enforcement** -- where the convention is enforced (`spawn_prompt`, `review_gate`, or `both`)
- **Status** -- `confirmed` (verified across multiple sprints) or `candidate` (needs more evidence)
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

Memory is stored in `.sniper/memory/`:

```
.sniper/memory/
  conventions.yaml       # Confirmed and candidate conventions
  anti-patterns.yaml     # Known anti-patterns with severity
  decisions.yaml         # Active architectural decisions
  estimates.yaml         # Estimation calibration data
  retros/                # Sprint retrospective reports
    sprint-1-retro.yaml
    sprint-2-retro.yaml
```

## Configuration

Enable and configure memory in `.sniper/config.yaml`:

```yaml
memory:
  enabled: true           # Enable the memory system
  auto_retro: true        # Auto-run retrospective after sprint completion
  auto_codify: true       # Auto-codify high-confidence findings
  token_budget: 2000      # Max tokens for memory in spawn prompts
```

### Token Budget

The `token_budget` controls how much memory context is included in each spawn prompt. When memory exceeds the budget, entries are prioritized:

1. High-severity anti-patterns (always included)
2. Conventions with `enforcement: both` or `enforcement: review_gate`
3. Active decisions
4. Medium-severity anti-patterns
5. Conventions with `enforcement: spawn_prompt` only
6. Low-severity anti-patterns

## Managing Memory

Use `/sniper-memory` to view and manage memory:

### View Summary

```
/sniper-memory
```

Shows counts of conventions, anti-patterns, decisions, and retrospective history.

### List Entries

```
/sniper-memory --conventions
/sniper-memory --anti-patterns
/sniper-memory --decisions
```

### Add Entries

```
/sniper-memory --add convention "Use barrel exports for all module directories"
/sniper-memory --add anti-pattern "Direct database queries in route handlers"
/sniper-memory --add decision "Use Zod for validation" --rationale "Type-safe runtime validation"
```

### Remove and Promote

```
/sniper-memory --remove conv-003
/sniper-memory --promote ap-002    # Promote candidate to confirmed
```

### Export and Import

```
/sniper-memory --export            # Export to sniper-memory-export.yaml
/sniper-memory --import pack.yaml  # Import from file (deduplicates)
```

## Sprint Retrospectives

When `auto_retro` is enabled, a retrospective runs automatically after each sprint review gate passes.

### How Retrospectives Work

1. A retro-analyst agent is spawned with context from:
   - Completed story files from the sprint
   - Review gate results
   - Existing memory (for deduplication)
   - Code changes (git diff summary)

2. The agent analyzes patterns:
   - What conventions were followed consistently?
   - What anti-patterns appeared?
   - What estimation errors occurred?
   - What positive patterns should be codified?

3. Results are written to `.sniper/memory/retros/sprint-{N}-retro.yaml`

### Auto-Codification

When `auto_codify` is enabled:

- **High-confidence findings** (appeared in 3+ files, consistent pattern) are automatically added to memory with `status: confirmed`
- **Medium-confidence findings** are added with `status: candidate` -- they need manual promotion via `/sniper-memory --promote`
- Duplicate entries are skipped

### Manual Retrospectives

Trigger a retrospective manually:

```
/sniper-memory --retro
```

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

Cross-repo patterns that appear consistently in 2+ repos can be promoted to workspace memory. This can happen automatically during sprint retrospectives (if `auto_promote: true`) or manually.

## Estimation Calibration

The memory system also tracks estimation accuracy in `.sniper/memory/estimates.yaml`:

```yaml
calibration:
  velocity_factor: 1.0
  common_underestimates: []
  last_updated: null
  sprints_analyzed: 0
```

Over multiple sprints, this data helps calibrate story complexity estimates.

## Next Steps

- [Review Gates](/guide/review-gates) -- how memory compliance is checked during reviews
- [Personas](/guide/personas) -- how memory integrates into spawn prompts
- [Workspace Mode](/guide/workspace-mode) -- workspace-level memory
