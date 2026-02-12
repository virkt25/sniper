# /sniper-init -- Initialize SNIPER in a New or Existing Project

You are executing the `/sniper-init` command. Your job is to initialize the SNIPER framework in the current project. Follow every step below precisely.

---

## Step 0: Pre-Flight Checks

1. Check if the directory `.sniper/` already exists in the project root by listing its contents.
2. If `.sniper/` exists AND contains a `config.yaml` with a non-empty `project.name`:
   - **WARN the user:** "SNIPER is already initialized for project '{name}'. Re-running will overwrite configuration and persona files. Artifacts in `docs/` will NOT be deleted."
   - Ask the user: "Do you want to re-initialize? (yes/no)"
   - If they say no, STOP and print: "Initialization cancelled. Run `/sniper-status` to see current state."
   - If they say yes, proceed with overwrite.
3. If `.sniper/` does not exist, or `config.yaml` is empty/missing, proceed normally.

---

## Step 1: Gather Project Information

Ask the user the following questions ONE AT A TIME using conversational prompts. Wait for each answer before asking the next. Provide defaults in brackets.

**Question 1: Project Name**
> What is the project name? This will be used in config and artifacts.

**Question 2: Project Type**
> What type of project is this?
> Options: `saas` | `api` | `mobile` | `cli` | `library` | `monorepo`
> [default: saas]

**Question 3: One-Line Description**
> Give a one-line description of what this project does.

**Question 4: Tech Stack**
Ask about each stack component. Present all at once and let the user confirm or override:

> Here is the default tech stack. Confirm or override each:
>
> | Setting          | Default        |
> |-----------------|----------------|
> | Language         | typescript     |
> | Frontend         | react          |
> | Backend          | node-express   |
> | Database         | postgresql     |
> | Cache            | redis          |
> | Infrastructure   | aws            |
> | Test Runner      | vitest         |
> | Package Manager  | pnpm           |
>
> Type your overrides as key=value pairs (e.g., `language=python backend=fastapi database=mongodb frontend=null`), or type `ok` to accept defaults.

Parse the user's response. For any key not mentioned, keep the default. If the user says `ok` or `confirm` or similar, keep all defaults.

**Question 5: Domain Pack**
> Do you want to install a domain pack? Domain packs add industry-specific context to personas.
> Available packs are found in `.sniper/domain-packs/`. Enter a pack name, or `none` to skip.
> [default: none]

If the user specifies a domain pack, verify that the directory `.sniper/domain-packs/{pack-name}/` exists. If it does not exist, warn them and set domain_pack to null.

**Question 6: Review Gate Configuration**
> Here are the default review gates:
>
> | Gate             | Default    | Description                                |
> |-----------------|------------|--------------------------------------------|
> | after_discover   | flexible   | Auto-advance, human reviews async          |
> | after_plan       | strict     | Full stop, human must approve              |
> | after_solve      | flexible   | Auto-advance, human reviews async          |
> | after_sprint     | strict     | Full stop, human must review code          |
>
> Options per gate: `strict` | `flexible` | `auto`
> Type overrides as key=value (e.g., `after_discover=strict`), or `ok` to accept defaults.

Parse overrides. Keep defaults for any not mentioned.

---

## Step 2: Create Directory Structure

Create the following directories if they do not already exist. Use `mkdir -p` to create them all at once:

```
.sniper/personas/process
.sniper/personas/technical
.sniper/personas/cognitive
.sniper/personas/domain
.sniper/teams
.sniper/workflows
.sniper/templates
.sniper/checklists
.sniper/spawn-prompts
.sniper/domain-packs
```

---

## Step 3: Generate config.yaml

Write `.sniper/config.yaml` using the gathered information. Use this exact structure:

```yaml
# ─────────────────────────────────────────
# SNIPER Framework Configuration
# ─────────────────────────────────────────

project:
  name: "{project_name}"
  type: {project_type}
  description: "{description}"

stack:
  language: {language}
  frontend: {frontend}
  backend: {backend}
  database: {database}
  cache: {cache}
  infrastructure: {infrastructure}
  test_runner: {test_runner}
  package_manager: {package_manager}

# ─────────────────────────────────────────
# Review Gate Configuration
# ─────────────────────────────────────────
# strict  = full stop, human must approve before next phase
# flexible = auto-advance, human reviews async
# auto    = no gate (not recommended for architecture/implementation)

review_gates:
  after_discover: {after_discover}
  after_plan: {after_plan}
  after_solve: {after_solve}
  after_sprint: {after_sprint}

# ─────────────────────────────────────────
# Agent Teams Configuration
# ─────────────────────────────────────────

agent_teams:
  max_teammates: 5
  default_model: sonnet
  planning_model: opus
  delegate_mode: true
  plan_approval: true
  coordination_timeout: 30

# ─────────────────────────────────────────
# Domain Pack
# ─────────────────────────────────────────

domain_pack: {domain_pack_or_null}

# ─────────────────────────────────────────
# File Ownership Rules
# ─────────────────────────────────────────
# These are injected into spawn prompts to prevent teammates from editing
# each other's files. Customize per project.

ownership:
  backend:
    - "src/backend/"
    - "src/api/"
    - "src/services/"
    - "src/db/"
    - "src/workers/"
  frontend:
    - "src/frontend/"
    - "src/components/"
    - "src/hooks/"
    - "src/styles/"
    - "src/pages/"
  infrastructure:
    - "docker/"
    - ".github/"
    - "infra/"
    - "terraform/"
    - "scripts/"
  tests:
    - "tests/"
    - "__tests__/"
    - "*.test.*"
    - "*.spec.*"
  docs:
    - "docs/"

# ─────────────────────────────────────────
# Lifecycle State (managed by SNIPER, don't edit manually)
# ─────────────────────────────────────────

state:
  current_phase: null
  phase_history: []
  current_sprint: 0
  artifacts:
    brief: null
    prd: null
    architecture: null
    ux_spec: null
    security: null
    epics: null
    stories: null
```

Replace all `{placeholders}` with the actual values gathered from the user. For `null` values (e.g., no frontend, no cache), write the literal YAML `null`.

---

## Step 4: Verify Framework Files Exist

Check that the following framework files already exist. For each file category, list what is present:

1. **Persona layers** in `.sniper/personas/`:
   - Process: `analyst.md`, `product-manager.md`, `architect.md`, `ux-designer.md`, `scrum-master.md`, `developer.md`, `qa-engineer.md`
   - Technical: `backend.md`, `frontend.md`, `infrastructure.md`, `security.md`, `ai-ml.md`, `database.md`, `api-design.md`
   - Cognitive: `systems-thinker.md`, `security-first.md`, `performance-focused.md`, `user-empathetic.md`, `devils-advocate.md`, `mentor-explainer.md`
2. **Spawn prompt template**: `.sniper/spawn-prompts/_template.md`
3. **Team definitions**: `.sniper/teams/discover.yaml`, `plan.yaml`, `solve.yaml`, `sprint.yaml`
4. **Artifact templates**: `.sniper/templates/brief.md`, `risks.md`, `personas.md`, `prd.md`, `architecture.md`, `ux-spec.md`, `security.md`, `epic.md`, `story.md`, `sprint-review.md`
5. **Review checklists**: `.sniper/checklists/discover-review.md`, `plan-review.md`, `story-review.md`, `sprint-review.md`, `code-review.md`
6. **Workflows**: `.sniper/workflows/full-lifecycle.md`, `sprint-cycle.md`, `discover-only.md`, `quick-feature.md`

For any MISSING files, report them to the user as warnings. These are framework files that should have been included with the SNIPER framework repo. Do NOT attempt to generate them from scratch -- just warn.

---

## Step 5: Install Domain Pack (if specified)

If the user chose a domain pack:

1. Check that `.sniper/domain-packs/{pack-name}/` exists
2. Check for a `context/` subdirectory with `.md` files
3. If contexts exist, copy/link them into `.sniper/personas/domain/`
4. Report what domain context files were installed

If no domain pack was chosen, skip this step.

---

## Step 6: Create docs/ Directory

Create the `docs/` directory if it does not exist:
```
docs/
docs/epics/
docs/stories/
```

