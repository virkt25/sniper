---
name: sniper-learn
description: Submit, review, or deprecate project learnings
arguments:
  - name: learning
    description: "The learning to submit (e.g., \"Always validate JWT expiry before checking permissions\")"
    required: false
  - name: review
    description: Review and curate existing learnings
    required: false
    type: boolean
  - name: deprecate
    description: "Learning ID to deprecate (e.g., L-20260307-a3f2)"
    required: false
---

# /sniper-learn

Manage the SNIPER learning store. Submit new learnings from experience, review existing learnings, or deprecate outdated ones.

## Mode Selection

```
--review given?             → Review mode
--deprecate <id> given?     → Deprecate mode
learning text given?        → Submit mode
Nothing given?              → Submit mode (prompt for learning text)
```

## Submit Mode

Submit a new learning from human experience or observation.

### Process

1. **Capture the learning text** from the argument or prompt the user:
   - "What did you learn? Describe the pattern, rule, or insight."

2. **Ask clarifying questions** (present as multi-select, all optional):
   - **Agents:** Which agents should see this learning? (default: all)
     - Options: analyst, architect, product-manager, fullstack-dev, backend-dev, frontend-dev, qa-engineer, code-reviewer
   - **Phases:** Which protocol phases does this apply to? (default: all)
     - Options: discover, plan, solve, implement, review
   - **Files:** Any specific file patterns? (default: all)
     - Accept glob patterns like `src/api/**`, `*.test.ts`

3. **Ask for anti-pattern and correction** (optional):
   - "Is there a specific anti-pattern to avoid?"
   - "What should be done instead?"

4. **Create the learning record:**
   ```yaml
   id: L-{YYYYMMDD}-{4-char-hex}
   status: active
   confidence: 0.9
   created_at: {ISO 8601}
   updated_at: {ISO 8601}
   source:
     type: human
     detail: "Submitted via /sniper-learn"
   learning: {learning text}
   anti_pattern: {if provided}
   correction: {if provided}
   scope:
     agents: {selected or null}
     phases: {selected or null}
     files: {selected or null}
   applied_in: []
   reinforced_by: []
   contradicted_by: []
   history:
     - timestamp: {ISO 8601}
       event: created
       actor: human
   ```

5. **Write** to `.sniper/memory/learnings/{id}.yaml`

6. **Confirm:** "Learning `{id}` created with confidence 0.9. It will be composed into agent prompts for matching phases/agents."

## Review Mode

Review, curate, and manage existing learnings.

### Process

1. **Spawn the memory-curator agent** from `.claude/agents/memory-curator.md`
   - Pass it the task: "Run full curation — consolidation, contradiction detection, staleness check, spec drift detection, signal migration, and pruning."

2. **Present curator summary** to the user

3. **Show flagged items** requiring human decision:
   - Contradictions between high-confidence learnings
   - Stale learnings that might still apply
   - Spec drift detections

4. **For each flagged item**, ask the user:
   - **Keep** — maintain current status
   - **Deprecate** — set status to deprecated
   - **Edit** — modify the learning text/scope

5. **Show final state:**
   ```
   Active learnings: N
   Validated: N
   Deprecated: N
   Archived: N
   Average confidence: X.XX
   ```

## Deprecate Mode

Deprecate a specific learning by ID.

### Process

1. **Read** `.sniper/memory/learnings/{id}.yaml`
2. If not found, report error: "Learning `{id}` not found."
3. **Show the learning** to the user for confirmation:
   - Learning text, current confidence, source, created date
4. **Confirm:** "Deprecate this learning?"
5. **Update the learning:**
   - `status: deprecated`
   - `confidence: 0.0`
   - Add history entry:
     ```yaml
     - timestamp: {ISO 8601}
       event: human_invalidated
       actor: human
       detail: "Deprecated via /sniper-learn --deprecate"
     ```
6. **Confirm:** "Learning `{id}` deprecated. It will no longer be composed into agent prompts."

## Rules

- Human-submitted learnings ALWAYS start at confidence 0.9
- ALWAYS write to `.sniper/memory/learnings/` — never to signals
- ALWAYS include a history entry for every change
- If `.sniper/memory/learnings/` doesn't exist, create it
- If `.sniper/memory/signals/` contains files, suggest running `--review` to migrate them
