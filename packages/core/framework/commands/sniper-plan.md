# /sniper-plan -- Phase 2: Planning & Architecture (Parallel Team with Coordination)

You are executing the `/sniper-plan` command. Your job is to spawn a planning team that produces the PRD, system architecture, UX specification, and security requirements. This phase has **task dependencies** and **coordination pairs** -- you must manage the flow. You are the **team lead** -- you coordinate, you do NOT produce artifacts yourself. Follow every step below precisely.

**Arguments:** $ARGUMENTS

---

## Step 0: Pre-Flight Checks

Perform ALL checks before proceeding. If any critical check fails, STOP.

### 0a. Verify SNIPER Is Initialized

1. Read `.sniper/config.yaml`.
2. If the file does not exist or `project.name` is empty:
   - **STOP.** Print: "SNIPER is not initialized. Run `/sniper-init` first."

### 0b. Verify Phase 1 Artifacts Exist

Check that the following files exist and are non-empty:

1. `docs/brief.md` -- **REQUIRED.** If missing, STOP and print: "Phase 1 artifact `docs/brief.md` is missing. Run `/sniper-discover` first."
2. `docs/risks.md` -- Recommended but not blocking. If missing, print a warning.
3. `docs/personas.md` -- Recommended but not blocking. If missing, print a warning.

### 0c. Verify Phase State

1. Read `state.current_phase` from config.yaml.
2. **If `current_phase` is `discover` or artifacts exist:** Good -- discover is complete or was completed. Proceed.
3. **If `current_phase` is `plan`:** Already in progress or was interrupted.
   - Ask the user: "The plan phase appears to be in progress. Do you want to restart it? This will overwrite planning artifacts. (yes/no)"
   - If no, STOP.
4. **If `current_phase` is `solve` or `sprint`:** Project has progressed past planning.
   - Ask the user: "The project is in the '{current_phase}' phase. Re-running plan will reset progress. Are you sure? (yes/no)"
   - If no, STOP.
5. **If `current_phase` is `null`:** No phase has run. Check if artifacts exist anyway (manual creation). If `docs/brief.md` exists, proceed with a warning. Otherwise STOP.

### 0d. Verify Framework Files

Check that these files exist:
- `.sniper/teams/plan.yaml`
- `.sniper/spawn-prompts/_template.md`
- `.sniper/checklists/plan-review.md`
- `.sniper/personas/process/product-manager.md`
- `.sniper/personas/process/architect.md`
- `.sniper/personas/process/ux-designer.md`
- `.sniper/personas/technical/api-design.md`
- `.sniper/personas/technical/backend.md`
- `.sniper/personas/technical/frontend.md`
- `.sniper/personas/technical/security.md`
- `.sniper/personas/cognitive/systems-thinker.md`
- `.sniper/personas/cognitive/security-first.md`
- `.sniper/personas/cognitive/user-empathetic.md`
- `.sniper/templates/prd.md`
- `.sniper/templates/architecture.md`
- `.sniper/templates/ux-spec.md`

Report any missing files as warnings. Continue if the team YAML and key personas exist.

---

## Step 1: Update Lifecycle State

Edit `.sniper/config.yaml`:

1. Set `state.current_phase: plan`
2. Append to `state.phase_history`:
   ```yaml
   - phase: plan
     started_at: "{current ISO timestamp}"
     completed_at: null
     approved_by: null
   ```

---

## Step 2: Read Team Definition

1. Read `.sniper/teams/plan.yaml` in full.
2. Parse out:
   - `team_name`: `sniper-plan`
   - `model_override`: `opus` -- note this for all teammate spawns
   - The list of `teammates` with their `name`, `compose` layers, `tasks` (including `reads`, `blocked_by`, `plan_approval`)
   - The `coordination` pairs
   - The `review_gate` section (should be `strict`)
3. Map out the dependency graph:
   - `product-manager` (prd) -> NO dependencies, starts immediately
   - `architect` (architecture) -> blocked_by: [prd]
   - `ux-designer` (ux-spec) -> blocked_by: [prd]
   - `security-analyst` (security) -> blocked_by: [prd]
4. Note: `architect` has `plan_approval: true` -- you MUST approve their approach before they execute.

---

## Step 3: Read Project Context and Phase 1 Artifacts

1. Read `.sniper/config.yaml` for project settings, stack, and ownership.
2. Read the Phase 1 discovery artifacts:
   - `docs/brief.md`
   - `docs/risks.md` (if exists)
   - `docs/personas.md` (if exists)
