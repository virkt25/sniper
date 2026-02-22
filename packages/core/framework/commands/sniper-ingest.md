# /sniper-ingest -- Codebase Ingestion (Parallel Team)

You are executing the `/sniper-ingest` command. Your job is to spawn a parallel team that reverse-engineers planning artifacts from an existing codebase. You are the **team lead** -- you coordinate, you do NOT produce artifacts yourself. Follow every step below precisely.

**Arguments:** $ARGUMENTS

---

## Step 0: Pre-Flight Checks

Perform ALL of the following checks before proceeding. If any check fails, STOP and report the issue.

### 0a. Verify SNIPER Is Initialized

1. Read `.sniper/config.yaml`.
2. If the file does not exist or `project.name` is empty:
   - **STOP.** Print: "SNIPER is not initialized. Run `/sniper-init` first."
   - Do not proceed further.

### 0b. Config Migration Check

1. Read `schema_version` from `.sniper/config.yaml`.
2. If `schema_version` is absent or less than 2, run the v1→v2 migration as defined in the Config Reader Protocol (see `plans/features/phase-a-config-schema.md`). Write the updated config before proceeding.

### 0c. Parse Arguments

1. **`--scope`:** If provided (e.g., `--scope "src/api/ src/models/"`), validate that each listed directory exists. If any directory does not exist, print a warning but continue with the directories that do exist. Store the scope list for Step 4.
2. **`--update`:** If provided, force amendment mode regardless of whether artifacts already exist.

### 0d. Verify Phase State

1. Determine the current active phase: find the last entry in `state.phase_log` where `completed_at` is null.
2. **If no active phase (all completed or empty log):** Good -- proceed.
3. **If active phase is `ingest`:** The ingest phase is already in progress.
   - Ask the user: "An ingest phase is already in progress ({context}). Options: (a) Resume it (b) Start a new ingestion"
   - If resume, STOP (they should continue in the existing session).
4. **If active phase is something else** (discover, plan, solve, sprint):
   - Ask the user: "You have an active {phase} phase ({context}) that hasn't completed. Options: (a) Pause it and start ingest (b) Complete {phase} first"
   - If (b), STOP.

### 0e. Amendment Detection

1. Check if the target artifact files already exist and are non-empty:
   - `docs/brief.md`
   - `docs/architecture.md`
   - `docs/conventions.md`
2. **If ANY exist AND `--update` was NOT passed:**
   - Ask the user: "The following artifacts already exist: {list}. Options: (a) Amend existing artifacts (b) Overwrite from scratch (c) Cancel"
   - If (a): Enter amendment mode. Note which files exist and their current version numbers.
   - If (b): Normal create mode. Agents will overwrite.
   - If (c): STOP.
3. **If `--update` was passed:** Enter amendment mode for any artifacts that exist.
4. **If NONE exist:** Normal create mode.

### 0f. Verify Framework Files

Check that these files exist (they are needed by the team):
- `.sniper/teams/ingest.yaml`
- `.sniper/spawn-prompts/_template.md`
- `.sniper/checklists/ingest-review.md`
- `.sniper/personas/process/code-archaeologist.md`
- `.sniper/personas/process/architecture-cartographer.md`
- `.sniper/personas/process/convention-miner.md`
- `.sniper/personas/cognitive/systems-thinker.md`
- `.sniper/templates/brief.md`
- `.sniper/templates/architecture.md`
- `.sniper/templates/conventions.md`

If any are missing, print a warning listing the missing files but continue if at least the team YAML exists.

---

## Step 1: Update Lifecycle State

Edit `.sniper/config.yaml` to update the state section:

1. Append to `state.phase_log`:
   ```yaml
   - phase: ingest
     context: "{scope if --scope provided, otherwise 'full-codebase'}{' (update)' if amendment mode}"
     started_at: "{current ISO timestamp}"
     completed_at: null
     approved_by: null
   ```

---

## Step 2: Read Team Definition

1. Read `.sniper/teams/ingest.yaml` in full.
2. Parse out:
   - `team_name` (should be `sniper-ingest`)
   - The list of `teammates` with their `name`, `compose` layers, and `tasks`
   - The `coordination` rules (should be empty -- all tasks are independent)
   - The `review_gate` section (checklist path and mode)
3. Store these values for subsequent steps.

---

## Step 3: Read Project Context

Gather the context that teammates will need:

1. Read `.sniper/config.yaml` fully -- extract `project.name`, `project.description`, `project.type`, `stack`, and `ownership` sections.
2. Get the project's directory tree by listing top-level directories and key files. If `--scope` was provided, focus the tree listing on those directories.
3. Read `package.json` / `pyproject.toml` / `Cargo.toml` (whichever exists) -- this gives agents dependency context.
4. If `README.md` exists, note its location for agents to read.

---

