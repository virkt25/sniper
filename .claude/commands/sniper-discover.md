# /sniper-discover -- Phase 1: Discovery & Analysis (Parallel Team)

You are executing the `/sniper-discover` command. Your job is to spawn a parallel discovery team that researches the project's market landscape, risks, and user needs. You are the **team lead** -- you coordinate, you do NOT produce artifacts yourself. Follow every step below precisely.

**Arguments:** $ARGUMENTS

---

## Step 0: Pre-Flight Checks

Perform ALL of the following checks before proceeding. If any check fails, STOP and report the issue.

### 0a. Verify SNIPER Is Initialized

1. Read `.sniper/config.yaml`.
2. If the file does not exist or `project.name` is empty:
   - **STOP.** Print: "SNIPER is not initialized. Run `/sniper-init` first."
   - Do not proceed further.

### 0b. Verify Phase State

1. Read the `state.current_phase` value from `.sniper/config.yaml`.
2. **If `current_phase` is `null`:** Good -- this is a fresh project. Proceed.
3. **If `current_phase` is `discover`:** The discover phase is already in progress or was interrupted.
   - Ask the user: "The discover phase appears to be in progress or was previously started. Do you want to restart it? This will overwrite any existing discovery artifacts. (yes/no)"
   - If no, STOP.
4. **If `current_phase` is anything else** (plan, solve, sprint):
   - Ask the user: "The project is currently in the '{current_phase}' phase. Running discover again will reset progress. Are you sure? (yes/no)"
   - If no, STOP.

### 0c. Verify Framework Files

Check that these files exist (they are needed by the team):
- `.sniper/teams/discover.yaml`
- `.sniper/spawn-prompts/_template.md`
- `.sniper/checklists/discover-review.md`
- `.sniper/personas/process/analyst.md`
- `.sniper/personas/cognitive/systems-thinker.md`
- `.sniper/personas/cognitive/devils-advocate.md`
- `.sniper/personas/cognitive/user-empathetic.md`

If any are missing, print a warning listing the missing files but continue if at least the team YAML exists.

---

## Step 1: Update Lifecycle State

Edit `.sniper/config.yaml` to update the state section:

1. Set `state.current_phase: discover`
2. Append to `state.phase_history`:
   ```yaml
   - phase: discover
     started_at: "{current ISO timestamp}"
     completed_at: null
     approved_by: null
   ```

---

## Step 2: Read Team Definition

1. Read `.sniper/teams/discover.yaml` in full.
2. Parse out:
   - `team_name` (should be `sniper-discover`)
   - The list of `teammates` with their `name`, `compose` layers, and `tasks`
   - The `coordination` rules (should be empty for discover -- independent research)
   - The `review_gate` section (checklist path and mode)
3. Store these values for subsequent steps.

---

## Step 3: Read Project Context

Gather the context that teammates will need:

1. Read `.sniper/config.yaml` fully -- extract `project.name`, `project.description`, `project.type`, `stack`, `domain_pack`, and `ownership` sections.
2. If `domain_pack` is not null, check if `.sniper/domain-packs/{domain_pack}/` exists and read any context files within it.
3. Read the artifact template `.sniper/templates/brief.md` -- teammates will need to follow this template.

---

## Step 4: Compose Spawn Prompts

For each teammate in the team YAML, compose a spawn prompt by assembling persona layers. Do this by reading the actual persona files and assembling them into the template.

### Teammate: analyst

1. Read these persona layer files:
   - Process: `.sniper/personas/process/analyst.md`
   - Technical: SKIP (null in team YAML)
   - Cognitive: `.sniper/personas/cognitive/systems-thinker.md`
   - Domain: If `domain_pack` is set, read `.sniper/domain-packs/{domain_pack}/context/*.md`. Otherwise skip.

2. Read the spawn prompt template: `.sniper/spawn-prompts/_template.md`

3. Assemble the spawn prompt by filling the template:
   - `{name}` = "analyst"
   - `{process_layer}` = contents of the process persona file
   - `{technical_layer}` = "No specific technical lens for this role."
   - `{cognitive_layer}` = contents of the cognitive persona file
   - `{domain_layer}` = domain pack context if available, otherwise "No domain pack configured."
   - `{ownership}` = the `docs` ownership paths from `config.yaml`

