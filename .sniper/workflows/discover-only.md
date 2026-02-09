# Discovery-Only Workflow

Run just the discovery phase for research and analysis.

## When to Use
- Exploring a new project idea before committing
- Market research or competitive analysis
- Validating feasibility before full planning
- User research for an existing product

## Execution

### Step 1: Initialize (if not already done)
```
/sniper-init
```
Minimal config — just project name and description needed.

### Step 2: Run Discovery
```
/sniper-discover
```
- Spawns 3-teammate discovery team
- Produces: project brief, risk assessment, user personas
- Auto-advances (flexible gate)

### Step 3: Review Artifacts
```
/sniper-review
```
Review the discovery artifacts. Decide whether to:
- Proceed to full planning (`/sniper-plan`)
- Iterate on discovery (re-run `/sniper-discover` with feedback)
- Shelve the project (no further action needed)

## Notes
- Discovery artifacts are useful standalone — no need to continue the lifecycle
- Domain pack context improves discovery quality significantly
- The analyst teammate benefits from web search for competitive research