Do NOT create any artifact files -- those are produced by the discovery and planning phases.

---

## Step 7: Verify CLAUDE.md

Check that `CLAUDE.md` exists in the project root. If it does, read it and verify it references the SNIPER framework. If it does NOT exist, create one with the standard SNIPER CLAUDE.md content:

```markdown
# SNIPER Project

## Framework
This project uses SNIPER (Spawn, Navigate, Implement, Parallelize, Evaluate, Release).
See `.sniper/config.yaml` for project settings.

## Quick Reference
- Framework workflows: `.sniper/workflows/`
- Persona layers: `.sniper/personas/`
- Team definitions: `.sniper/teams/`
- Artifact templates: `.sniper/templates/`
- Quality gates: `.sniper/checklists/`
- Project artifacts: `docs/`
- Domain context: `.sniper/domain-packs/{pack-name}/`

## Commands
- `/sniper-init` -- Initialize SNIPER in a new project
- `/sniper-discover` -- Phase 1: Discovery & Analysis (parallel team)
- `/sniper-plan` -- Phase 2: Planning & Architecture (parallel team)
- `/sniper-solve` -- Phase 3: Epic Sharding & Story Creation (sequential)
- `/sniper-sprint` -- Phase 4: Implementation Sprint (parallel team)
- `/sniper-review` -- Run review gate for current phase
- `/sniper-compose` -- Create a spawn prompt from persona layers
- `/sniper-status` -- Show lifecycle status and artifact state

## Agent Teams Rules
When spawning teammates, always:
1. Read the relevant team YAML from `.sniper/teams/`
2. Compose spawn prompts using `/sniper-compose` with the layers specified in the YAML
3. Assign file ownership boundaries from `config.yaml` ownership rules
4. Create tasks with dependencies from the team YAML
5. Enter delegate mode (Shift+Tab) -- the lead coordinates, it does not code
6. Require plan approval for tasks marked `plan_approval: true`
7. When a phase completes, run `/sniper-review` before advancing

## Code Standards
See `.sniper/config.yaml` -> stack section for language/framework specifics.
```

---

## Step 8: Verify Slash Commands

Check that the following slash command files exist in `.claude/commands/`:
- `sniper-init.md` (this file)
- `sniper-compose.md`
- `sniper-discover.md`
- `sniper-plan.md`
- `sniper-solve.md`
- `sniper-sprint.md`
- `sniper-review.md`
- `sniper-status.md`

Report any missing commands as warnings.

---

## Step 9: Print Summary and Next Steps

Print a formatted summary:

```
============================================
  SNIPER Initialized Successfully
============================================

  Project:     {project_name}
  Type:        {project_type}
  Description: {description}

  Stack:
    Language:        {language}
    Frontend:        {frontend}
    Backend:         {backend}
    Database:        {database}
    Cache:           {cache}
    Infrastructure:  {infrastructure}
    Test Runner:     {test_runner}
    Package Manager: {package_manager}

  Domain Pack: {domain_pack or "none"}

  Review Gates:
    after_discover: {gate}
    after_plan:     {gate}
    after_solve:    {gate}
    after_sprint:   {gate}

  Framework Files:
    Personas:   {count} layers found
    Teams:      {count} definitions found
    Templates:  {count} templates found
    Checklists: {count} checklists found
    Workflows:  {count} workflows found

  {warnings if any}

============================================
  Next Steps
============================================

  1. Review `.sniper/config.yaml` and adjust ownership rules for your project structure
  2. Run `/sniper-discover` to begin Phase 1: Discovery & Analysis
  3. Or run `/sniper-status` to see the current lifecycle state

  Tip: The full lifecycle workflow is documented in `.sniper/workflows/full-lifecycle.md`
```

---

## IMPORTANT RULES

- Do NOT skip the user questions -- every project is different and needs configuration.
- Do NOT generate placeholder artifact files (brief.md, prd.md, etc.) -- those come from the actual phases.
- Do NOT modify any existing artifact files in `docs/`.
- If the user cancels at any point, stop gracefully and report what was done.
- All file paths are relative to the project root.