## Step 4: Compose Spawn Prompts

For each teammate in the team YAML, compose a spawn prompt by assembling persona layers. Do this by reading the actual persona files and assembling them into the template.

### Teammate: code-archaeologist

1. Read these persona layer files:
   - Process: `.sniper/personas/process/code-archaeologist.md`
   - Technical: SKIP (null in team YAML)
   - Cognitive: `.sniper/personas/cognitive/systems-thinker.md`

2. Read the spawn prompt template: `.sniper/spawn-prompts/_template.md`

3. Assemble the spawn prompt by filling the template:
   - `{name}` = "code-archaeologist"
   - `{process_layer}` = contents of the process persona file
   - `{technical_layer}` = "No specific technical lens for this role."
   - `{cognitive_layer}` = contents of the cognitive persona file
   - `{domain_layer}` = "No domain pack configured."
   - `{ownership}` = the `docs` ownership paths from `config.yaml`

4. Append to the spawn prompt:
   ```
   ## Your Task
   **Task ID:** project-brief
   **Task Name:** Reverse-engineer Project Brief
   **Output File:** docs/brief.md
   **Template:** .sniper/templates/brief.md

   {task description from the team YAML}

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Description:** {project.description}
   - **Stack:** {summary of stack section}
   {if --scope: "- **Scope:** Only analyze these directories: {scope list}"}

   ## Key Files to Read
   - `package.json` / `pyproject.toml` / `Cargo.toml` (project metadata, dependencies)
   - `README.md` (if exists)
   - Top-level directory structure
   - Key entry points (`src/index.ts`, `src/main.py`, `app/`, etc.)
   - CI/CD configs (`.github/workflows/`, `Dockerfile`, etc.)
   - Environment files (`.env.example`, NOT `.env`)

   ## Instructions (Create Mode -- when docs/brief.md does NOT exist)
   1. Read the template at `.sniper/templates/brief.md` to understand the expected output format.
   2. Read the codebase to understand what this project does, what problem it solves, and who uses it.
   3. Produce the artifact at `docs/brief.md` following the template exactly.
   4. This is a REVERSE-ENGINEERING exercise: describe what IS, not what SHOULD BE.
   5. For sections you cannot infer from code, write "Unable to determine from codebase analysis."
   6. Every section in the template MUST be filled -- no empty sections.
   7. When complete, message the team lead that your task is done.

   ## Instructions (Amendment Mode -- when docs/brief.md already exists)
   1. Read the EXISTING artifact at `docs/brief.md` first. Note its current version number.
   2. Read the template at `.sniper/templates/brief.md` to understand the expected format.
   3. AMEND the existing brief: update sections that need changes, add new information, preserve content outside managed sections (<!-- sniper:managed --> markers).
   4. Increment the version number in the header (e.g., v1 -> v2).
   5. Add a changelog entry describing what changed.
   6. Set Status back to "Draft" (even if it was previously "Approved").
   7. When complete, message the team lead that your task is done.
   ```

5. Save this composed prompt as a variable for spawning.

### Teammate: architecture-cartographer

1. Read these persona layer files:
   - Process: `.sniper/personas/process/architecture-cartographer.md`
   - Technical: `.sniper/personas/technical/backend.md`
   - Cognitive: `.sniper/personas/cognitive/systems-thinker.md`

2. Assemble using the same template pattern:
   - `{name}` = "architecture-cartographer"
   - `{technical_layer}` = contents of the backend technical persona
   - `{ownership}` = the `docs` ownership paths

3. Append task context:
   ```
   ## Your Task
   **Task ID:** system-architecture
   **Task Name:** Reverse-engineer System Architecture
   **Output File:** docs/architecture.md
   **Template:** .sniper/templates/architecture.md

   {task description from the team YAML}

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Description:** {project.description}
   - **Stack:** {summary of stack section}
   {if --scope: "- **Scope:** Only analyze these directories: {scope list}"}

   ## Key Files to Read
   - Full directory tree (to map component boundaries)
   - Database schemas / migrations / ORM models
   - API route definitions (Express routes, FastAPI endpoints, etc.)
   - Configuration files (database connections, cache, queue configs)
   - Infrastructure files (Docker, Terraform, K8s manifests)
   - Key service files (to understand component responsibilities)
   - Dependency graph (imports between modules)

   ## Instructions (Create Mode)
   1. Read the template at `.sniper/templates/architecture.md` to understand the expected output format.
   2. Map the complete technical architecture from the source code.
   3. Produce a component diagram (ASCII or Mermaid) of the system AS BUILT.
   4. Document data models with actual field names, types, and relationships.
   5. Document API contracts with actual endpoint paths, methods, and request/response shapes.
   6. Note technical debt and inconsistencies: "Pattern inconsistency found: {detail}".
   7. Do NOT hallucinate components -- only document what you can trace to actual code.
   8. Write the output to `docs/architecture.md` following the template exactly.
   9. When complete, message the team lead that your task is done.

   ## Instructions (Amendment Mode)
   1. Read the EXISTING artifact at `docs/architecture.md` first. Note its current version number.
   2. Read the template at `.sniper/templates/architecture.md` to understand the expected format.
   3. AMEND the existing architecture: update components, data models, APIs that have changed. Preserve content outside managed sections.
   4. Increment the version number in the header.
   5. Add a changelog entry describing what changed.
   6. Set Status back to "Draft".
   7. When complete, message the team lead that your task is done.
   ```