3. Read the artifact templates:
   - `.sniper/templates/prd.md`
   - `.sniper/templates/architecture.md`
   - `.sniper/templates/ux-spec.md`
4. If `domain_pack` is set, read domain context files.

---

## Step 4: Compose Spawn Prompts

For each teammate, compose a spawn prompt by reading persona layer files and assembling them into the template from `.sniper/spawn-prompts/_template.md`.

### Teammate: product-manager

1. Read persona layers:
   - Process: `.sniper/personas/process/product-manager.md`
   - Technical: `.sniper/personas/technical/api-design.md`
   - Cognitive: `.sniper/personas/cognitive/systems-thinker.md`
   - Domain: domain pack context if configured, otherwise skip

2. Assemble using the spawn template:
   - `{name}` = "product-manager"
   - `{ownership}` = the `docs` ownership paths from config.yaml

3. Append task context:
   ```
   ## Your Task
   **Task ID:** prd
   **Task Name:** Product Requirements Document
   **Output File:** docs/prd.md
   **Template:** .sniper/templates/prd.md

   Write a comprehensive PRD covering: problem statement, user stories, feature requirements
   (P0/P1/P2), success metrics, constraints, and out-of-scope items. This is the single
   source of truth for what to build.

   ## Required Reading (read these BEFORE writing)
   - docs/brief.md
   - docs/personas.md (if exists)
   - docs/risks.md (if exists)

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Description:** {project.description}
   - **Stack:** {summary of stack section}

   ## Instructions
   1. Read ALL the required reading files listed above.
   2. Read the template at `.sniper/templates/prd.md` for expected output format.
   3. Synthesize the discovery artifacts into a coherent PRD.
   4. Every P0 requirement MUST have testable acceptance criteria.
   5. User stories must reference the personas from `docs/personas.md`.
   6. Write the complete output to `docs/prd.md`.
   7. When complete, message the team lead. Other teammates are waiting on your output.
   ```

### Teammate: architect

1. Read persona layers:
   - Process: `.sniper/personas/process/architect.md`
   - Technical: `.sniper/personas/technical/backend.md`
   - Cognitive: `.sniper/personas/cognitive/security-first.md`
   - Domain: domain pack context if configured

2. Assemble using the spawn template:
   - `{name}` = "architect"
   - `{ownership}` = the `docs` ownership paths

3. Append task context:
   ```
   ## Your Task
   **Task ID:** architecture
   **Task Name:** System Architecture Document
   **Output File:** docs/architecture.md
   **Template:** .sniper/templates/architecture.md
   **IMPORTANT:** This task has `plan_approval: true`. You MUST describe your approach first and wait for the team lead to approve before writing the full document.

   Design the complete system architecture including: component diagram, data models,
   API contracts, infrastructure topology, technology choices with rationale, and
   non-functional requirements.

   ## Required Reading (read these BEFORE starting)
   - docs/prd.md (WAIT for this to be completed first -- you are blocked until it exists)
   - docs/brief.md
   - docs/risks.md (if exists)

   ## Coordination
   - You will coordinate with `security-analyst` -- they will review your security architecture decisions.
   - You will coordinate with `ux-designer` -- align frontend component boundaries with your API contracts.
   - When you have API contracts drafted, message `ux-designer` to validate component hierarchy.
   - When you have security architecture drafted, message `security-analyst` for review.

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Stack:** {full stack details}

   ## Instructions
   1. WAIT until `docs/prd.md` exists (the product-manager must complete it first).
   2. Read all required reading files.
   3. Read the template at `.sniper/templates/architecture.md`.
   4. **PLAN APPROVAL REQUIRED:** Before writing the full architecture, describe your high-level approach to the team lead:
      - Proposed component boundaries
      - Key technology choices and rationale
      - Data flow overview
      - Infrastructure topology approach
      Wait for the lead to approve or provide feedback before proceeding.
   5. After approval, write the complete architecture document to `docs/architecture.md`.
   6. Message `security-analyst` and `ux-designer` when your document is ready for their review.
   7. Message the team lead when complete.
   ```

### Teammate: ux-designer

1. Read persona layers:
   - Process: `.sniper/personas/process/ux-designer.md`
   - Technical: `.sniper/personas/technical/frontend.md`
   - Cognitive: `.sniper/personas/cognitive/user-empathetic.md`
   - Domain: domain pack context if configured

2. Assemble using the spawn template:
   - `{name}` = "ux-designer"
   - `{ownership}` = the `docs` ownership paths

