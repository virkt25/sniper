# /sniper-solve -- Phase 3: Epic Sharding & Story Creation (Single Agent)

You are executing the `/sniper-solve` command. Your job is to break the PRD into implementable epics and self-contained stories. This phase runs as a **single agent** -- you do the work directly, no team is spawned. Follow every step below precisely.

**Arguments:** $ARGUMENTS

---

## Step 0: Pre-Flight Checks

Perform ALL checks before proceeding. If any critical check fails, STOP.

### 0a. Verify SNIPER Is Initialized

1. Read `.sniper/config.yaml`.
2. If the file does not exist or `project.name` is empty:
   - **STOP.** Print: "SNIPER is not initialized. Run `/sniper-init` first."

### 0b. Verify Phase 2 Artifacts Exist

Check that the following files exist and are non-empty. Read each file to verify it has substantive content (not just a template with empty sections).

1. `docs/prd.md` -- **REQUIRED.** If missing or empty, STOP and print: "Phase 2 artifact `docs/prd.md` is missing. Run `/sniper-plan` first."
2. `docs/architecture.md` -- **REQUIRED.** If missing or empty, STOP and print: "Phase 2 artifact `docs/architecture.md` is missing. Run `/sniper-plan` first."
3. `docs/ux-spec.md` -- **REQUIRED.** If missing or empty, STOP and print: "Phase 2 artifact `docs/ux-spec.md` is missing. Run `/sniper-plan` first."
4. `docs/security.md` -- Recommended. If missing, print a warning but continue.

### 0c. Verify Phase 2 Was Approved

1. Read `state.phase_history` from config.yaml.
2. Find the entry with `phase: plan`.
3. Check that `approved_by` is not null and not "rejected".
4. **If plan was not approved:** Print a warning:
   > "WARNING: Phase 2 (plan) has not been formally approved. The planning review gate is strict -- artifacts should be reviewed and approved before sharding into stories. Continue anyway? (yes/no)"
   - If no, STOP.
   - If yes, proceed with a note in the output.

### 0d. Verify Phase State

1. Read `state.current_phase`.
2. **If `current_phase` is `plan`:** Good -- planning is done and we are advancing. Proceed.
3. **If `current_phase` is `solve`:** Already in progress or was interrupted.
   - Ask the user: "The solve phase appears to be in progress. Do you want to restart? This will overwrite existing epics and stories. (yes/no)"
   - If no, STOP.
4. **If `current_phase` is `sprint`:** Project has advanced past this phase.
   - Ask the user: "The project is in sprint phase. Re-running solve will recreate epics and stories. Are you sure? (yes/no)"
   - If no, STOP.

---

## Step 1: Update Lifecycle State

Edit `.sniper/config.yaml`:

1. Set `state.current_phase: solve`
2. Append to `state.phase_history`:
   ```yaml
   - phase: solve
     started_at: "{current ISO timestamp}"
     completed_at: null
     approved_by: null
   ```

---

## Step 2: Load Persona and Context

This phase does NOT spawn a team. Instead, adopt the scrum-master persona yourself.

1. Read `.sniper/personas/process/scrum-master.md` -- internalize this role. You ARE the scrum master for this step.
2. Read `.sniper/personas/cognitive/systems-thinker.md` -- apply this thinking pattern to your sharding decisions.
3. If `domain_pack` is set in config.yaml, read domain context files from `.sniper/domain-packs/{domain_pack}/context/`.

---

## Step 3: Read All Phase 2 Artifacts

Read each artifact fully. You will need deep understanding of all of these to shard properly.

1. **Read `docs/prd.md`** -- This is your primary input. Pay close attention to:
   - P0 requirements (must-have for v1)
   - P1 requirements (should-have)
   - P2 requirements (nice-to-have, likely deferred)
   - User stories and acceptance criteria
   - Non-functional requirements
   - Out-of-scope items

2. **Read `docs/architecture.md`** -- Pay close attention to:
   - Component boundaries (these inform epic boundaries)
   - Data models (stories need embedded schema context)
   - API contracts (stories need embedded endpoint specs)
   - Infrastructure requirements
   - Cross-cutting concerns (auth, logging, etc.)

3. **Read `docs/ux-spec.md`** -- Pay close attention to:
   - Screen inventory (each screen may map to one or more stories)
   - User flows (flows cross multiple components)
   - Component hierarchy (informs frontend story scope)
   - Responsive breakpoints and states

4. **Read `docs/security.md`** (if exists) -- Pay close attention to:
   - Auth model (will be its own epic or stories)
   - Encryption requirements
   - Compliance requirements

---

## Step 4: Read Templates

1. Read `.sniper/templates/epic.md` -- Every epic MUST follow this template structure.
2. Read `.sniper/templates/story.md` -- Every story MUST follow this template structure.

---

## Step 5: Create Output Directories

Create the following directories if they do not exist:
- `docs/epics/`
- `docs/stories/`

If the directories already exist and contain files from a previous run, note this. The files will be overwritten.

---

## Step 6: Shard PRD into Epics