### Teammate: convention-miner

1. Read these persona layer files:
   - Process: `.sniper/personas/process/convention-miner.md`
   - Technical: SKIP (null)
   - Cognitive: `.sniper/personas/cognitive/systems-thinker.md`

2. Assemble using the same template pattern:
   - `{name}` = "convention-miner"
   - `{technical_layer}` = "No specific technical lens for this role."
   - `{ownership}` = ALL ownership paths (this agent updates them)

3. Append task context:
   ```
   ## Your Task
   **Task ID:** conventions
   **Task Name:** Extract Coding Conventions
   **Output File:** docs/conventions.md AND updates to .sniper/config.yaml (ownership section)
   **Template:** .sniper/templates/conventions.md

   {task description from the team YAML}

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Description:** {project.description}
   - **Stack:** {summary of stack section}
   {if --scope: "- **Scope:** Only analyze these directories: {scope list}"}

   ## Key Files to Read
   - Linter/formatter configs: `.eslintrc*`, `.prettierrc*`, `tsconfig*`, `ruff.toml`, `pyproject.toml`
   - At least 5-10 representative source files from different parts of the codebase
   - Test files (to understand test patterns)
   - The full directory tree (to update ownership paths)

   ## Instructions (Create Mode)
   1. Read the template at `.sniper/templates/conventions.md` to understand the expected output format.
   2. Sample multiple files (at least 5-10) from different directories.
   3. For each convention category, identify the dominant pattern (appears in 80%+ of relevant files).
   4. Every convention MUST cite a real code example with file path and code snippet.
   5. If patterns are inconsistent, document BOTH patterns and note the inconsistency.
   6. Write the output to `docs/conventions.md` following the template exactly.
   7. ALSO update `.sniper/config.yaml` ownership section:
      - Read the actual project directory structure.
      - Replace the template default ownership paths with paths that match the real project layout.
      - Categorize directories into: backend, frontend, shared, infrastructure, tests, docs.
      - Only include directories that actually exist.
   8. When complete, message the team lead that your task is done.

   ## Instructions (Amendment Mode)
   1. Read the EXISTING artifact at `docs/conventions.md` first. Note its current version number.
   2. Read the template at `.sniper/templates/conventions.md` to understand the expected format.
   3. AMEND the existing conventions: update patterns that have changed, add newly discovered conventions, preserve content outside managed sections.
   4. Re-check the `.sniper/config.yaml` ownership paths and update if the directory structure has changed.
   5. Increment the version number in the header.
   6. Add a changelog entry describing what changed.
   7. Set Status back to "Draft".
   8. When complete, message the team lead that your task is done.
   ```

---

## Step 5: Create the Agent Team

Use the TeamCreate tool to create the team:

```
TeamCreate:
  team_name: "sniper-ingest"
  description: "SNIPER Codebase Ingestion for {project.name}"
```

---

## Step 6: Create Tasks in the Shared Task List

Create one task per teammate using TaskCreate. All tasks are independent -- no dependencies.

### Task 1: Project Brief

```
TaskCreate:
  subject: "Reverse-engineer Project Brief"
  description: "Read the codebase and produce docs/brief.md capturing what this project does, what problem it solves, who uses it, and its current scope. Focus on what IS, not what SHOULD BE. Follow template at .sniper/templates/brief.md."
  activeForm: "Reverse-engineering project brief from codebase"
```

### Task 2: System Architecture

```
TaskCreate:
  subject: "Reverse-engineer System Architecture"
  description: "Map the complete technical architecture from source code. Produce docs/architecture.md with component diagrams, data models, API contracts, infrastructure topology, and cross-cutting concerns. Document the system AS BUILT. Follow template at .sniper/templates/architecture.md."
  activeForm: "Mapping system architecture from source code"
```

### Task 3: Coding Conventions

```
TaskCreate:
  subject: "Extract Coding Conventions"
  description: "Analyze the codebase to extract coding conventions with real code examples. Produce docs/conventions.md AND update .sniper/config.yaml ownership paths to match actual project structure. Follow template at .sniper/templates/conventions.md."
  activeForm: "Extracting coding conventions and patterns"
```

No dependencies between tasks -- all three run in parallel.

---

