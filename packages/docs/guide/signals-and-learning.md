---
title: Learning System
description: How SNIPER captures and codifies learnings across protocol executions
---

# Learning System

SNIPER captures learnings from protocol executions -- CI failures, review findings, retrospective insights -- and codifies them into project memory. This creates a learning loop where agents improve across runs.

## How Learning Works

```
Protocol execution → retrospective → learnings captured → stored in memory → injected into next agent spawn
```

The learning system has three components:

1. **Self-healing hooks** -- PostToolUse hooks that detect failures in Bash output and instruct agents to fix them
2. **Retrospectives** -- Post-protocol analysis that extracts patterns and codifies them
3. **Memory injection** -- Agents receive relevant learnings in their spawn prompts

## The `/sniper-learn` Command

Use `/sniper-learn` to manually submit, review, or deprecate project learnings:

- **Submit** a new convention, anti-pattern, or decision
- **Review** candidate learnings and promote or reject them
- **Deprecate** outdated learnings that no longer apply

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

## Learning Injection

When agents are spawned, relevant learnings are injected into their context:

1. The lead-orchestrator reads `.sniper/memory/` (conventions, anti-patterns, decisions)
2. Learnings matching the current phase and agent role are selected
3. Selected learnings are appended to the agent's spawn prompt under a `## Project Memory` section

This means if a test failed because of a date mocking issue last week and it was captured as a convention, the developer agent spawned this week receives that learning automatically.

## Retrospectives

After protocols with `auto_retro: true` complete, the retro-analyst:

1. Analyzes gate results (what passed, what failed, what was borderline)
2. Reviews signal history for the protocol run
3. Generates recommendations

Retrospective output is stored in `.sniper/memory/retros/`.

## Configuration

Enable the learning system in `.sniper/config.yaml`:

```yaml
visibility:
  auto_retro: true        # Run retrospectives after protocol completion
```

## Next Steps

- [Memory System](/guide/memory) -- conventions, anti-patterns, and decisions
- [Advanced Features](/guide/advanced-features) -- trigger tables, multi-model review, spec sync
- [Review Gates](/guide/review-gates) -- how gates produce signals on failure
