---
title: Signals & Learning
description: Auto-capture CI failures, PR feedback, and production errors as learning signals
---

# Signals & Learning

SNIPER captures external signals -- CI failures, review comments, test flakiness -- and feeds them back into agent behavior. This creates a learning loop where the framework gets smarter over time.

## How Signals Work

```
CI failure → signal captured → stored in memory → injected into next agent spawn
```

The signal system has three components:

1. **Signal hooks** -- PostToolUse hooks that detect failures in Bash output
2. **Signal storage** -- YAML files in `.sniper/memory/signals/`
3. **Signal injection** -- Agents receive relevant signals in their spawn prompts

## Signal Hooks

SNIPER's `signal-hooks.json` defines PostToolUse hooks that watch Bash output for failure patterns:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "description": "Auto-capture CI failure signals from test/lint output",
        "command": "if echo \"$CLAUDE_TOOL_OUTPUT\" | grep -qiE '(FAIL|FAILED|ERROR|exit code [1-9])'; then echo 'SIGNAL: CI failure detected — capturing to .sniper/memory/signals/'; fi"
      }
    ]
  }
}
```

When a test fails or a linter reports errors, the hook automatically captures:

- **Type** -- `ci_failure`, `pr_review_comment`, `production_error`, `manual`
- **Source** -- which command produced the failure
- **Timestamp** -- when it occurred
- **Summary** -- brief description of the signal
- **Details** -- full error output or context
- **Learning** -- extracted pattern for future avoidance
- **Relevance tags** -- categorization tags for signal matching
- **Affected files** -- files mentioned in the error output

## Signal Schema

Each signal is stored as a YAML file:

```yaml
type: ci_failure
source: vitest
timestamp: "2026-02-28T14:30:00Z"
summary: "JWT expiry test failing in auth module"
details: |
  FAIL tests/api/auth.test.ts
  Expected: token to be expired
  Received: token still valid
learning: "JWT expiry validation requires mocking Date.now()"
relevance_tags:
  - auth
  - testing
affected_files:
  - src/api/auth.ts
  - tests/api/auth.test.ts
```

## Self-Healing CI

Beyond signal capture, SNIPER includes a self-healing pattern (inspired by Aider). The `settings-hooks.json` PostToolUse hook detects test/lint failures in real-time and instructs the active agent to fix them before proceeding:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "description": "Self-healing CI: detect test/lint failures and instruct agent to fix",
        "command": "if echo \"$CLAUDE_TOOL_OUTPUT\" | grep -qiE '(FAIL|FAILED|ERROR|error TS|ESLint)'; then echo 'WARN: Tests or linting failed. Fix the issues before continuing.'; fi"
      }
    ]
  }
}
```

This creates a tight feedback loop:

```
Agent writes code → runs tests → tests fail → hook fires → agent fixes → runs tests again
```

The agent does not mark its task complete until tests pass. No human intervention needed.

## Signal Injection

When agents are spawned, relevant signals are injected into their context:

1. The lead-orchestrator reads `.sniper/memory/signals/`
2. Signals matching the current phase and affected files are selected
3. Selected signals are appended to the agent's spawn prompt under a `## Signals` section

This means if a test failed because of a date mocking issue last week, the developer agent spawned this week receives that learning automatically.

## Velocity Calibration

The retro-analyst agent records execution metrics after each protocol completes:

```yaml
# .sniper/memory/velocity.yaml
executions:
  - protocol: feature
    completed_at: "2025-12-15T14:30:00Z"
    wall_clock_seconds: 1200
    tokens_used: 650000
    tokens_per_phase:
      plan: 150000
      implement: 400000
      review: 100000
calibrated_budgets:
  feature: 700000
  patch: 180000
rolling_averages:
  feature: 620000
  patch: 165000
```

After 5+ executions of a protocol, SNIPER uses the calibrated p75 budget instead of the configured default. This means:

- Token budgets automatically adjust to your project's reality
- Protocols that consistently run under budget get tighter budgets
- Protocols that consistently exceed budget get more room
- View calibrated budgets with `/sniper-status`

## Retrospectives

After protocols with `auto_retro: true` complete, the retro-analyst:

1. Collects execution metrics (tokens, duration, agent count)
2. Analyzes gate results (what passed, what failed, what was borderline)
3. Reviews signal history for the protocol run
4. Generates recommendations
5. Updates velocity tracking

Retrospective output is stored in `.sniper/memory/retros/`.

## Configuration

Enable the learning system in `.sniper/config.yaml`:

```yaml
visibility:
  auto_retro: true        # Run retrospectives after protocol completion
  cost_tracking: true     # Track token usage per phase and agent

memory:
  enabled: true
  auto_codify: true       # Auto-extract conventions from retros
  token_budget: 8000      # Max tokens for memory in spawn prompts
```

## Next Steps

- [Memory System](/guide/memory) -- conventions, anti-patterns, and decisions
- [Advanced Features](/guide/advanced-features) -- trigger tables, multi-model review, spec sync
- [Review Gates](/guide/review-gates) -- how gates produce signals on failure