3. Append task context:
   ```
   ## Your Task
   **Task ID:** ux-spec
   **Task Name:** UX Specification
   **Output File:** docs/ux-spec.md
   **Template:** .sniper/templates/ux-spec.md

   Create the UX specification: information architecture, screen inventory, key user flows
   (with decision trees), component hierarchy, interaction patterns, and responsive breakpoints.

   ## Required Reading (read these BEFORE starting)
   - docs/prd.md (WAIT for this to be completed first -- you are blocked until it exists)
   - docs/personas.md (if exists)

   ## Coordination
   - You will coordinate with `architect` -- validate that your component hierarchy aligns with their API contracts and backend architecture.
   - When the architect shares their API contracts, review them and provide feedback on frontend data needs.

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Stack:** {frontend framework, etc.}

   ## Instructions
   1. WAIT until `docs/prd.md` exists.
   2. Read all required reading files.
   3. Read the template at `.sniper/templates/ux-spec.md`.
   4. Write the UX specification to `docs/ux-spec.md`.
   5. When `architect` messages you about API contracts, review and provide feedback.
   6. Message the team lead when complete.
   ```

### Teammate: security-analyst

1. Read persona layers:
   - Process: `.sniper/personas/process/architect.md`
   - Technical: `.sniper/personas/technical/security.md`
   - Cognitive: `.sniper/personas/cognitive/security-first.md`
   - Domain: domain pack context if configured

2. Assemble using the spawn template:
   - `{name}` = "security-analyst"
   - `{ownership}` = the `docs` ownership paths

3. Append task context:
   ```
   ## Your Task
   **Task ID:** security
   **Task Name:** Security & Compliance Requirements
   **Output File:** docs/security.md

   Define security architecture: auth model, data encryption strategy, compliance requirements
   (with specific regulations), threat model, and security testing requirements.

   ## Required Reading (read these BEFORE starting)
   - docs/prd.md (WAIT for this to be completed first)
   - docs/risks.md (if exists)

   ## Coordination
   - You will coordinate with `architect` -- review their architecture for security concerns.
   - When the architect shares their document, review it and provide security feedback via messaging.

   ## Project Context
   - **Project:** {project.name}
   - **Type:** {project.type}
   - **Stack:** {infrastructure, etc.}

   ## Instructions
   1. WAIT until `docs/prd.md` exists.
   2. Read all required reading files.
   3. Write the security requirements to `docs/security.md`.
   4. When `architect` messages you about their architecture, review it for security concerns and provide feedback.
   5. If you find security issues in the architecture, message the architect directly with specific concerns.
   6. Message the team lead when complete.
   ```

---

## Step 5: Create the Agent Team

Use the TeamCreate tool:

```
TeamCreate:
  team_name: "sniper-plan"
  description: "SNIPER Phase 2: Planning & Architecture for {project.name}. Model override: opus."
```

---

## Step 6: Create Tasks with Dependencies

Create tasks in the shared task list. **Dependencies matter here** -- the architect, UX designer, and security analyst are all blocked by the product manager completing the PRD.

### Task 1: PRD (no dependencies -- starts immediately)

```
TaskCreate:
  subject: "Write the Product Requirements Document"
  description: "Synthesize discovery artifacts into a comprehensive PRD. Output: docs/prd.md. Template: .sniper/templates/prd.md. Reads: docs/brief.md, docs/personas.md, docs/risks.md. This task BLOCKS architect, ux-designer, and security-analyst."
  activeForm: "Writing the Product Requirements Document"
```

### Task 2: Architecture (blocked by PRD)

```
TaskCreate:
  subject: "Design the system architecture"
  description: "Design complete system architecture with components, data models, API contracts, infrastructure. Output: docs/architecture.md. Template: .sniper/templates/architecture.md. PLAN APPROVAL REQUIRED: must describe approach and get lead approval before executing. Blocked by: PRD task."
  activeForm: "Designing system architecture"
```

After creating Task 2, set its dependency:
```
TaskUpdate:
  taskId: "{task 2 id}"
  addBlockedBy: ["{task 1 id}"]
```

### Task 3: UX Specification (blocked by PRD)

```
TaskCreate:
  subject: "Create the UX specification"
  description: "Define information architecture, screen inventory, user flows, component hierarchy, responsive breakpoints. Output: docs/ux-spec.md. Template: .sniper/templates/ux-spec.md. Blocked by: PRD task."
  activeForm: "Creating UX specification"
```

After creating Task 3, set its dependency:
```
TaskUpdate:
  taskId: "{task 3 id}"
  addBlockedBy: ["{task 1 id}"]
```

### Task 4: Security Requirements (blocked by PRD)