Break the PRD into **6-12 epics**. Follow these rules strictly:

### Sharding Rules

1. **No overlap:** Every requirement from the PRD belongs to exactly ONE epic. No requirement should appear in two epics.
2. **Clear boundaries:** Each epic has explicit "In Scope" and "Out of Scope" sections.
3. **Architecture alignment:** Epic boundaries should align with architecture component boundaries where possible.
4. **Dependency DAG:** Epic dependencies must form a Directed Acyclic Graph -- no circular dependencies.
5. **Sizing:** Each epic should be roughly similar in size (not one massive epic and five tiny ones).
6. **Embedded context:** Each epic must EMBED the relevant architecture sections, not just reference them.

### Suggested Epic Structure

Consider organizing epics along these axes (adapt to the specific project):
- **E01: Foundation** -- Project setup, configuration, infrastructure scaffolding
- **E02: Authentication & Authorization** -- Auth flows, RBAC, session management
- **E03: Core Data Layer** -- Database models, migrations, seed data, repositories
- **E04-E08: Feature Epics** -- One epic per major feature area from the PRD
- **E09: API Layer** -- API contracts, middleware, validation, error handling
- **E10: Frontend Shell** -- Layout, navigation, routing, shared components
- **E11-E12: Integration** -- Third-party integrations, background jobs, notifications

Adapt this structure to fit the actual project. Do NOT force-fit the project into this template if it does not make sense.

### Writing Each Epic

For each epic, create a file at `docs/epics/E{NN}-{slug}.md` where:
- `{NN}` is a zero-padded two-digit number (E01, E02, etc.)
- `{slug}` is a kebab-case short name (e.g., `auth-system`, `core-data`, `dashboard-ui`)

Follow the template at `.sniper/templates/epic.md` exactly. Fill in:
- **Status:** Draft
- **Priority:** P0, P1, or P2 (based on the requirements it covers)
- **Estimated Points:** Total story points for all stories in this epic
- **Dependencies:** List other epics this depends on (e.g., "E01-foundation" if it needs project setup)
- **Scope:** Clear in/out boundaries
- **Architecture Context:** COPY the relevant sections from `docs/architecture.md` -- data models, API contracts, component descriptions. Do NOT just write "see architecture doc."
- **Stories table:** List the stories that will be created in Step 7 (you can fill this in after Step 7)
- **Acceptance Criteria:** Epic-level criteria -- what must be true when ALL stories in this epic are done
- **Technical Notes:** Implementation-specific guidance

---

## Step 7: Create Stories for Each Epic

For each epic, create **3-8 stories**. Follow these rules strictly:

### Story Rules

1. **Self-contained:** A developer reading ONLY the story file must have ALL context needed to implement it. No "see PRD" or "see architecture doc" -- embed the context.
2. **Given/When/Then:** All acceptance criteria MUST use Given/When/Then format.
3. **File ownership:** Each story must declare which directories it touches (from the ownership rules in config.yaml).
4. **Complexity:** Estimate S/M/L/XL. If any story is XL, split it into smaller stories.
5. **Dependencies:** Declare inter-story dependencies. Must form a DAG.
6. **Test requirements:** Specify what tests are needed (unit, integration, e2e).

### Writing Each Story

For each story, create a file at `docs/stories/S{NN}-{slug}.md` where:
- `{NN}` is a zero-padded two-digit number, globally sequential across all epics (S01, S02, ..., S42, etc.)
- `{slug}` is a kebab-case short name

Follow the template at `.sniper/templates/story.md` exactly. Fill in:

- **Epic reference:** Which epic this belongs to
- **Complexity:** S, M, L (never XL -- split if needed)
- **Priority:** P0, P1, or P2
- **File Ownership:** Which directories from config.yaml this story touches (e.g., "backend, tests" or "frontend, tests")
- **Dependencies:** Other story IDs that must complete first

#### Embedded Context (CRITICAL)

For the "Embedded Context" section, COPY the relevant content from the source documents:

- **From PRD:** Copy the specific requirements and user stories this story implements. Include exact acceptance criteria text.
- **From Architecture:** Copy relevant data models (with field types), API endpoint specs (with request/response shapes), and architectural patterns to follow.
- **From UX Spec:** For frontend stories, copy the screen descriptions, component specs (with all states), user flow segments, and responsive requirements.

Do NOT summarize or paraphrase. COPY the exact sections. A developer should not need to open any other document.

#### Acceptance Criteria

Write testable assertions in Given/When/Then format:

```
1. **Given** a user is not authenticated
   **When** they access the dashboard endpoint
   **Then** they receive a 401 Unauthorized response with a redirect URL to the login page

2. **Given** a user is authenticated with role "admin"
   **When** they request the user list endpoint with pagination params page=2, limit=20
   **Then** they receive a 200 response with exactly 20 user objects and correct pagination metadata
```

Be specific. Include status codes, field names, exact behaviors.

#### Test Requirements

Specify what tests are needed:
```
- [ ] Unit tests: {specific functions/methods to test}
- [ ] Integration tests: {specific API endpoints or flows to test}
- [ ] E2E tests (if applicable): {specific user scenarios}
```

