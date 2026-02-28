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
        "tool": "Bash",
        "pattern": "FAIL|ERROR|error\\[",
        "action": "capture_signal",
        "output": ".sniper/memory/signals/"
      }
    ]
  }
}
```

When a test fails or a linter reports errors, the hook automatically captures:

- **Type** -- `test_failure`, `lint_error`, `build_failure`, `type_error`
- **Source** -- which command produced the failure
- **Timestamp** -- when it occurred
- **Affected files** -- files mentioned in the error output
- **Learning** -- extracted pattern for future avoidance

## Signal Schema

Each signal is stored as a YAML file:

```yaml
type: test_failure
source: vitest
timestamp: "2026-02-28T14:30:00Z"
affected_files:
  - src/api/auth.ts
  - tests/api/auth.test.ts
raw_output: |
  FAIL tests/api/auth.test.ts
  ✕ should validate JWT expiry (12ms)
  Expected: token to be expired
  Received: token still valid
learning: "JWT expiry validation requires mocking Date.now()"
severity: medium
phase: implement
protocol: feature
```

## Self-Healing CI

Beyond signal capture, SNIPER includes a self-healing pattern (inspired by Aider). The `settings-hooks.json` PostToolUse hook detects test/lint failures in real-time and instructs the active agent to fix them before proceeding:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "tool": "Bash",
        "pattern": "FAIL|error TS|ESLint",
        "message": "Tests or linting failed. Fix the issues before continuing."
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
protocols:
  feature:
    executions: 7
    avg_tokens: 650000
    avg_duration_minutes: 42
    p75_tokens: 720000
    calibrated_budget: 720000
  patch:
    executions: 12
    avg_tokens: 140000
    avg_duration_minutes: 8
    p75_tokens: 165000
    calibrated_budget: 165000
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
