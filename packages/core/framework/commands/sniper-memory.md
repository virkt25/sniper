# /sniper-memory -- Manage Agent Memory (Conventions, Anti-Patterns, Decisions)

You are executing the `/sniper-memory` command. Your job is to manage the project's accumulated knowledge — conventions, anti-patterns, and decisions that agents learn over time. Follow every step below precisely.

The user's arguments are provided in: $ARGUMENTS

---

## Step 0: Pre-Flight Checks

1. Verify `.sniper/config.yaml` exists (SNIPER is initialized)
2. Check if `.sniper/memory/` directory exists. If not, create it with empty starter files:
   - `.sniper/memory/conventions.yaml` with `conventions: []`
   - `.sniper/memory/anti-patterns.yaml` with `anti_patterns: []`
   - `.sniper/memory/decisions.yaml` with `decisions: []`
   - `.sniper/memory/estimates.yaml` with `calibration: { velocity_factor: 1.0, common_underestimates: [], last_updated: null, sprints_analyzed: 0 }`
   - `.sniper/memory/retros/` directory

---

## Step 1: Parse Arguments

Parse the following flags from `$ARGUMENTS`:

| Flag | Description | Example |
|------|-------------|---------|
| (none) | Show memory summary | `/sniper-memory` |
| `--conventions` | List all conventions | `/sniper-memory --conventions` |
| `--anti-patterns` | List all anti-patterns | `/sniper-memory --anti-patterns` |
| `--decisions` | List all decisions | `/sniper-memory --decisions` |
| `--add convention "rule"` | Add a new convention | `/sniper-memory --add convention "Use barrel exports"` |
| `--add anti-pattern "desc"` | Add a new anti-pattern | `/sniper-memory --add anti-pattern "Nested ternaries"` |
| `--add decision "title" --rationale "why"` | Add a decision | `/sniper-memory --add decision "Use Zod" --rationale "Type-safe validation"` |
| `--remove {id}` | Remove an entry by ID | `/sniper-memory --remove conv-003` |
| `--promote {id}` | Promote candidate to confirmed | `/sniper-memory --promote ap-002` |
| `--export` | Export memory as portable YAML | `/sniper-memory --export` |
| `--import {file}` | Import memory from file | `/sniper-memory --import memory-pack.yaml` |
| `--retro` | Manually trigger retrospective | `/sniper-memory --retro` |

If no arguments provided, default to showing the summary.

If unrecognized flags, show usage guide and STOP.

---

## Step 2: Read Memory State

1. Read `.sniper/memory/conventions.yaml` — parse the `conventions` array
2. Read `.sniper/memory/anti-patterns.yaml` — parse the `anti_patterns` array
3. Read `.sniper/memory/decisions.yaml` — parse the `decisions` array
4. Read `.sniper/memory/estimates.yaml` — parse calibration data
5. Scan `.sniper/memory/retros/` for retro files — count them, find the latest

If any file is missing or empty, treat it as an empty array/object.

---

## Step 3: Execute Operation

### 3a: Summary (no flags)

Display a formatted summary:

```
============================================
  SNIPER Memory
============================================

  Conventions:    {N} confirmed, {M} candidates
  Anti-Patterns:  {N} confirmed, {M} candidates
  Decisions:      {N} active, {M} superseded

  Estimation:
    Velocity Factor:  {factor}
    Sprints Analyzed: {count}

  Retrospectives:
    Total:     {count}
    Latest:    Sprint {N} ({date})

============================================
```

### 3b: List Operations (--conventions, --anti-patterns, --decisions)

For each entry, display in a readable format:

**Conventions:**
```
[conv-001] (confirmed) enforcement: both
  Rule: All API routes use Zod validation middleware
  Applies to: backend-engineer, api-designer
  Source: review_gate (sprint-2-review, 2026-02-15)

[conv-002] (candidate) enforcement: spawn_prompt
  Rule: Use named exports for React components
  Applies to: frontend-engineer
  Source: retro (sprint-3-retro, 2026-02-18)
```

Similar format for anti-patterns (include severity) and decisions (include status).

### 3c: Add Operations (--add)

