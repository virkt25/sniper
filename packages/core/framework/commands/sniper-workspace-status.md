# /sniper-workspace status -- Show Workspace Status

You are executing the `/sniper-workspace status` command. Your job is to display the current state of the SNIPER workspace, including repository status, active features, contracts, and memory.

---

## Step 0: Pre-Flight

1. Verify `workspace.yaml` exists in the current directory
   - If not, print:
     ```
     ERROR: No workspace found in the current directory.
     Run /sniper-workspace init to create one.
     ```
     Then STOP.

2. Read `workspace.yaml`

---

## Step 1: Repository Status

For each repository in the workspace:
1. Check if the path is accessible
2. Read `.sniper/config.yaml` to get current phase and sprint info
3. Count active features (from the repo's state)

Display:
```
Repositories:
  {name}  {role}  {language}  {phase or "idle"}  {active_features} features  {path}
```

Use status indicators:
- ✅ accessible and SNIPER-enabled
- ⚠️ path exists but not SNIPER-enabled
- ❌ path not accessible

---

## Step 2: Active Workspace Features

Read workspace `state.features` array.

Display:
```
Workspace Features:
  WKSP-{XXXX}  "{title}"  Phase: {phase}  Wave: {N}/{total}  {repos affected}
```

If no active features: `No active workspace features.`

---

## Step 3: Contracts

Scan `contracts/` directory for `.contract.yaml` files.

For each contract:
1. Read the contract metadata (name, version, between, last_updated)
2. Count endpoints, shared types, and events

Display:
```
Contracts:
  {name}  v{version}  {between[0]} ↔ {between[1]}  {N} endpoints, {M} types, {K} events
```

If no contracts: `No contracts defined.`

---

## Step 4: Workspace Memory

If `memory/` directory exists:
1. Read `memory/conventions.yaml` — count entries
2. Read `memory/anti-patterns.yaml` — count entries
3. Read `memory/decisions.yaml` — count entries

Display:
```
Workspace Memory:
  Conventions:   {N}
  Anti-Patterns: {N}
  Decisions:     {N}
```

If memory directory doesn't exist: `Workspace memory: not initialized`

---

## Step 5: Dependency Graph

Read the dependency graph from `workspace.yaml`.

Display a visual representation:
```
Dependency Graph:
  shared-lib
  └── api-service
      └── web-app
```

If repos have no dependencies on each other: `All repositories are independent (no cross-dependencies).`

---

## IMPORTANT RULES

- This is a read-only command — do not modify any files
- If a repo path is inaccessible, show a warning but continue with other repos
- Always show all sections even if they're empty (use "none" or "not initialized" messages)