4. Append to the spawn prompt:
   ```
   ## Your Task
   **Task ID:** market-research
   **Task Name:** Market Research & Competitive Analysis
   **Output File:** docs/brief.md
   **Template:** .sniper/templates/brief.md

   {task description from the team YAML}

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Description:** {project.description}
   - **Stack:** {summary of stack section}

   ## Instructions
   1. Read the template at `.sniper/templates/brief.md` to understand the expected output format.
   2. If a domain pack is configured, read the domain context files for industry knowledge.
   3. Research and produce the artifact at `docs/brief.md` following the template exactly.
   4. Every section in the template MUST be filled -- no empty sections.
   5. When complete, message the team lead that your task is done.
   ```

5. Save this composed prompt as a variable for spawning.

### Teammate: risk-researcher

1. Read these persona layer files:
   - Process: `.sniper/personas/process/analyst.md`
   - Technical: `.sniper/personas/technical/infrastructure.md`
   - Cognitive: `.sniper/personas/cognitive/devils-advocate.md`
   - Domain: Same as above.

2. Assemble using the same template pattern:
   - `{name}` = "risk-researcher"
   - `{technical_layer}` = contents of the infrastructure technical persona
   - `{ownership}` = the `docs` ownership paths

3. Append task context:
   ```
   ## Your Task
   **Task ID:** risk-assessment
   **Task Name:** Technical Feasibility & Risk Assessment
   **Output File:** docs/risks.md
   **Template:** .sniper/templates/risks.md

   {task description from the team YAML}

   ## Project Context
   {same project context as above}

   ## Instructions
   1. Read the template at `.sniper/templates/risks.md` to understand the expected output format.
   2. Assess technical feasibility, integration risks, compliance hurdles, and scalability challenges.
   3. Challenge optimistic assumptions -- be the devil's advocate.
   4. For each risk, provide a specific mitigation strategy.
   5. Write the output to `docs/risks.md` following the template exactly.
   6. When complete, message the team lead that your task is done.
   ```

### Teammate: user-researcher

1. Read these persona layer files:
   - Process: `.sniper/personas/process/analyst.md`
   - Technical: SKIP (null)
   - Cognitive: `.sniper/personas/cognitive/user-empathetic.md`
   - Domain: Same as above.

2. Assemble using the same template pattern:
   - `{name}` = "user-researcher"
   - `{technical_layer}` = "No specific technical lens for this role."
   - `{ownership}` = the `docs` ownership paths

3. Append task context:
   ```
   ## Your Task
   **Task ID:** user-personas
   **Task Name:** User Persona & Journey Mapping
   **Output File:** docs/personas.md
   **Template:** .sniper/templates/personas.md

   {task description from the team YAML}

   ## Project Context
   {same project context as above}

   ## Instructions
   1. Read the template at `.sniper/templates/personas.md` to understand the expected output format.
   2. Define 2-4 distinct user personas with goals, pain points, and workflows.
   3. Map the primary user journey for each persona.
   4. Identify key friction points and moments of delight.
   5. Write the output to `docs/personas.md` following the template exactly.
   6. When complete, message the team lead that your task is done.
   ```

---

## Step 5: Create the Agent Team

Use the TeamCreate tool to create the team:

```
TeamCreate:
  team_name: "sniper-discover"
  description: "SNIPER Phase 1: Discovery & Analysis for {project.name}"
```

---

## Step 6: Create Tasks in the Shared Task List

Create one task per teammate using TaskCreate. Since coordination is empty (all tasks are independent), there are NO dependencies between tasks.

### Task 1: Market Research

```
TaskCreate:
  subject: "Market Research & Competitive Analysis"
  description: "Research the market landscape. Identify competitors, features, pricing, and positioning. Define the project's unique value proposition. Output: docs/brief.md. Follow template at .sniper/templates/brief.md."
  activeForm: "Researching market landscape and competitors"
```

### Task 2: Risk Assessment

```
TaskCreate:
  subject: "Technical Feasibility & Risk Assessment"
  description: "Assess technical feasibility, integration risks, compliance hurdles, and scalability challenges. Challenge optimistic assumptions. Output: docs/risks.md."
  activeForm: "Assessing risks and technical feasibility"
```

### Task 3: User Personas

```
TaskCreate:
  subject: "User Persona & Journey Mapping"
  description: "Define 2-4 user personas with goals, pain points, and workflows. Map primary user journeys. Output: docs/personas.md."
  activeForm: "Defining user personas and journeys"
```

No dependencies between tasks -- all three run in parallel.

---

## Step 7: Spawn Teammates

Spawn each teammate using the Task tool. Use the composed spawn prompts from Step 4.

For each teammate, spawn using:
- `team_name`: "sniper-discover"
- `name`: the teammate name from the YAML (analyst, risk-researcher, user-researcher)
- The full composed spawn prompt as the instruction

