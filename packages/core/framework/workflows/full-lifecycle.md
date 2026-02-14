# Full Lifecycle Workflow

Run the complete SNIPER lifecycle from discovery through implementation.

## When to Use
- New greenfield projects
- Major product rewrites
- Projects requiring full planning and governance

## Execution Order

### Step 1: Initialize
```
/sniper-init
```
Configure project name, type, stack, and domain pack.

### Step 2: Discover (Phase 1)
```
/sniper-discover
```
- Spawns 3-teammate discovery team (analyst, risk-researcher, user-researcher)
- Produces: `docs/brief.md`, `docs/risks.md`, `docs/personas.md`
- Gate: FLEXIBLE (auto-advance, review async)

### Step 3: Plan (Phase 2)
```
/sniper-plan
```
- Spawns 4-teammate planning team (PM, architect, UX, security)
- Uses Opus model for higher quality output
- Produces: `docs/prd.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/security.md`
- Gate: STRICT — human MUST approve before proceeding

### Step 4: Solve (Phase 3)
```
/sniper-solve
```
- Single agent (scrum master) — NOT a team
- Produces: `docs/epics/*.md`, `docs/stories/*.md`
- Gate: FLEXIBLE (auto-advance, review async)

### Step 5: Sprint (Phase 4 — repeating)
```
/sniper-sprint
```
- Select stories for the sprint
- Spawns implementation team based on story requirements
- Produces: source code, tests
- Gate: STRICT — human reviews code before merge
- Repeat for each sprint until all stories are complete

## Recovery
- If any phase produces poor output, re-run the phase command
- Completed files persist on disk — only the conversation resets
- Sprint failures only affect the current sprint's stories
