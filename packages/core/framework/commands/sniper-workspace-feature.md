# /sniper-workspace feature -- Plan and Execute a Cross-Repo Feature

You are executing the `/sniper-workspace feature` command. Your job is to plan and orchestrate a feature that spans multiple repositories in the workspace. Follow every step below precisely.

The user's arguments are provided in: $ARGUMENTS

---

## Step 0: Pre-Flight Checks

1. Verify `workspace.yaml` exists in the current directory
   - If not, print:
     ```
     ERROR: No workspace found. Run /sniper-workspace init first.
     ```
     Then STOP.

2. Read `workspace.yaml` and validate:
   - All repository paths are accessible
   - All repos have `.sniper/config.yaml`
   - Dependency graph is a valid DAG

3. Parse `$ARGUMENTS`:
   - First positional argument: feature description (required)
   - `--resume WKSP-{XXXX}`: resume an existing workspace feature
   - `--skip-to {phase}`: skip to a specific phase (contracts | stories | sprint | validate)
   - `--wave {N}`: resume from a specific wave
   - `--list`: list active workspace features

4. If `--list`, display active features and STOP.

5. If `--resume`, load the existing feature state and skip to the appropriate phase.

6. If new feature: assign the next `WKSP-{XXXX}` ID from `state.feature_counter`. Increment the counter.

---

## Step 1: Phase 1 — Scoping

### 1a: Read Workspace Context
1. Read `workspace.yaml` for repository topology and dependency graph
2. For each repo, read `docs/architecture.md` (or equivalent from SNPR-0003 ingestion)
3. Read existing contracts from `contracts/` directory
4. Read workspace memory from `memory/` directory

### 1b: Create Feature Directory
```
features/WKSP-{XXXX}/
  repo-stories/
```

### 1c: Compose Orchestrator
Compose the workspace orchestrator spawn prompt:
```
/sniper-compose --process workspace-orchestrator --cognitive systems-thinker --name "Workspace Orchestrator"
```

### 1d: Generate Workspace Brief
The orchestrator agent produces the workspace feature brief:
- Which repos are affected and why
- What interfaces need to be created or modified
- Wave ordering based on dependency graph
- Written to: `features/WKSP-{XXXX}/brief.md`

### 1e: Brief Review Gate
Present the workspace brief to the user for approval.
- If approved, proceed to Step 2
- If rejected, revise based on feedback and re-present

---

## Step 2: Phase 2 — Contract Design

### 2a: Read Team Definition
Read `.sniper/teams/workspace-feature.yaml` for the team composition.

### 2b: Compose Contract Designer
```
/sniper-compose --process contract-designer --technical api-design --cognitive systems-thinker --name "Contract Designer"
```

### 2c: Generate Contracts
The contract designer reads the approved brief and produces:
- Interface contracts for all cross-repo communication
- Saved to: `contracts/{contract-name}.contract.yaml`
- Each contract includes: endpoints, shared types, events, versioning

### 2d: Contract Review Gate
Present the contracts to the user for approval.
- If approved, proceed to Step 3
- If rejected, revise and re-present
- **This is a strict gate** — contracts cannot change once approved (immutable during sprints)

---

## Step 3: Phase 3 — Per-Repo Story Generation

For each affected repository (from the workspace brief):

### 3a: Generate Repo Feature
1. Change working context to the repo directory
2. Run a scoped `/sniper-feature` with:
   - The workspace feature brief as context
   - The relevant contracts as interface specifications
   - The repo's own architecture docs
3. This generates stories within the repo's own `.sniper/` structure

### 3b: Record Story References
Save story references in the workspace:
```yaml
# features/WKSP-{XXXX}/repo-stories/{repo-name}.yaml
repo: {repo-name}
feature_ref: "SNPR-{XXXX}"
stories:
  - id: "STORY-XXX"
    title: "{story title}"
    contract_refs: [{contract-name}/{item}]
```

### 3c: Verify Coverage
Check that every contract item has at least one story referencing it across all repos.
If coverage gaps exist, flag them and ask the user whether to generate additional stories.

---

## Step 4: Phase 4 — Wave-Based Sprint Orchestration