Spawn all three teammates. They will work in parallel on their independent tasks.

After spawning, assign each task to its corresponding teammate using TaskUpdate with the `owner` field:
- Task 1 (Market Research) -> owner: "analyst"
- Task 2 (Risk Assessment) -> owner: "risk-researcher"
- Task 3 (User Personas) -> owner: "user-researcher"

Mark each task as `in_progress` via TaskUpdate.

---

## Step 8: Enter Delegate Mode

**You are now the team lead. You do NOT produce artifacts.**

Your responsibilities during execution:
1. Monitor task progress via TaskList
2. Respond to teammate messages (questions, blockers, completion notifications)
3. If a teammate is stuck or asks a question about the project, provide guidance from the project context
4. If a teammate finishes early, acknowledge their completion and update their task status to `completed`
5. Track which teammates have completed their work

**Do NOT:**
- Write to `docs/brief.md`, `docs/risks.md`, or `docs/personas.md` yourself
- Modify teammate artifacts
- Do research yourself

Wait for all three teammates to report completion.

---

## Step 9: Verify Artifacts Exist

Once all three teammates report completion:

1. Verify these files exist and are non-empty:
   - `docs/brief.md`
   - `docs/risks.md`
   - `docs/personas.md`

2. If any file is missing or empty, message the responsible teammate and ask them to complete it.

3. Do NOT proceed to Step 10 until all three files exist and contain content.

---

## Step 10: Run Review Gate

Read the review gate configuration from the team YAML: `review_gate.mode` and `review_gate.checklist`.

1. Read the review checklist at `.sniper/checklists/discover-review.md`.
2. For each checklist item, perform a quick evaluation by reading the relevant artifact and checking if the item is addressed.
3. Compile a review summary with:
   - Total checklist items
   - Items that PASS
   - Items that NEED ATTENTION (not fully met but not blocking)
   - Items that FAIL (critical gaps)

### Gate Decision

The discover gate mode is **flexible**:

- **If there are no FAIL items:** Auto-advance. Print the review summary and note any NEED ATTENTION items for async review.
- **If there are FAIL items:** Present the failures to the user and ask:
  > "The discovery review found {N} critical issues. Would you like to:
  > 1. Have the team fix the issues (I will message the relevant teammates)
  > 2. Override and advance anyway
  > 3. Stop and review manually"

  If option 1: Message the relevant teammates with specific feedback, wait for fixes, then re-run the checklist.
  If option 2: Proceed with a note that issues were overridden.
  If option 3: STOP and let the user handle it.

---

## Step 11: Update State and Shut Down Team

### Update Lifecycle State

Edit `.sniper/config.yaml`:

1. Set `state.artifacts.brief: draft`
2. Update the discover entry in `state.phase_history` to add `completed_at: "{current ISO timestamp}"`
3. If auto-advanced (flexible gate passed), set `approved_by: "auto-flexible"`

### Shut Down Teammates

Send a shutdown request to each teammate:
- Send shutdown_request to "analyst"
- Send shutdown_request to "risk-researcher"
- Send shutdown_request to "user-researcher"

Wait for all teammates to acknowledge shutdown.

---

## Step 12: Present Results and Next Steps

Print a formatted summary:

```
============================================
  SNIPER Phase 1: Discovery Complete
============================================

  Artifacts Produced:
    - docs/brief.md       [draft]
    - docs/risks.md        [draft]
    - docs/personas.md     [draft]

  Review Gate: FLEXIBLE
    Passed: {count}/{total} checklist items
    Attention: {count} items flagged for async review
    Failed: {count} critical issues

  Phase Duration: {time elapsed}

============================================
  Next Steps
============================================

  1. Review the discovery artifacts in `docs/`
  2. When ready, run `/sniper-plan` to begin Phase 2: Planning & Architecture
  3. Or run `/sniper-status` to see the full lifecycle state

============================================
```

---

## IMPORTANT RULES

- You are the LEAD. You coordinate. You do NOT write artifact files.
- All three teammates work in PARALLEL -- do not serialize their work.
- If `$ARGUMENTS` contains "dry-run", perform Steps 0-4 only (compose prompts) and print them without spawning. This lets the user review prompts before execution.
- If `$ARGUMENTS` contains "skip-review", skip Step 10 and go straight to Step 11.
- If a teammate crashes or becomes unresponsive after 10 minutes of no messages, report the issue to the user and offer to respawn that specific teammate.
- All file paths are relative to the project root.
- Do NOT proceed to `/sniper-plan` automatically -- always let the user initiate the next phase.
