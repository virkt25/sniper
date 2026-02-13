# /sniper-review -- Run Review Gate for the Current Phase

You are executing the `/sniper-review` command. Your job is to evaluate the current phase's artifacts against its review checklist and enforce the appropriate gate policy. Follow every step below precisely.

---

## Step 0: Pre-Flight -- Determine Current Phase

1. Read `.sniper/config.yaml`
2. Extract `state.current_phase`
3. If `current_phase` is `null`:
   ```
   ERROR: No active phase. The SNIPER lifecycle has not been started.

   Current state:
     Phase:   not started
     Sprint:  0

   To begin, run one of these phase commands:
     /sniper-discover  -- Start Phase 1: Discovery & Analysis
     /sniper-plan      -- Start Phase 2: Planning & Architecture
     /sniper-solve     -- Start Phase 3: Epic Sharding & Story Creation
     /sniper-sprint    -- Start Phase 4: Implementation Sprint
   ```
   Then STOP.

4. Store the current phase name. It must be one of: `discover`, `plan`, `solve`, `sprint`

---

## Step 1: Map Phase to Checklist and Gate Mode

Use this mapping to determine which checklist to load and what gate mode to enforce:

| Phase      | Checklist File                            | Config Gate Key       |
|-----------|-------------------------------------------|-----------------------|
| `discover` | `.sniper/checklists/discover-review.md`   | `review_gates.after_discover` |
| `plan`     | `.sniper/checklists/plan-review.md`       | `review_gates.after_plan`     |
| `solve`    | `.sniper/checklists/story-review.md`      | `review_gates.after_solve`    |
| `sprint`   | `.sniper/checklists/sprint-review.md`     | `review_gates.after_sprint`   |

1. Read the gate mode from `config.yaml` using the appropriate key
2. Read the checklist file

If the checklist file does not exist:
```
ERROR: Checklist file not found: {path}
The framework installation may be incomplete. Check .sniper/checklists/ for available checklists.
```
Then STOP.

---

## Step 2: Identify Artifacts to Review

Based on the current phase, identify which artifact files need to be reviewed:

### Phase: discover
| Artifact             | Expected Path        |
|---------------------|---------------------|
| Project Brief        | `docs/brief.md`      |
| Risk Assessment      | `docs/risks.md`      |
| User Personas        | `docs/personas.md`   |

### Phase: plan
| Artifact             | Expected Path            |
|---------------------|-------------------------|
| PRD                  | `docs/prd.md`            |
| Architecture         | `docs/architecture.md`   |
| UX Specification     | `docs/ux-spec.md`        |
| Security Requirements| `docs/security.md`       |

### Phase: solve
| Artifact             | Expected Path        |
|---------------------|---------------------|
| Epics                | `docs/epics/*.md`    |
| Stories              | `docs/stories/*.md`  |

### Phase: sprint
| Artifact             | Expected Path                        |
|---------------------|--------------------------------------|
| Source Code          | Files in ownership directories       |
| Tests                | Files in test directories            |
| Sprint Stories       | Stories assigned to current sprint    |

For each expected artifact:
1. Check if the file exists
2. If it does NOT exist, record an immediate FAIL for that artifact:
   ```
   FAIL: {artifact_name} not found at {path}
   ```
3. If it exists, read its content for evaluation in Step 3

---

## Step 3: Evaluate Each Checklist Item

Parse the checklist file. Each line starting with `- [ ]` is a checklist item.