### 4a: Compute Wave Assignment
From the dependency graph, assign repos to waves:
1. Wave 1: repos with no dependencies (leaf nodes)
2. Wave 2: repos that depend only on Wave 1 repos
3. Wave 3: repos that depend on Wave 2 repos
4. Continue until all repos are assigned

Repos in the same wave can sprint in parallel.

### 4b: Execute Each Wave

For each wave (starting from Wave 1):

#### Sprint Execution
1. For each repo in the wave:
   - Change working context to the repo directory
   - Run `/sniper-sprint` with the feature's stories for this repo
   - After sprint, run the repo's review gate (`/sniper-review`)
2. If multiple repos in the wave, they can sprint in parallel

#### Contract Validation (between waves)
After all repos in the wave complete:
1. Compose the integration validator:
   ```
   /sniper-compose --process integration-validator --technical backend --cognitive devils-advocate --name "Integration Validator"
   ```
2. Run contract validation for contracts involving repos in this wave
3. Write validation report to: `features/WKSP-{XXXX}/validation-wave-{N}.md`

#### Wave Gate
- If validation passes: proceed to next wave
- If validation fails:
  1. Display the mismatches
  2. Auto-generate fix stories in the affected repos
  3. Run a corrective sprint for the fix stories
  4. Re-validate
  5. If still failing after 2 correction attempts, STOP and ask the user for guidance

### 4c: Track Wave Progress
Update the workspace feature state:
```yaml
state:
  features:
    - id: "WKSP-{XXXX}"
      phase: sprint
      sprint_wave: {current_wave}
```

---

## Step 5: Phase 5 — Final Integration Validation

After all waves complete:

### 5a: Full Contract Validation
Run contract validation across ALL contracts (not just per-wave):
1. Check all endpoints match between producers and consumers
2. Check all shared types are compatible
3. Check all events have matching producer/consumer schemas

### 5b: Integration Report
Produce a final integration validation report:
```
============================================
  Workspace Feature Integration Validation
============================================

  Feature: WKSP-{XXXX} — {title}
  Waves completed: {N}
  Repos: {list}

  Contract Validation:
    {contract-1}  v{version}  ✅ All {N} items passed
    {contract-2}  v{version}  ✅ All {N} items passed

  Overall: PASS / FAIL
============================================
```

### 5c: Final Gate
If PASS: proceed to Step 6
If FAIL: present mismatches, generate fix stories, run corrective sprint

---

## Step 6: Feature Complete

### 6a: Update Workspace State
```yaml
state:
  features:
    - id: "WKSP-{XXXX}"
      phase: complete
      completed_at: "{ISO 8601}"
```

### 6b: Update Contract Versions
Bump versions on any contracts that were modified by this feature.

### 6c: Trigger Workspace Memory Update
If workspace memory is enabled:
1. Run retros for each repo that sprinted (if not already run)
2. Check for cross-repo conventions (patterns consistent across 2+ repos)
3. Promote qualifying conventions to workspace memory

### 6d: Present Results
```
============================================
  Workspace Feature Complete
============================================

  Feature: WKSP-{XXXX} — {title}
  Repos:   {count} repositories
  Waves:   {count} waves
  Stories: {count} total across all repos

  Contracts Updated:
    {contract-name} v{old} → v{new}

  Memory Updates:
    {N} workspace conventions added
    {N} workspace anti-patterns added

  All integration checks passed. Feature is complete.
============================================
```

---

## IMPORTANT RULES

- **Contracts are immutable during sprint waves** — once approved, they do not change until the wave completes
- **Wave ordering is mandatory** — never sprint a repo before its dependency wave completes
- **Contract validation runs between every wave** — do not skip validation
- **Each repo sprints independently** — agents in one repo do not modify files in another repo
- **Fix stories are scoped** — corrective sprints only address specific contract mismatches
- **The workspace orchestrator coordinates but does not code** — it stays in delegate mode
- **Parallel execution within waves is optional** — if resources are limited, repos can sprint sequentially within a wave
- **Always update workspace state** — the feature's phase and wave must be tracked for resume capability
- **Workspace memory promotion requires user confirmation** unless `auto_promote: true` in workspace config
