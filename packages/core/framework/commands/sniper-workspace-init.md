# /sniper-workspace init -- Initialize a SNIPER Workspace

You are executing the `/sniper-workspace init` command. Your job is to create a workspace that coordinates multiple SNIPER-enabled repositories. Follow every step below precisely.

---

## Step 0: Pre-Flight Checks

1. Check if a `workspace.yaml` file exists in the current directory.
   - If yes, print:
     ```
     A workspace already exists in this directory.

     Workspace: {name}
     Repositories: {count}

     To add repos: /sniper-workspace add-repo <path>
     To view status: /sniper-workspace status
     ```
     Then STOP.
2. The current directory will become the workspace root. It can be:
   - A dedicated workspace directory (recommended)
   - An existing repo that will also serve as workspace root

---

## Step 1: Gather Workspace Information

Ask the user for:
1. **Workspace name** — short identifier (e.g., "my-saas-platform")
2. **Description** — one-line description of what the workspace coordinates

---

## Step 2: Scan for SNIPER-Enabled Repositories

1. Scan the parent directory and sibling directories for SNIPER-enabled repos:
   - Check each directory for `.sniper/config.yaml`
   - Also check immediate subdirectories (for monorepo-adjacent setups)
2. For each found repo, read its `.sniper/config.yaml` to extract:
   - `project.name`
   - `project.type`
   - `stack.language`
3. Present the discovered repos:
   ```
   Discovered SNIPER-enabled repositories:

     ✅ ../api-service      (API, typescript)
     ✅ ../web-app           (SaaS, typescript)
     ✅ ../shared-lib        (Library, typescript)
     ⬜ ../unrelated-repo    (CLI, python) — not selected
   ```
4. Let the user select which repos to include (default: all)
5. Let the user add additional repo paths manually

---

## Step 3: Auto-Detect Dependencies

For each selected repository:

### 3a: Package Dependencies
1. Read `package.json` (if exists) and check for cross-repo npm dependencies
2. If repo A's `package.json` has repo B's package name in `dependencies` or `devDependencies`, record: A depends on B

### 3b: API Specs
1. Check for `openapi.yaml`, `openapi.json`, `swagger.yaml`, or `swagger.json` in the repo root or `docs/` directory
2. If found, record it as an exposed API spec

### 3c: Type Exports
1. Check for shared type packages by looking at `package.json` exports or main fields
2. If a repo's name appears in another repo's imports, record the relationship

### 3d: Present Detected Dependencies
```
Detected dependency graph:

  shared-lib
    └── api-service
        └── web-app

  web-app depends on:
    - api-service (REST API consumer)
    - shared-lib (npm package: @myapp/shared-types)

  api-service depends on:
    - shared-lib (npm package: @myapp/shared-types)

  shared-lib depends on:
    - (none — leaf node)
```

Let the user confirm or modify the dependency graph.

---

## Step 4: Determine Repository Roles

For each repository, infer its role from the project type and stack:

| Project Type | Inferred Role |
|-------------|---------------|
| saas, web | frontend |
| api | backend |
| library | library |
| cli | service |
| monorepo | service |
| mobile | frontend |

Let the user confirm or override roles.

Also determine `exposes` and `consumes` for each repo based on the dependency analysis from Step 3.

---

## Step 5: Generate workspace.yaml

Create the workspace manifest:

```yaml
name: "{workspace_name}"
description: "{description}"
version: "1.0"

repositories:
  - name: {repo_name}
    path: {relative_path}
    role: {role}
    language: {language}
    sniper_enabled: true
    exposes:
      # Auto-detected from Step 3
      - type: rest_api | npm_package | event_bus | database_schema
        spec: {path_to_spec}    # optional
        package: {package_name} # for npm_package type
    consumes:
      # Auto-detected from Step 3
      - from: {repo_name}
        type: rest_api | npm_package
        package: {package_name} # for npm_package type

dependency_graph:
  {repo_name}:
    - {dependency_repo_name}

config:
  contract_format: yaml
  integration_validation: true
  shared_domain_packs: []
  memory:
    workspace_conventions: true
    auto_promote: false

state:
  feature_counter: 1
  features: []
```

Write the file to `workspace.yaml` in the current directory.

---

## Step 6: Create Workspace Directories

Create the following directory structure:

```
memory/
  conventions.yaml    # workspace-level: conventions: []
  anti-patterns.yaml  # workspace-level: anti_patterns: []
  decisions.yaml      # workspace-level: decisions: []
contracts/
  .gitkeep
features/
  .gitkeep
```

Initialize the memory YAML files with empty arrays.

---

## Step 7: Create Repository Symlinks (Optional)

If the repos are not subdirectories of the workspace:

```
repositories/
  api-service -> ../api-service
  web-app -> ../web-app
  shared-lib -> ../shared-lib
```

Ask the user if they want symlinks created. If the repos are already subdirectories, skip this step.

---

## Step 8: Update Per-Repo Configs

For each selected repository:
1. Read its `.sniper/config.yaml`
2. Add or update the workspace section:
   ```yaml
   workspace:
     enabled: true
     workspace_path: "{relative_path_to_workspace}"
     repo_name: "{this_repo_name}"
   ```
3. Write the updated config

---

## Step 9: Display Workspace Summary

```
============================================
  SNIPER Workspace Initialized
============================================

  Name:         {workspace_name}
  Description:  {description}
  Location:     {current_directory}

  Repositories ({count}):
    {repo_name}  ({role}, {language})  {path}
    ...

  Dependency Graph:
    {visual representation}

  Directories Created:
    memory/        Workspace-level memory
    contracts/     Interface contracts
    features/      Cross-repo feature plans

  Next Steps:
    /sniper-workspace feature "{description}"  — Plan a cross-repo feature
    /sniper-workspace status                   — View workspace status

============================================
```

---

## IMPORTANT RULES

- The workspace root is the current directory — do NOT create a subdirectory
- Repository paths in workspace.yaml are always relative to the workspace root
- Never modify a repo's source code during init — only update .sniper/config.yaml
- If a repo is not SNIPER-enabled, warn the user and exclude it (they must run `sniper init` first)
- The dependency graph must be a DAG (directed acyclic graph) — flag circular dependencies as errors
- Auto-detection is best-effort — always let the user confirm and modify
- Memory YAML files must be initialized with empty arrays, not null