Group the checklist items by their section headers (## headers in the checklist file).

For each checklist item, evaluate it against the relevant artifact content:

### Evaluation Criteria

For each item, assign one of three statuses:

**PASS** -- The criterion is clearly met in the artifact:
- The artifact contains substantive content addressing the criterion
- The content is specific, not generic placeholder text
- The content has enough depth to be actionable

**WARN** -- The criterion is partially met or needs improvement:
- The artifact addresses the topic but lacks specificity
- The content exists but is thin or uses vague language
- The artifact has the right structure but some sections are incomplete

**FAIL** -- The criterion is not met:
- The artifact does not address the criterion at all
- The relevant section is empty or contains only template placeholders
- The content contradicts the criterion
- The artifact file does not exist

### Evaluation Process

For each checklist section:
1. Read the relevant artifact
2. For each checklist item in that section:
   a. Search the artifact for content related to the criterion
   b. Assess whether the content meets the criterion (PASS/WARN/FAIL)
   c. Write a brief (one-line) justification for the assessment
3. Record the result

Be thorough but fair:
- Do NOT fail items just because they could be better -- that is a WARN
- Do NOT pass items that only have placeholder text (template markers like `<!-- -->` or `TODO`)
- For cross-document consistency checks, read ALL referenced documents and compare

---

## Step 4: Present Results

Print a formatted review report:

```
============================================
  SNIPER Review Gate: {phase} Phase
============================================

  Gate Mode: {strict|flexible|auto}
  Checklist: {checklist_file}
  Date: {today's date}

--------------------------------------------
  {Section Name from Checklist}
--------------------------------------------
  {PASS|WARN|FAIL}  {checklist item text}
               -> {brief justification}

  {PASS|WARN|FAIL}  {checklist item text}
               -> {brief justification}

  ... (repeat for all items in section)

--------------------------------------------
  {Next Section Name}
--------------------------------------------
  ... (repeat for all sections)

============================================
  Summary
============================================

  Total Items: {count}
  PASS:  {count}  ({percentage}%)
  WARN:  {count}  ({percentage}%)
  FAIL:  {count}  ({percentage}%)

  Overall: {ALL PASS | HAS WARNINGS | HAS FAILURES}
```

---

## Step 5: Apply Gate Policy

Based on the gate mode and results, take the appropriate action:

### Gate Mode: `strict`

**If ALL items are PASS (no WARN, no FAIL):**
1. Print: "All review criteria passed. This gate requires human approval to advance."
2. Ask the user: "Do you approve advancing from the {phase} phase to the next phase? (yes/no)"
3. If YES: proceed to Step 6 (update state)
4. If NO: print "Phase advancement blocked by reviewer. Address feedback and run `/sniper-review` again."

**If ANY items are WARN (but no FAIL):**
1. Print: "Review found warnings. This gate requires human approval."
2. List all WARN items with their justifications
3. Ask: "There are {count} warnings. Do you want to approve advancement despite these warnings? (yes/no)"
4. If YES: proceed to Step 6
5. If NO: print "Phase advancement blocked. Address warnings and run `/sniper-review` again."

**If ANY items are FAIL:**
1. Print: "Review found failures. This gate BLOCKS advancement."
2. List all FAIL items with their justifications
3. Print: "The following items MUST be addressed before this phase can be approved:"
4. List each FAIL item as an action item
5. Print: "Fix these issues and run `/sniper-review` again."
6. Do NOT advance. Do NOT ask for override. STOP here.

### Gate Mode: `flexible`

**If ALL items are PASS:**
1. Print: "All review criteria passed. Auto-advancing to next phase."
2. Proceed to Step 6 (update state)

**If ANY items are WARN (but no FAIL):**
1. Print: "Review found warnings. Auto-advancing (flexible gate)."
2. List WARN items briefly
3. Print: "These items are noted for async review. Proceeding to next phase."
4. Proceed to Step 6

**If ANY items are FAIL:**
1. Print: "Review found failures in a flexible gate."
2. List all FAIL items
3. Ask: "There are {count} failures. This is a flexible gate -- do you want to advance anyway? (yes/no)"
4. If YES: proceed to Step 6 with a note that failures were accepted
5. If NO: print "Address failures and run `/sniper-review` again."

### Gate Mode: `auto`

1. Print: "Auto gate -- no review required. Advancing to next phase."
2. Print any FAIL or WARN items as informational notes
3. Proceed to Step 6

---

## Step 6: Update Lifecycle State

When a phase is approved for advancement:

1. Read the current `.sniper/config.yaml`
2. Determine the next phase using this progression:
   - `discover` -> `plan`
   - `plan` -> `solve`
   - `solve` -> `sprint`
   - `sprint` -> `sprint` (remains in sprint phase, increment sprint number)

3. Update the `state` section:
   ```yaml
   state:
     current_phase: {next_phase}
     phase_history:
       - phase: {completed_phase}
         started_at: {start_date_if_known_or_today}
         completed_at: {today's date in YYYY-MM-DD format}
         approved_by: {human or auto}
         gate_mode: {strict|flexible|auto}
         pass_count: {number}
         warn_count: {number}
         fail_count: {number}
       # ... (preserve existing history entries)
     current_sprint: {increment by 1 if completing a sprint, else keep}
     artifacts:
       # Update artifact statuses based on what was reviewed:
       # If all items for an artifact passed -> "approved"
       # If any items warn but no fails -> "draft"
       # If the artifact exists but has fails -> "draft"
       # Keep existing values for artifacts not reviewed in this phase
   ```

4. Write the updated config back to `.sniper/config.yaml`

5. Print the advancement confirmation:
   ```
   ============================================
     Phase Advanced
   ============================================

     Completed: {phase}
     Advanced to: {next_phase}
     Artifacts updated in config.yaml

     Next step: Run {next_command}
   ```

   Where `next_command` maps to:
   - `plan` -> `/sniper-plan`
   - `solve` -> `/sniper-solve`
   - `sprint` -> `/sniper-sprint`
   - staying in `sprint` -> `/sniper-sprint` (next sprint cycle)

---

## IMPORTANT RULES

- NEVER skip evaluation -- read every artifact and assess every checklist item.
- NEVER auto-approve a strict gate. Always require explicit human input.
- NEVER modify artifact files -- this command is a review tool, not an editor.
- Be honest in assessments. Do not inflate passes to speed things along.
- If artifacts contain only template placeholders, that is a FAIL, not a WARN.
- For cross-document consistency checks, you MUST read all referenced documents.
- When updating config.yaml, preserve ALL existing content -- only modify the state section.
- Always show the full formatted report before applying gate logic.
- If the user's config.yaml is malformed or unreadable, report an error and STOP.
