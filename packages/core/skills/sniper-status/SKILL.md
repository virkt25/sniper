---
name: sniper-status
description: Show current SNIPER protocol progress and cost
arguments: []
---

# /sniper-status

Display the current state of SNIPER in this project.

## Process

### 1. Read State Files

Read the following files (skip if they don't exist):
- `.sniper/config.yaml` — Project configuration
- `.sniper/live-status.yaml` — Active protocol progress
- `.sniper/cost.yaml` — Token usage tracking

If `.sniper/config.yaml` doesn't exist, display: "SNIPER is not initialized. Run `/sniper-init` first."

### 2. Display Status

Format and display:

**Project Info**:
- Project name and type
- Stack summary (language, framework, database)
- Plugins installed

**Protocol Status** (if active):
- Protocol name and current phase
- Phase progress (completed/total phases)
- Agent status per active phase
- Gate results for completed phases

**Cost Summary** (if tracking enabled):
- Tokens used vs budget
- Budget percentage with visual bar
- Warning if approaching soft/hard cap

**Recent Activity**:
- Last 3 checkpoints with timestamps
- Last gate result

**Velocity Trends** (if velocity data exists):
- Read `.sniper/memory/velocity.yaml`
- Show last 5 executions per protocol with tokens used
- Show calibrated budget vs configured budget comparison
- Show trend direction: ↑ (increasing usage), ↓ (decreasing usage), → (stable)

### 3. Format Output

Use clear formatting:
```
Project: my-app (saas)
Stack:   TypeScript, Next.js, PostgreSQL

Protocol: feature (phase 2/3)
Phase:    implement [===========-----] 68%
  backend-dev:  implementing (3/5 tasks)
  qa-engineer:  waiting

Gates:
  plan:      PASS (2025-01-15)

Cost: 245K / 800K tokens (31%)
[======--------------] 31%

Velocity:
  feature: 612K avg (calibrated: 750K, configured: 800K) →
  patch:   145K avg (calibrated: 180K, configured: 200K) ↓
```

## Rules

- Read-only — this skill never modifies any files
- If no protocol is active, show config summary only
- If cost tracking is disabled, skip cost section
