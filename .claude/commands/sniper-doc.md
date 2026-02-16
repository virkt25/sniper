# /sniper-doc -- Generate or Update Project Documentation (Parallel Team)

You are executing the `/sniper-doc` command. Your job is to spawn a documentation team that analyzes the project, generates documentation, and validates it. You are the **team lead** -- you coordinate, you do NOT produce artifacts yourself. Follow every step below precisely.

**Arguments:** $ARGUMENTS

---

## Step 0: Pre-Flight Checks

Perform ALL of the following checks before proceeding. Adjust behavior based on what exists.

### 0a. Detect Project Mode

1. Check if `.sniper/config.yaml` exists and `project.name` is not empty.
2. **If config exists (SNIPER project):**
   - Set mode = `sniper`
   - Read `state.artifacts` to see which artifacts exist (brief, PRD, architecture, etc.)
   - These artifacts are primary sources for documentation generation
3. **If config does not exist (standalone project):**
   - Set mode = `standalone`
   - The team will infer everything from the codebase itself
   - Check for common project files: `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `pom.xml`
   - If none found, STOP and print: "No project metadata found. Cannot generate documentation for an empty directory."

### 0b. Check Existing Documentation

1. Check if `README.md` exists at the project root.
2. Check if `docs/` directory exists and what files are in it.
3. If documentation already exists, default to **update mode** (preserve manual edits via managed sections).
4. If no documentation exists, default to **generate mode** (full generation).

### 0c. Verify Framework Files (SNIPER mode only)

Check that these files exist:
- `.sniper/teams/doc.yaml`
- `.sniper/spawn-prompts/_template.md`
- `.sniper/checklists/doc-review.md`
- `.sniper/personas/process/doc-analyst.md`
- `.sniper/personas/process/doc-writer.md`
- `.sniper/personas/process/doc-reviewer.md`
- `.sniper/personas/cognitive/user-empathetic.md`
- `.sniper/personas/cognitive/mentor-explainer.md`
- `.sniper/personas/cognitive/devils-advocate.md`

If any are missing, print a warning listing the missing files but continue if at least the team YAML exists.

---

## Step 1: Determine Documentation Scope

Ask the user what documentation they want to generate. Present a selection prompt:

> **Documentation Mode:**
> 1. Generate new docs (full generation)
> 2. Update existing docs (incremental — preserves manual edits)
>
> **What to generate:** (select all that apply)
> - README.md
> - Setup guide (docs/setup.md)
> - Architecture overview (docs/architecture.md)
> - API reference (docs/api.md)
> - Contributing guide (CONTRIBUTING.md)
> - Security policy (SECURITY.md)
> - Changelog (CHANGELOG.md)
> - Deployment guide (docs/deployment.md)
> - UI/Component guide (docs/ui-guide.md)

If `$ARGUMENTS` contains "all", skip the prompt and generate everything.
If `$ARGUMENTS` contains specific doc types (e.g., "readme api setup"), generate only those.
If `$ARGUMENTS` contains "update", force update mode.

Store the user's selections for the team.

---

## Step 2: Read Team Definition

1. Read `.sniper/teams/doc.yaml` in full.
2. Parse out:
   - `team_name` (should be `sniper-doc`)
   - The list of `teammates` with their `name`, `compose` layers, and `tasks`
   - The `coordination` rules (analyst → writer handoff)
   - The `review_gate` section (checklist path and mode)
3. Store these values for subsequent steps.

---

## Step 3: Read Project Context

Gather the context that teammates will need:

1. **SNIPER mode:**
   - Read `.sniper/config.yaml` fully — extract `project.name`, `project.description`, `project.type`, `stack`, `domain_packs`, and `ownership` sections.
   - If `domain_packs` is not empty, read domain pack context files.
   - Check which SNIPER artifacts exist in `docs/`: brief.md, prd.md, architecture.md, ux-spec.md, security.md, epics/, stories/
   - Read the relevant templates: doc-readme.md, doc-guide.md, doc-api.md

2. **Standalone mode:**
   - Read project metadata from package.json / Cargo.toml / pyproject.toml / go.mod
   - Scan the project structure (top 3 levels of directories)
   - Identify key source directories, test directories, config files
   - Read the relevant templates: doc-readme.md, doc-guide.md, doc-api.md

---

## Step 4: Compose Spawn Prompts

For each teammate in the team YAML, compose a spawn prompt by assembling persona layers.

### Teammate: doc-analyst

1. Read these persona layer files:
   - Process: `.sniper/personas/process/doc-analyst.md`
   - Technical: SKIP (null in team YAML)
   - Cognitive: `.sniper/personas/cognitive/user-empathetic.md`
   - Domain: If `domain_packs` is set, read domain context. Otherwise skip.

2. Read the spawn prompt template: `.sniper/spawn-prompts/_template.md`

3. Assemble the spawn prompt by filling the template:
   - `{name}` = "doc-analyst"
   - `{process_layer}` = contents of doc-analyst.md
   - `{technical_layer}` = "No specific technical lens for this role."
   - `{cognitive_layer}` = contents of user-empathetic.md
   - `{domain_layer}` = domain context if available, otherwise "No domain pack configured."
   - `{ownership}` = the `docs` ownership paths from config.yaml (or `["docs/", "README.md"]` in standalone mode)

4. Append to the spawn prompt:
   ```
   ## Your Task
   **Task ID:** analyze-project
   **Task Name:** Analyze Project Structure & Artifacts
   **Output File:** docs/.sniper-doc-index.json
   **Mode:** {sniper | standalone}

   Scan the entire project and produce a documentation index. The user has requested
   these doc types: {list of selected doc types from Step 1}.

   Documentation mode: {generate | update}

   {If update mode:}
   Check existing documentation files for `<!-- sniper:managed:start -->` tags.
   Note which docs have managed sections and which are fully manual.

   ## Project Context
   - **Project:** {project.name or inferred name}
   - **Type:** {project.type or inferred type}
   - **Description:** {project.description or inferred description}
   - **Stack:** {summary of stack section or inferred stack}

   ## Instructions
   1. Scan the project root and src/ directories to map the codebase structure.
   2. If SNIPER artifacts exist (docs/brief.md, docs/prd.md, docs/architecture.md, etc.), inventory them as source material.
   3. Identify API routes/endpoints, models/schemas, config files, Docker files, and test files.
   4. For each requested doc type, determine if it: exists and is current, exists but is stale, or is missing.
   5. Write the doc index to `docs/.sniper-doc-index.json`.
   6. When complete, message the team lead that your task is done.
   ```

### Teammate: doc-writer

1. Read these persona layer files:
   - Process: `.sniper/personas/process/doc-writer.md`
   - Technical: Read the technical persona matching the project's primary stack. If `stack.backend` is `node-express`, use `backend.md`. If `stack.frontend` is `react`, use `frontend.md`. In standalone mode, infer from the project. If unclear, skip.
   - Cognitive: `.sniper/personas/cognitive/mentor-explainer.md`
   - Domain: Same as doc-analyst.

2. Assemble using the same template pattern:
   - `{name}` = "doc-writer"
   - `{ownership}` = the `docs` ownership paths plus `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`

3. Append task context for **write-readme**:
   ```
   ## Your Tasks

   ### Task 1: Generate README.md
   **Task ID:** write-readme
   **Output File:** README.md
   **Template:** .sniper/templates/doc-readme.md

   Write the project README. Read the doc index at docs/.sniper-doc-index.json first
   to understand available sources. Follow the template structure.

   {If update mode:}
   The README already exists. Only modify content within `<!-- sniper:managed:start -->`
   and `<!-- sniper:managed:end -->` tags. Preserve everything outside those tags.
   If no managed tags exist, treat the entire file as manual and append new content
   inside managed tags at the end.

   ### Task 2: Generate Documentation Guides
   **Task ID:** write-guides
   **Output Files:** docs/{selected guides}
   **Template:** .sniper/templates/doc-guide.md (for general guides), .sniper/templates/doc-api.md (for API reference)

   Generate the following documentation files: {list of selected doc types minus README}.
   Read the doc index for source material. Follow templates.

   {If update mode:}
   For existing docs, respect managed section boundaries. For new docs, wrap all
   content in managed tags.

   ## Instructions
   1. Wait for the doc-analyst to complete the doc index.
   2. Read `docs/.sniper-doc-index.json` to understand what sources are available.
   3. For README: read the doc-readme template, read source materials, write README.md.
   4. For each guide: read the appropriate template, read source materials, write the file.
   5. Every code example must come from or be verified against the actual codebase.
   6. When both tasks are complete, message the team lead.
   ```

### Teammate: doc-reviewer

1. Read these persona layer files:
   - Process: `.sniper/personas/process/doc-reviewer.md`
   - Technical: SKIP (null)
   - Cognitive: `.sniper/personas/cognitive/devils-advocate.md`
   - Domain: SKIP (null)

2. Assemble using the same template pattern:
   - `{name}` = "doc-reviewer"
   - `{ownership}` = `["docs/"]`

3. Append task context:
   ```
   ## Your Task
   **Task ID:** review-docs
   **Task Name:** Review & Validate Documentation
   **Output File:** docs/.sniper-doc-review.md

   Review all generated documentation for accuracy and completeness.

   ## Instructions
   1. Wait for the doc-writer to complete all documentation.
   2. Read every generated documentation file.
   3. Cross-reference code examples against the actual codebase.
   4. Verify shell commands reference real scripts and binaries.
   5. Check internal links between docs.
   6. Check that setup instructions produce a working environment.
   7. Write the review report to docs/.sniper-doc-review.md.
   8. When complete, message the team lead with a summary (pass/fail count).
   ```

---

## Step 5: Create the Agent Team

Use the TeamCreate tool to create the team:

```
TeamCreate:
  team_name: "sniper-doc"
  description: "SNIPER Documentation: Generate/update docs for {project name}"
