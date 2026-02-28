---
name: sniper-review
description: Manually trigger a review gate for the current phase
arguments:
  - name: phase
    description: Phase to review (defaults to current phase from live-status)
    required: false
---

# /sniper-review

Manually trigger a quality gate review. Use this when you want to run gate checks outside of the normal protocol flow.

## Process

### 1. Determine Phase

- If `--phase` is specified, use it
- Otherwise, read `.sniper/live-status.yaml` for the current phase
- If no active phase, ask the user which phase checklist to run

### 2. Load Checklist

Read the checklist from `.sniper/checklists/<phase>.yaml` (or from `.claude/` if scaffolded there).

### 3. Run Checks

Spawn a gate-reviewer agent to execute the checklist:
- Use the Task tool with the gate-reviewer agent definition
- Pass the checklist path and phase name
- Wait for the gate result

### 4. Present Results

Display the gate result:
- Overall: PASS or FAIL
- Each check with status and any output
- Blocking failures highlighted
- Suggestions for fixing failures

### 5. Write Result

Save the gate result to `.sniper/gates/<phase>-<timestamp>.yaml`.

## Rules

- This is a manual trigger — it does NOT advance the protocol phase
- Always write results to `.sniper/gates/` for audit trail
- If checks reference commands that don't exist in config, skip with a warning