```
TaskCreate:
  subject: "Define security and compliance requirements"
  description: "Define auth model, encryption, compliance, threat model, security testing. Output: docs/security.md. Blocked by: PRD task."
  activeForm: "Defining security requirements"
```

After creating Task 4, set its dependency:
```
TaskUpdate:
  taskId: "{task 4 id}"
  addBlockedBy: ["{task 1 id}"]
```

---

## Step 7: Spawn Teammates

Spawn each teammate using the Task tool with:
- `team_name`: "sniper-plan"
- `name`: the teammate name
- The full composed spawn prompt from Step 4

**Spawn order matters for efficiency:**
1. Spawn `product-manager` FIRST -- they have no blockers and others depend on them.
2. Spawn `architect`, `ux-designer`, and `security-analyst` -- they will wait for the PRD.

Assign tasks to teammates using TaskUpdate:
- Task 1 (PRD) -> owner: "product-manager", status: "in_progress"
- Task 2 (Architecture) -> owner: "architect" (stays `pending` until PRD completes)
- Task 3 (UX Spec) -> owner: "ux-designer" (stays `pending` until PRD completes)
- Task 4 (Security) -> owner: "security-analyst" (stays `pending` until PRD completes)

---

## Step 8: Enter Delegate Mode

**You are the team lead. You coordinate, you do NOT produce artifacts.**

### Phase 8a: PRD Completion

1. Wait for `product-manager` to complete the PRD.
2. When they report completion, verify `docs/prd.md` exists and is non-empty.
3. Mark Task 1 as `completed` via TaskUpdate.
4. The blocked tasks (2, 3, 4) are now unblocked.
5. Message `architect`, `ux-designer`, and `security-analyst`:
   > "The PRD is complete at `docs/prd.md`. You may now begin your tasks. Read the PRD before starting."
6. Update tasks 2, 3, 4 to `in_progress`.

### Phase 8b: Architect Plan Approval

1. The architect has `plan_approval: true`. They MUST describe their approach before executing.
2. When the architect sends their plan/approach, **carefully review it**:
   - Does the component architecture align with the PRD requirements?
   - Are the technology choices appropriate for the stack in config.yaml?
   - Is the data model sound?
   - Are there obvious gaps or risks?
3. **Decide:**
   - If the approach looks solid: Approve by messaging the architect: "Plan approved. Proceed with the full architecture document."
   - If it needs changes: Send specific feedback: "Please revise: {specific issues}". Wait for revised plan.
   - If you are unsure: Present the architect's plan to the USER and ask for their input before approving.

### Phase 8c: Coordination Facilitation

Monitor for coordination between teammates:

1. **architect <-> security-analyst:** When the architect completes or shares their draft, ensure the security analyst reviews it. If the security analyst finds issues, facilitate the conversation.
2. **architect <-> ux-designer:** When the architect has API contracts, ensure the UX designer validates that component hierarchy aligns. Facilitate alignment if there are conflicts.

If teammates are not coordinating on their own, prompt them:
- Message architect: "Have you shared your API contracts with ux-designer for validation?"
- Message security-analyst: "The architecture document is ready. Please review it for security concerns."

### Phase 8d: Completion Monitoring

Track progress. As each teammate completes:
1. Verify their output file exists and is non-empty.
2. Mark their task as `completed`.
3. If a teammate has been working for more than 20 minutes without a message, check on them.

Wait for ALL four tasks to complete before proceeding.

---

## Step 9: Verify All Artifacts

Verify these files exist and contain content:
1. `docs/prd.md` -- **REQUIRED**
2. `docs/architecture.md` -- **REQUIRED**
3. `docs/ux-spec.md` -- **REQUIRED**
4. `docs/security.md` -- Recommended but not strictly required

If any REQUIRED file is missing, message the responsible teammate and wait for completion. Do NOT proceed without the PRD, architecture, and UX spec.

---

## Step 10: Run Review Gate (STRICT -- Human Must Approve)

This is a **STRICT** gate. Human approval is NON-NEGOTIABLE.

1. Read the review checklist at `.sniper/checklists/plan-review.md`.
2. For each checklist section, read the relevant artifact and evaluate:
   - **PRD section:** Read `docs/prd.md` and check each item.
   - **Architecture section:** Read `docs/architecture.md` and check each item.
   - **UX section:** Read `docs/ux-spec.md` and check each item.
   - **Security section:** Read `docs/security.md` (if exists) and check each item.
   - **Cross-Document Consistency:** Verify alignment across all artifacts.
3. Compile the review into a structured report:

```
============================================
  SNIPER Phase 2: Planning Review
============================================

  Gate Mode: STRICT (human approval required)

  ## PRD Review (docs/prd.md)
  [PASS] / [ATTENTION] / [FAIL] for each checklist item

  ## Architecture Review (docs/architecture.md)
  [PASS] / [ATTENTION] / [FAIL] for each checklist item

  ## UX Specification Review (docs/ux-spec.md)
  [PASS] / [ATTENTION] / [FAIL] for each checklist item

  ## Security Review (docs/security.md)
  [PASS] / [ATTENTION] / [FAIL] for each checklist item

  ## Cross-Document Consistency
  [PASS] / [ATTENTION] / [FAIL] for each checklist item

  Summary:
    Passed:    {count}/{total}
    Attention: {count}
    Failed:    {count}
============================================
```

4. **ALWAYS present this review to the user and wait for explicit approval.**

Print to the user:
> "Phase 2 planning review is complete. Please review the artifacts and the checklist results above."
>
> "**Your options:**"
> 1. **Approve** -- advance to Phase 3 (Epic Sharding)
> 2. **Request revisions** -- specify which artifacts need changes, and I will instruct the relevant teammates
> 3. **Reject** -- stop the process for manual review

5. **WAIT for the user to respond.** Do not auto-advance. Do not assume approval.

### If User Requests Revisions

1. Parse their feedback to determine which artifacts need changes.
2. Message the relevant teammate(s) with specific revision instructions.
3. Wait for revisions to complete.
4. Re-run the checklist evaluation.
5. Present the updated review to the user again.
6. Repeat until the user approves.

### If User Approves

Proceed to Step 11.

### If User Rejects

Print: "Phase 2 halted. Review artifacts manually in `docs/`. Run `/sniper-plan` again when ready to retry."
Update state with `approved_by: "rejected"` and STOP.

---

## Step 11: Update State and Shut Down Team

### Update Lifecycle State

Edit `.sniper/config.yaml`:

1. Set `state.artifacts.prd: draft`
2. Set `state.artifacts.architecture: draft`
3. Set `state.artifacts.ux_spec: draft`
4. Set `state.artifacts.security: draft` (if security doc was produced)
5. Update the plan entry in `state.phase_history`:
   - Set `completed_at: "{current ISO timestamp}"`
   - Set `approved_by: "human"` (since this is a strict gate)

### Shut Down Teammates

Send shutdown requests to each teammate:
- Send shutdown_request to "product-manager"
- Send shutdown_request to "architect"
- Send shutdown_request to "ux-designer"
- Send shutdown_request to "security-analyst"

Wait for all teammates to acknowledge shutdown.

---

## Step 12: Present Results and Next Steps

```
============================================
  SNIPER Phase 2: Planning Complete
============================================

  Artifacts Produced:
    - docs/prd.md           [draft, approved]
    - docs/architecture.md  [draft, approved]
    - docs/ux-spec.md       [draft, approved]
    - docs/security.md      [draft, approved]

  Review Gate: STRICT
    Status: APPROVED by human
    Passed: {count}/{total} checklist items

  Phase Duration: {time elapsed}

============================================
  Next Steps
============================================

  1. Run `/sniper-solve` to begin Phase 3: Epic Sharding & Story Creation
  2. Or run `/sniper-status` to see the full lifecycle state

  Note: Phase 3 runs as a single agent (no team spawned).
  It will break the PRD into epics and create implementation stories.

============================================
```

---

## IMPORTANT RULES

- You are the LEAD. You coordinate. You do NOT write artifact files.
- The `model_override: opus` from the team YAML should be noted in the team description. If the Task tool supports model selection, use opus for all teammates in this phase.
- The architect's `plan_approval: true` is MANDATORY. Do NOT let the architect skip the plan approval step.
- The review gate is STRICT. Do NOT auto-advance. ALWAYS wait for human approval.
- If `$ARGUMENTS` contains "dry-run", perform Steps 0-4 only (compose prompts) and print them without spawning.
- If `$ARGUMENTS` contains "skip-review", IGNORE IT. The plan gate is strict and cannot be skipped.
- Dependencies: product-manager runs first. Architect, UX designer, and security analyst are blocked until PRD completes.
- Coordination: actively facilitate cross-team communication, especially architect<->security and architect<->UX.
- If a teammate is blocked or unresponsive for more than 10 minutes, check on them and report to the user if needed.
- All file paths are relative to the project root.
- Do NOT proceed to `/sniper-solve` automatically -- always let the user initiate the next phase.