---

## Step 8: Backfill Epic Story Tables

After creating all stories, go back to each epic file and update the **Stories** table with the actual story IDs, names, complexity, dependencies, and file ownership.

---

## Step 9: Self-Review Against Checklist

Read `.sniper/checklists/story-review.md` and evaluate your work against every item.

### Epic Structure Review

Go through each epic checklist item:
- [ ] Epics number between 6-12
- [ ] No overlap between epics
- [ ] Epic dependencies form a DAG
- [ ] Each epic has clear scope boundaries
- [ ] Architecture context is EMBEDDED
- [ ] Complexity estimates are realistic

### Story Quality Review

For EACH story, verify:
- [ ] Story is self-contained (a developer can implement from the story alone)
- [ ] PRD context is EMBEDDED (not just referenced)
- [ ] Architecture context is EMBEDDED
- [ ] UX context is EMBEDDED for frontend stories
- [ ] Acceptance criteria use Given/When/Then format
- [ ] Every criterion is testable
- [ ] Test requirements are specified
- [ ] File ownership is assigned
- [ ] Dependencies are declared
- [ ] Complexity is S/M/L (not XL)

### Coverage Review

- [ ] All P0 requirements have implementing stories
- [ ] All P1 requirements have implementing stories
- [ ] All architecture components have at least one story
- [ ] Story dependency chains allow reasonable sprint planning

---

## Step 10: Fix Issues Found in Self-Review

If the self-review identified any issues:

1. Fix each issue directly by editing the relevant epic or story file.
2. Common fixes:
   - **Missing embedded context:** Go back to the source doc, copy the relevant section into the story.
   - **Vague acceptance criteria:** Rewrite with specific Given/When/Then and concrete values.
   - **XL story:** Split into two or more smaller stories with clear boundaries.
   - **Missing test requirements:** Add specific test types and what to test.
   - **Circular dependencies:** Restructure the dependency graph to break the cycle.
3. After fixing, re-verify the specific items that failed.

---

## Step 11: Update Lifecycle State

Edit `.sniper/config.yaml`:

1. Set `state.artifacts.epics: draft`
2. Set `state.artifacts.stories: draft`
3. Update the solve entry in `state.phase_history`:
   - Set `completed_at: "{current ISO timestamp}"`
   - Set `approved_by: "auto-flexible"` (this is a flexible gate)

---

## Step 12: Present Results and Next Steps

Print a formatted summary:

```
============================================
  SNIPER Phase 3: Epic Sharding Complete
============================================

  Epics Created: {count}
  Stories Created: {count}

  Epic Summary:
    E01-{slug}  |  P{x}  |  {story count} stories  |  {total points} pts
    E02-{slug}  |  P{x}  |  {story count} stories  |  {total points} pts
    ...

  Story Breakdown by Complexity:
    Small (S):  {count}
    Medium (M): {count}
    Large (L):  {count}

  Story Breakdown by File Ownership:
    Backend:        {count} stories
    Frontend:       {count} stories
    Infrastructure: {count} stories
    Full-stack:     {count} stories

  Self-Review Results:
    Passed:    {count}/{total} checklist items
    Fixed:     {count} issues auto-corrected
    Attention: {count} items for async review

  Review Gate: FLEXIBLE (auto-advanced)

============================================
  Next Steps
============================================

  1. Review epics in `docs/epics/` and stories in `docs/stories/`
  2. When ready, run `/sniper-sprint` to begin Phase 4: Implementation Sprint
  3. `/sniper-sprint` will ask you to select which stories to include in the sprint
  4. Or run `/sniper-status` to see the full lifecycle state

  Recommended first sprint: Start with foundation stories (E01)
  and any stories with no dependencies.

============================================

  Files:
    Epics:   docs/epics/E01-*.md through docs/epics/E{NN}-*.md
    Stories: docs/stories/S01-*.md through docs/stories/S{NN}-*.md

============================================
```

---

## IMPORTANT RULES

- This phase runs as a SINGLE AGENT. Do NOT create a team or spawn teammates.
- You ARE the scrum master. You do the work directly.
- Stories MUST be self-contained. This is the most critical quality requirement. A developer reading only the story file must have all context to implement it.
- EMBED context from PRD, architecture, and UX spec. Do NOT just reference them.
- Acceptance criteria MUST be Given/When/Then format with specific, testable assertions.
- No story should be XL complexity. Split large stories.
- Epic and story dependencies MUST form a DAG. No circular dependencies.
- If `$ARGUMENTS` contains "dry-run", perform Steps 0-4 only (read all artifacts and plan the sharding) and present the proposed epic structure without creating files. Let the user approve before proceeding.
- If `$ARGUMENTS` contains a specific epic count (e.g., "8 epics"), use that as a target instead of the 6-12 range.
- All file paths are relative to the project root.
- Do NOT start implementation. Do NOT write code. This phase produces planning artifacts only.
- Do NOT proceed to `/sniper-sprint` automatically -- let the user initiate it.
