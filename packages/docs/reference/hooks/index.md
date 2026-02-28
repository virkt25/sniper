---
title: Hooks
---

# Hooks

SNIPER uses Claude Code hooks to enforce constraints, capture signals, and trigger actions at phase boundaries.

## Hook Files

| File | Purpose |
|------|---------|
| `settings-hooks.json` | Core execution hooks -- write scope enforcement, self-healing CI, gate/retro triggers |
| `signal-hooks.json` | Learning capture -- auto-capture CI failure signals to memory |

## Hook Events

SNIPER uses three hook events:

### PreToolUse

Fires before a tool is executed. Used for:

- **Write scope enforcement** -- blocks the lead-orchestrator from writing outside `.sniper/`

### PostToolUse

Fires after a tool completes. Used for:

- **Self-healing CI** -- detects test/lint failures in Bash output and instructs the agent to fix before proceeding
- **Signal capture** -- auto-captures CI failure patterns to `.sniper/memory/signals/`

### Stop

Fires when an agent stops. Used for:

- **Gate trigger** -- spawns the gate-reviewer at phase boundaries
- **Retro trigger** -- spawns the retro-analyst after protocol completion

## Plugin Hooks

Language plugins can contribute additional hooks that merge with the core hook definitions during installation. See the [Plugin Development](/guide/plugin-development) guide.

Browse individual hook reference pages in the sidebar.