**Add convention:**
1. Determine the next convention ID: find the highest `conv-XXX` number and increment
2. Create the entry:
   ```yaml
   - id: conv-{NNN}
     rule: "{provided rule}"
     rationale: ""
     source:
       type: manual
       ref: "user-added"
       date: "{today ISO 8601}"
     applies_to: []
     enforcement: both
     scope: project
     status: confirmed
     examples:
       positive: ""
       negative: ""
   ```
3. Ask the user which roles this applies to (suggest common roles: backend-engineer, frontend-engineer, architect, etc.)
4. Append to `.sniper/memory/conventions.yaml`
5. Confirm addition

**Add anti-pattern:**
Similar flow — next `ap-XXX` ID, ask for severity (high/medium/low), ask for fix_pattern, ask for applies_to roles.

**Add decision:**
Similar flow — next `dec-XXX` ID, require `--rationale` flag, ask for applies_to roles, set status to active.

### 3d: Remove Operation (--remove {id})

1. Determine which file the ID belongs to (conv- → conventions, ap- → anti-patterns, dec- → decisions)
2. Find the entry by ID
3. If not found, error: `Entry {id} not found in memory.`
4. Show the entry and ask for confirmation: `Remove this entry? (y/n)`
5. If confirmed, remove from the YAML array and rewrite the file
6. Confirm removal

### 3e: Promote Operation (--promote {id})

1. Find the entry by ID (check all three files)
2. If not found or already confirmed/active, error with appropriate message
3. Change `status` from `candidate` to `confirmed` (for conventions/anti-patterns) or to `active` (for decisions)
4. Rewrite the file
5. Confirm promotion

### 3f: Export Operation (--export)

1. Create a combined export YAML:
   ```yaml
   exported_from: "{project.name}"
   exported_at: "{today ISO 8601}"
   version: "1.0"

   conventions:
     # Strip source.ref and project-specific fields
     # Keep: rule, applies_to, enforcement, examples

   anti_patterns:
     # Keep: description, fix_pattern, severity, applies_to

   decisions: []  # Decisions excluded by default (project-specific)
   ```
2. Write to `sniper-memory-export.yaml` in the project root
3. Report: exported {N} conventions, {M} anti-patterns

### 3g: Import Operation (--import {file})

1. Read the specified file
2. Validate it has the expected export format
3. For each entry, check for duplicates by content similarity (exact rule/description match)
4. Add non-duplicate entries with `source.type: imported`, `status: candidate`
5. Report: imported {N} conventions, {M} anti-patterns, {K} skipped (duplicates)

### 3h: Retro Operation (--retro)

1. Read `.sniper/config.yaml` to get the current sprint number
2. Read `.sniper/teams/retro.yaml` for the team definition
3. Print instructions for running the retro:
   ```
   To run a sprint retrospective:

   1. The retro team will analyze sprint {N} output
   2. Findings will be written to .sniper/memory/retros/sprint-{N}-retro.yaml
   3. High-confidence findings will be auto-added to memory

   Compose the retro-analyst spawn prompt:
     /sniper-compose --process retro-analyst --cognitive systems-thinker --name "Retro Analyst"

   Then spawn the retro agent with context from:
     - docs/stories/ (completed stories)
     - docs/reviews/ (review gate results)
     - .sniper/memory/ (existing memory for dedup)
   ```

---

## Step 4: Display Results

After executing the operation, display a final summary showing:
- What changed (if anything)
- Current memory counts
- Any warnings or suggestions

---

## IMPORTANT RULES

- Never delete memory files entirely — always preserve the YAML structure with empty arrays
- When modifying YAML files, preserve comments and formatting where possible
- Convention IDs use `conv-XXX`, anti-pattern IDs use `ap-XXX`, decision IDs use `dec-XXX` (zero-padded to 3 digits)
- Always ask for confirmation before destructive operations (remove)
- The `--retro` flag provides instructions but does not directly spawn agents (that requires team orchestration)
- Memory files use standard YAML format — no managed section markers (those are for markdown templates)
- If workspace memory exists (check config for `workspace.workspace_path`), mention it in the summary but don't modify it from this command
