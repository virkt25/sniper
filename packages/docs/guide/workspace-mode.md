---
title: Workspace Mode
description: Orchestrate multiple repositories with shared conventions and cross-project coordination
---

# Workspace Mode

Workspace mode orchestrates SNIPER across multiple repositories. Use it when your system spans several repos that need coordinated feature development, shared contracts, and consistent conventions.

## When to Use Workspace Mode

Workspace mode is designed for:

- Microservice architectures with separate repos per service
- Frontend/backend split repos that share API contracts
- Monorepo-adjacent setups with shared libraries
- Any multi-repo system where features span repository boundaries

## Setting Up a Workspace

### Initialize the Workspace

Navigate to a directory that will serve as the workspace root (can be a dedicated directory or an existing repo) and run:

```
/sniper-workspace init
```

The command:

1. Asks for a workspace name and description
2. Scans sibling directories for SNIPER-enabled repos (those with `.sniper/config.yaml`)
3. Auto-detects dependencies by analyzing `package.json` imports, API specs, and type exports
4. Presents a dependency graph for your confirmation
5. Determines each repository's role (frontend, backend, library, service)
6. Generates `workspace.yaml`

### workspace.yaml

The workspace manifest defines the topology:

```yaml
name: "my-saas-platform"
description: "Multi-service SaaS platform"
version: "1.0"

repositories:
  - name: api-service
    path: ../api-service
    role: backend
    language: typescript
    sniper_enabled: true
    exposes:
      - type: rest_api
        spec: docs/openapi.yaml
    consumes: []

  - name: web-app
    path: ../web-app
    role: frontend
    language: typescript
    sniper_enabled: true
    consumes:
      - from: api-service
        type: rest_api

dependency_graph:
  api-service: []
  web-app: [api-service]

config:
  contract_format: yaml
  integration_validation: true
  memory:
    workspace_conventions: true
    auto_promote: false
```

### Workspace Directories

The workspace creates:

```
workspace-root/
  workspace.yaml          # Workspace manifest
  memory/                 # Workspace-level conventions
    conventions.yaml
    anti-patterns.yaml
    decisions.yaml
  contracts/              # Interface contracts between repos
  features/               # Cross-repo feature plans
```

### Per-Repo Configuration

Each repository's `.sniper/config.yaml` is updated with workspace information:

```yaml
workspace:
  enabled: true
  workspace_path: "../workspace-root"
  repo_name: "api-service"
```

## Cross-Repo Features

To plan and implement a feature that spans multiple repos:

```
/sniper-workspace feature "Add real-time notification support"
```

This runs a 5-phase process:

### Phase 1: Scoping

A workspace orchestrator agent produces a feature brief identifying which repos are affected, what interfaces need to change, and the wave ordering based on the dependency graph.

### Phase 2: Contract Design

A contract designer agent creates interface contracts for all cross-repo communication. Contracts define endpoints, shared types, events, and versioning. Contracts are immutable once approved.

### Phase 3: Per-Repo Story Generation

For each affected repository, scoped `/sniper-flow --protocol feature` runs produce stories within each repo's own SNIPER structure, referencing the approved contracts.

### Phase 4: Wave-Based Sprint Orchestration

Repos are assigned to waves based on the dependency graph:

- **Wave 1:** Repos with no dependencies (leaf nodes)
- **Wave 2:** Repos depending only on Wave 1 repos
- **Wave 3:** Repos depending on Wave 2 repos

Repos within the same wave can sprint in parallel. Between waves, contract validation runs to verify implementations match the agreed-upon interfaces.

### Phase 5: Final Integration Validation

After all waves complete, full contract validation runs across all repos to verify end-to-end compatibility.

## Contract Validation

Validate that implementations match contracts at any time:

```
/sniper-workspace validate
```

This checks:
- **Endpoint validation** -- route definitions match contract paths and methods
- **Shared type validation** -- type shapes match contract definitions
- **Event validation** -- producer/consumer schemas align

Results show PASS/FAIL per contract item with specific mismatch details.

## Workspace Status

View the full workspace state:

```
/sniper-workspace status
```

This shows repository status, active features, contract versions, workspace memory, and the dependency graph.

## Workspace Memory

When workspace memory is enabled, conventions that appear consistently across multiple repos are promoted to workspace-level memory. Workspace conventions are labeled `[WORKSPACE]` in agent spawn prompts and apply to all repos.

Workspace memory promotion can be automatic (`auto_promote: true`) or require user confirmation.

## Important Rules

- Contracts are immutable during sprint waves -- they do not change until a wave completes
- Wave ordering is mandatory -- a repo never sprints before its dependency wave completes
- Each repo sprints independently -- agents in one repo do not modify files in another
- The workspace orchestrator coordinates but does not code

## Next Steps

- [Memory System](/guide/memory) -- how workspace memory integrates with per-repo memory
- [Configuration](/guide/configuration) -- workspace section of config.yaml
- [Teams](/guide/teams) -- how workspace teams coordinate across repos