```

---

## Step 6: Create Tasks in the Shared Task List

Create tasks with dependencies matching the team YAML.

### Task 1: Analyze Project

```
TaskCreate:
  subject: "Analyze Project Structure & Artifacts"
  description: "Scan the codebase and SNIPER artifacts. Produce documentation index at docs/.sniper-doc-index.json. Determine what docs exist, what's missing, what's stale."
  activeForm: "Analyzing project structure"
```

### Task 2: Generate README

```
TaskCreate:
  subject: "Generate README.md"
  description: "Write the project README from artifacts and codebase analysis. Follow doc-readme template. Output: README.md"
  activeForm: "Writing README.md"
```
Set dependency: blocked_by Task 1.

### Task 3: Generate Documentation Guides

```
TaskCreate:
  subject: "Generate Documentation Guides"
  description: "Generate selected documentation files (setup, architecture, API, deployment, etc.) based on doc index. Output: docs/ directory"
  activeForm: "Writing documentation guides"
```
Set dependency: blocked_by Task 1.

### Task 4: Review Documentation

```
TaskCreate:
  subject: "Review & Validate Documentation"
  description: "Review all generated docs for accuracy, completeness, consistency. Verify code examples, links, and setup instructions. Output: docs/.sniper-doc-review.md"
  activeForm: "Reviewing documentation"
