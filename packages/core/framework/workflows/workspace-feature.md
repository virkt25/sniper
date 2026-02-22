# Workspace Feature Workflow

Orchestrate a feature across multiple repositories using contract-first coordination and wave-based sprints.

## When to Use
- A feature requires changes in 2 or more repositories
- Cross-repo interfaces (APIs, shared types, events) need to be created or modified
- Implementation ordering matters due to repository dependencies

## Prerequisites
- Workspace initialized (`workspace.yaml` exists)
- All member repositories have SNIPER initialized (`.sniper/` directory)
- Dependency graph is up to date in `workspace.yaml`

## Execution Order

### Step 1: Scoping
```
/sniper-workspace feature "{feature description}"
```
- Workspace orchestrator reads `workspace.yaml` and per-repo architecture docs
- Produces workspace feature brief identifying affected repos and wave ordering
- Gate: **strict** (workspace brief must be approved before contract design)

### Step 2: Contract Design
- Contract designer reads the approved brief
- Produces interface contracts for all cross-repo communication
- Contracts are versioned and saved to `contracts/` directory
- Gate: **strict** (contracts must be approved before implementation begins)

### Step 3: Per-Repo Story Generation
- For each affected repo, run `/sniper-feature` with contract context
- Stories reference specific contract items they implement
- Story references saved in workspace feature directory

### Step 4: Wave-Based Sprints
- Execute sprints in dependency order (Wave 1 → Wave 2 → Wave 3)
- Within each wave, repos in the same tier sprint in parallel
- After each wave completes:
  1. Run per-repo review gates
  2. Run contract validation between waves
  3. If validation fails, generate fix stories and run corrective sprint
  4. If validation passes, proceed to next wave

### Step 5: Integration Validation
- After all waves complete, run final cross-repo integration check
- Validates all contracts are fully satisfied
- Gate: **strict** (integration must pass before feature is marked complete)

### Step 6: Feature Complete
- Mark workspace feature as complete
- Update contract versions
- Trigger workspace memory update (conventions learned across repos)

## Recovery

### Contract Validation Failure
1. Review the validation report for specific mismatches
2. Fix stories are auto-generated for each mismatch
3. Run a corrective sprint in the affected repo(s)
4. Re-run validation before proceeding to the next wave

### Circular Dependencies
1. If the dependency graph has cycles, the orchestrator will flag them
2. Manual resolution required: break the cycle by identifying which interface to define first
3. Create a contract for the interface and proceed with wave ordering

### Repo Sprint Failure
1. If a repo's sprint fails review, fix within that repo before proceeding
2. Other repos in the same wave are not affected (contract-first isolation)
3. Dependent waves are blocked until the fix passes review