## Step 7: Spawn Teammates

Spawn each teammate using the Task tool. Use the composed spawn prompts from Step 4.

For each teammate, spawn using:
- `team_name`: "sniper-ingest"
- `name`: the teammate name from the YAML (code-archaeologist, architecture-cartographer, convention-miner)
- The full composed spawn prompt as the instruction

Spawn all three teammates. They will work in parallel on their independent tasks.

After spawning, assign each task to its corresponding teammate using TaskUpdate with the `owner` field:
- Task 1 (Project Brief) -> owner: "code-archaeologist"
- Task 2 (System Architecture) -> owner: "architecture-cartographer"
- Task 3 (Coding Conventions) -> owner: "convention-miner"

Mark each task as `in_progress` via TaskUpdate.

---

## Step 8: Enter Delegate Mode

**You are now the team lead. You do NOT produce artifacts.**

Your responsibilities during execution:
1. Monitor task progress via TaskList
2. Respond to teammate messages (questions, blockers, completion notifications)
3. If a teammate asks about project structure or where to find files, provide guidance from the project context
4. If a teammate finishes early, acknowledge their completion and update their task status to `completed`
5. Track which teammates have completed their work

**Do NOT:**
- Write to `docs/brief.md`, `docs/architecture.md`, or `docs/conventions.md` yourself
- Modify teammate artifacts
- Analyze the codebase yourself

Wait for all three teammates to report completion.

---

## Step 9: Verify Artifacts Exist

Once all three teammates report completion:

1. Verify these files exist and are non-empty:
   - `docs/brief.md`
   - `docs/architecture.md`
   - `docs/conventions.md`

2. Verify the ownership section in `.sniper/config.yaml` has been updated (paths should not match the template defaults unless the project happens to use the default structure).

3. If any file is missing or empty, message the responsible teammate and ask them to complete it.

4. Do NOT proceed to Step 10 until all three files exist and contain content.

---

## Step 10: Run Review Gate

Read the review gate configuration from the team YAML: `review_gate.mode` and `review_gate.checklist`.

1. Read the review checklist at `.sniper/checklists/ingest-review.md`.
2. For each checklist item, perform a quick evaluation by reading the relevant artifact and checking if the item is addressed.
3. Compile a review summary with:
   - Total checklist items
   - Items that PASS
   - Items that NEED ATTENTION (not fully met but not blocking)
   - Items that FAIL (critical gaps)

### Gate Decision

The ingest gate mode is **flexible**:

- **If there are no FAIL items:** Auto-advance. Print the review summary and note any NEED ATTENTION items for async review.
- **If there are FAIL items:** Present the failures to the user and ask:
  > "The ingestion review found {N} critical issues. Would you like to:
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

1. Update artifact tracking (increment version if amendment mode):
   - Set `state.artifacts.brief.status: draft` and increment `state.artifacts.brief.version`
   - Set `state.artifacts.architecture.status: draft` and increment `state.artifacts.architecture.version`
   - Set `state.artifacts.conventions.status: draft` and increment `state.artifacts.conventions.version`
2. Update the ingest entry in `state.phase_log` to add `completed_at: "{current ISO timestamp}"`
3. If auto-advanced (flexible gate passed), set `approved_by: "auto-flexible"`

### Shut Down Teammates

Send a shutdown request to each teammate:
- Send shutdown_request to "code-archaeologist"
- Send shutdown_request to "architecture-cartographer"
- Send shutdown_request to "convention-miner"

Wait for all teammates to acknowledge shutdown.

---

## Step 12: Present Results and Next Steps

Print a formatted summary:

```
============================================
  SNIPER Codebase Ingestion Complete
============================================

  Artifacts Produced:
    - docs/brief.md          [draft] {v1 or vN}
    - docs/architecture.md   [draft] {v1 or vN}
    - docs/conventions.md    [draft] {v1 or vN}

  Config Updated:
    - ownership paths updated to match project structure

  Review Gate: FLEXIBLE
    Passed: {count}/{total} checklist items
    Attention: {count} items flagged for async review
    Failed: {count} critical issues

  Phase Duration: {time elapsed}

============================================
  Next Steps
============================================

  1. Review the ingested artifacts in `docs/`
  2. These artifacts provide the foundation for:
     - /sniper-feature  -- add incremental features using the architecture as reference
     - /sniper-discover -- run discovery if you want market/risk/persona analysis
     - /sniper-plan     -- run planning if you want a PRD and UX spec
     - /sniper-audit    -- audit the codebase using the architecture as baseline
  3. Run /sniper-status to see the full lifecycle state

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
- Do NOT proceed to other phases automatically -- always let the user initiate the next command.
- The convention-miner modifies `.sniper/config.yaml` (ownership section only). This is the ONLY case where a teammate modifies config. Warn the team lead to verify the ownership update after completion.