```
Set dependency: blocked_by Task 2 AND Task 3.

---

## Step 7: Spawn Teammates

Spawn each teammate using the Task tool. Use the composed spawn prompts from Step 4.

For each teammate, spawn using:
- `team_name`: "sniper-doc"
- `name`: the teammate name from the YAML (doc-analyst, doc-writer, doc-reviewer)
- The full composed spawn prompt as the instruction

Spawn all three teammates. The doc-analyst works first (unblocked), the doc-writer waits for the index, and the doc-reviewer waits for the writer.

After spawning, assign each task to its corresponding teammate using TaskUpdate with the `owner` field:
- Task 1 (Analyze Project) -> owner: "doc-analyst"
- Task 2 (Generate README) -> owner: "doc-writer"
- Task 3 (Generate Guides) -> owner: "doc-writer"
- Task 4 (Review Docs) -> owner: "doc-reviewer"

Mark Task 1 as `in_progress`. Tasks 2, 3, 4 remain `pending` (blocked).

---

## Step 8: Enter Delegate Mode

**You are now the team lead. You do NOT produce artifacts.**

Your responsibilities during execution:
1. Monitor task progress via TaskList
2. When doc-analyst completes, unblock Tasks 2 and 3 — message doc-writer that the index is ready
3. When doc-writer completes both tasks, unblock Task 4 — message doc-reviewer to begin review
4. Respond to teammate messages (questions, blockers, completion notifications)
5. Track which teammates have completed their work

**Do NOT:**
- Write any documentation files yourself
- Modify teammate artifacts
- Analyze the codebase yourself

Wait for all teammates to report completion.

---

## Step 9: Verify Artifacts Exist

Once all teammates report completion:

1. Verify `docs/.sniper-doc-index.json` exists and is valid JSON.
2. Verify each requested documentation file exists and is non-empty.
3. Verify `docs/.sniper-doc-review.md` exists.
4. If any file is missing or empty, message the responsible teammate and ask them to complete it.
5. Do NOT proceed to Step 10 until all files exist.

---

## Step 10: Run Review Gate

Read the review gate configuration from the team YAML: `review_gate.mode` and `review_gate.checklist`.

1. Read the review report at `docs/.sniper-doc-review.md` (produced by the doc-reviewer).
2. Read the review checklist at `.sniper/checklists/doc-review.md`.
3. Cross-reference the review report with the checklist.
4. Compile a gate summary.

### Gate Decision

The doc gate mode is **flexible**:

- **If there are no FAIL items in the review report:** Auto-advance. Print the summary.
- **If there are FAIL items:** Present the failures to the user and ask:
  > "The documentation review found {N} critical issues. Would you like to:
  > 1. Have the writer fix the issues
  > 2. Accept the docs as-is
  > 3. Stop and fix manually"

  If option 1: Message doc-writer with the specific failures, wait for fixes, then re-run review.
  If option 2: Proceed.
  If option 3: STOP.

---

## Step 11: Clean Up and Shut Down Team

### Remove Temporary Files

The `docs/.sniper-doc-index.json` file is an intermediate artifact. Ask the user if they want to keep it (useful for future incremental updates) or delete it.

### Shut Down Teammates

Send a shutdown request to each teammate:
- Send shutdown_request to "doc-analyst"
- Send shutdown_request to "doc-writer"
- Send shutdown_request to "doc-reviewer"

Wait for all teammates to acknowledge shutdown.

---

## Step 12: Present Results

Print a formatted summary:

```
============================================
  SNIPER Doc: Documentation Complete
