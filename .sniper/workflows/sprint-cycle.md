# Sprint Cycle Workflow

Execute a single implementation sprint with an Agent Team.

## When to Use
- Stories already exist in `docs/stories/`
- Architecture and planning are complete
- Ready to implement a batch of stories

## Prerequisites
- `docs/architecture.md` exists and is approved
- Story files exist in `docs/stories/`
- Config state shows phase is `solve` (completed) or `sprint`

## Execution

### Step 1: Select Stories
The `/sniper-sprint` command will:
1. List all stories from `docs/stories/` that are not yet implemented
2. Prompt you to select stories for this sprint (or accept a suggested batch)
3. Determine which teammates are needed based on story file ownership

### Step 2: Team Composition
Based on selected stories, the command:
1. Reads `.sniper/teams/sprint.yaml` for available teammate definitions
2. Selects only the teammates needed (e.g., skip infra-dev if no infra stories)
3. Composes spawn prompts with story context embedded
4. Assigns file ownership boundaries from `config.yaml`

### Step 3: Sprint Execution
1. Creates team `sniper-sprint-{N}`
2. Creates tasks with dependencies (QA blocked until implementation done)
3. Spawns teammates with their composed prompts
4. Lead enters delegate mode — coordinates, does not code
5. Facilitates API contract alignment between backend/frontend
6. Monitors progress, intervenes on blocks

### Step 4: Sprint Review
1. All tasks must be marked complete
2. Run `/sniper-review` to check the sprint review checklist
3. Present code diff summary and test results to human
4. Gate: STRICT — human must approve

### Step 5: Post-Sprint
1. Update config state (increment sprint number, mark stories as complete)
2. Clean up the agent team
3. Proceed to next sprint or declare MVP complete