============================================

  Mode: {sniper | standalone}
  Action: {generate | update}

  Files Generated/Updated:
    - README.md                 [generated | updated]
    - docs/setup.md             [generated | updated | skipped]
    - docs/architecture.md      [generated | updated | skipped]
    - docs/api.md               [generated | updated | skipped]
    - ...

  Review:
    Passed: {count}/{total} checks
    Warnings: {count}
    Critical: {count}

============================================
  Documentation is ready for review.
  Run `/sniper-doc update` anytime to refresh.
============================================
```

---

## IMPORTANT RULES

- You are the LEAD. You coordinate. You do NOT write documentation yourself.
- The doc-analyst MUST complete before the doc-writer starts.
- The doc-writer MUST complete before the doc-reviewer starts.
- If `$ARGUMENTS` contains "dry-run", perform Steps 0-4 only (compose prompts) and print them without spawning.
- If `$ARGUMENTS` contains "skip-review", skip the doc-reviewer teammate entirely (only spawn analyst and writer).
- `/sniper-doc` does NOT modify lifecycle state in config.yaml — it is a utility, not a phase.
- In update mode, NEVER overwrite content outside `<!-- sniper:managed -->` tags.
- All file paths are relative to the project root.
- This command works regardless of current lifecycle phase — it can run during discover, plan, or sprint.
