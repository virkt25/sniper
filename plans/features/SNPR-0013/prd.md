# SNPR-0013: Multi-Project Orchestration

> **Status:** Draft
> **Phase:** D — Advanced
> **Dependencies:** SNPR-0004 (feature lifecycle — orchestration uses feature-scoped workflows per repo)
> **Soft Dependencies:** SNPR-0012 (workspace memory enables cross-repo learning), SNPR-0011 (domain packs can be shared across workspace repos)

## Problem Statement

Modern software systems are rarely single-repository. A typical product has a backend API, frontend app, shared library, infrastructure config, and often multiple microservices. SNIPER today operates within a single repository — there is no way to:

1. **Plan a feature across repos** — "add user preferences" might need a database migration in the API, a new settings page in the web app, and a new type definition in the shared library. Today you'd run `/sniper-feature` independently in each repo, with no coordination.
2. **Respect cross-repo dependencies** — the shared library types must be published before the API can consume them, and the API endpoints must be deployed before the frontend can call them. Today, agents have no awareness of these dependency chains.
3. **Share architecture context** — the API's data model, the frontend's component hierarchy, and the shared library's type system are all related. Agents working in one repo can't see the architecture of another.
4. **Coordinate sprints** — sprint planning in the API shouldn't conflict with sprint planning in the web app. Shared interfaces need to be agreed upon before either side implements.
5. **Maintain consistency** — naming conventions, error formats, API contracts, and shared types drift between repos without a mechanism to enforce alignment.

A workspace-level orchestration system would let SNIPER coordinate agent teams across multiple repositories, plan features holistically, and maintain cross-repo consistency.

## Solution Overview

A **workspace** abstraction that sits above individual SNIPER-enabled projects:

```
sniper-workspace/                      # Workspace root (its own git repo or a directory)
├── workspace.yaml                     # Workspace manifest
├── memory/                            # Workspace-level memory (SNPR-0012)
│   ├── conventions.yaml
│   ├── anti-patterns.yaml
│   └── decisions.yaml
├── contracts/                         # Interface contracts between repos
│   ├── api-web.contract.yaml          # API ↔ Web App contract
│   └── api-shared.contract.yaml       # API ↔ Shared Lib contract
├── features/                          # Cross-repo feature plans
│   └── WKSP-0001/
│       ├── brief.md                   # Workspace-level feature brief
│       ├── plan.md                    # Cross-repo implementation plan
│       └── repo-stories/             # Per-repo story references
│           ├── api-service.yaml
│           ├── web-app.yaml
│           └── shared-lib.yaml
└── repositories/                      # Symlinks or paths to member repos
    ├── api-service -> /path/to/api-service
    ├── web-app -> /path/to/web-app
    └── shared-lib -> /path/to/shared-lib
```

The execution model is **contract-first**: during planning, generate shared interface contracts (API schemas, TypeScript types, event definitions), then each repo sprints independently against those contracts. A final integration validation step catches mismatches.

## Detailed Requirements

### 1. Workspace Manifest (`workspace.yaml`)

```yaml
name: my-saas-platform
description: "Multi-service SaaS platform with API, web app, and shared library"
version: "1.0"

repositories:
  - name: api-service
    path: ../api-service              # relative path or absolute
    role: backend                     # backend | frontend | library | infrastructure | service
    language: typescript
    sniper_enabled: true              # has .sniper/ directory
    exposes:                          # what this repo provides to others
      - type: rest_api
        spec: openapi.yaml            # path within the repo
      - type: database_schema
        spec: prisma/schema.prisma
      - type: event_bus
        spec: events/schema.yaml
    consumes:                         # what this repo depends on from others
      - from: shared-lib
        type: npm_package
        package: "@myapp/shared-types"

  - name: web-app
    path: ../web-app
    role: frontend
    language: typescript
    sniper_enabled: true
    consumes:
      - from: api-service
        type: rest_api
      - from: shared-lib
        type: npm_package
        package: "@myapp/shared-types"

  - name: shared-lib
    path: ../shared-lib
    role: library
    language: typescript
    sniper_enabled: true
    exposes:
      - type: npm_package
        package: "@myapp/shared-types"

dependency_graph:
  # Determines sprint ordering for cross-repo features
  # Read as: "web-app depends on api-service, which depends on shared-lib"
  web-app:
    - api-service
  api-service:
    - shared-lib

# Workspace-level config
config:
  contract_format: yaml              # yaml | openapi | graphql | protobuf
  integration_validation: true       # run integration checks after cross-repo sprints
  shared_domain_packs:               # packs applied to all repos
    - saas
  memory:
    workspace_conventions: true      # enable workspace-level memory (SNPR-0012)
    auto_promote: false              # auto-promote repo conventions to workspace (or require confirmation)
```

### 2. Interface Contracts

Contracts define the agreed-upon interfaces between repositories. They are generated during cross-repo feature planning and serve as the "contract" each repo implements against.

#### Contract Format

```yaml
# contracts/api-web.contract.yaml
contract:
  name: api-web
  between: [api-service, web-app]
  version: "2.3.0"
  last_updated: "2026-02-22"
  updated_by: "WKSP-0001"           # feature that last modified this contract

endpoints:
  - path: /api/v1/users/preferences
    method: PUT
    request_body:
      type: object
      properties:
        theme:
          type: string
          enum: [light, dark, system]
        notifications:
          type: object
          properties:
            email: { type: boolean }
            push: { type: boolean }
            sms: { type: boolean }
        timezone:
          type: string
          format: iana-timezone
    response:
      200:
        type: object
        properties:
          id: { type: string, format: uuid }
          preferences: { $ref: "#/request_body" }
          updated_at: { type: string, format: date-time }
      400:
        type: object
        properties:
          error: { type: string }
          details: { type: array, items: { type: string } }

  - path: /api/v1/users/preferences
    method: GET
    response:
      200:
        $ref: "#/endpoints/0/response/200"

shared_types:
  - name: UserPreferences
    repo: shared-lib
    path: src/types/user-preferences.ts
    definition:
      theme: "light | dark | system"
      notifications: "{ email: boolean; push: boolean; sms: boolean }"
      timezone: string

events:
  - name: user.preferences.updated
    producer: api-service
    consumers: [web-app]
    payload:
      user_id: { type: string, format: uuid }
      changes: { type: object }
      timestamp: { type: string, format: date-time }
```

#### Contract Lifecycle

1. **Generation** — during `/sniper-workspace feature`, the planning agent produces contracts for interfaces that the feature will create or modify
2. **Review** — contracts are reviewed as part of the workspace-level plan review
3. **Versioning** — contracts have semver versions; breaking changes increment major
4. **Implementation** — each repo implements against the contract during its sprint
5. **Validation** — after sprints complete, an integration validator checks that implementations match contracts

### 3. Workspace Commands

#### `/sniper-workspace init`

Initialize a new workspace:

```bash
/sniper-workspace init
```

Interactive flow:
1. Ask for workspace name and description
2. Scan for SNIPER-enabled repos in parent/sibling directories
3. Let user select which repos to include
4. Auto-detect `exposes`/`consumes` relationships by scanning:
   - `package.json` for npm dependencies between repos
   - OpenAPI/Swagger specs for API contracts
   - Import statements for cross-repo type references
5. Generate `workspace.yaml` with auto-detected dependency graph
6. Create `memory/`, `contracts/`, `features/` directories
7. Initialize workspace-level memory from SNPR-0012

#### `/sniper-workspace feature`

Plan and execute a feature across multiple repos:

```bash
/sniper-workspace feature "Add user preferences with theme, notification, and timezone settings"
```

**Phase 1 — Scoping (single agent):**
1. Read `workspace.yaml` to understand repo topology
2. Read architecture docs from each repo (via SNPR-0003 ingestion data or `docs/architecture.md`)
3. Produce a **Workspace Feature Brief**:
   - Which repos are affected and why
   - What new interfaces/contracts are needed
   - What existing contracts change
   - Dependency ordering for implementation

**Phase 2 — Contract Generation (planning team):**
1. For each new or modified interface, generate a contract YAML
2. For shared types, specify the type definition and which repo owns it
3. Produce a **Cross-Repo Implementation Plan**:
   - Per-repo work breakdown (what each repo needs to implement)
   - Sprint ordering based on dependency graph
   - Integration validation criteria

**Phase 3 — Per-Repo Story Generation:**
1. For each affected repo, run a scoped `/sniper-feature` (from SNPR-0004) using:
   - The workspace feature brief as context
   - The relevant contracts as interface specifications
   - The repo's own architecture docs
2. Stories are generated within each repo's own `.sniper/` structure
3. Story references are saved in the workspace feature directory:

```yaml
# features/WKSP-0001/repo-stories/api-service.yaml
repo: api-service
feature_ref: "SNPR-0025"           # the feature ID in the repo's own numbering
stories:
  - id: "STORY-101"
    title: "Add preferences table and migration"
    contract_refs: [api-web/endpoints/0]
  - id: "STORY-102"
    title: "Implement PUT /preferences endpoint"
    contract_refs: [api-web/endpoints/0]
  - id: "STORY-103"
    title: "Implement GET /preferences endpoint"
    contract_refs: [api-web/endpoints/1]
  - id: "STORY-104"
    title: "Emit user.preferences.updated event"
    contract_refs: [api-web/events/0]
```

**Phase 4 — Orchestrated Sprints:**

Sprint execution follows the dependency graph:

```
Wave 1: shared-lib    (types and interfaces)
Wave 2: api-service   (backend implementation against contracts)
Wave 3: web-app       (frontend consuming the API)
```

Within each wave:
1. `cd` into the repo directory
2. Run `/sniper-sprint` with the feature's stories
3. After sprint completion, run the repo's review gate
4. Run contract validation against the relevant contracts
5. If contract validation fails, stop and surface the mismatch before proceeding to the next wave

**Phase 5 — Integration Validation:**

After all waves complete:
1. Run cross-repo integration checks:
   - Type compatibility between shared-lib exports and consumer imports
   - API contract compliance (endpoints, request/response schemas)
   - Event schema compatibility (producer events match consumer expectations)
2. If mismatches are found, generate fix stories and run a corrective sprint
3. If all checks pass, mark the workspace feature as complete

#### `/sniper-workspace status`

```
Workspace: my-saas-platform

Repositories:
  api-service    ✅ SNIPER enabled    3 active features
  web-app        ✅ SNIPER enabled    2 active features
  shared-lib     ✅ SNIPER enabled    1 active feature

Active Workspace Features:
  WKSP-0001  "User preferences"    Phase: Sprint (Wave 2/3 — api-service)
  WKSP-0002  "Audit logging"       Phase: Planning

Contracts:
  api-web         v2.3.0   Last updated: WKSP-0001
  api-shared      v1.1.0   Last updated: WKSP-0001

Workspace Memory:
  4 conventions, 2 anti-patterns, 3 decisions
```

#### `/sniper-workspace validate`

Run contract validation across all repos without a sprint:

```bash
/sniper-workspace validate                    # validate all contracts
/sniper-workspace validate --contract api-web # validate specific contract
```

### 4. Contract-First Execution Model

The contract-first approach is the core architectural decision. Here's how it works in detail:

**Why contract-first over alternatives:**

| Concern | Sequential Repos | Orchestrator Agent | Contract-First |
|---------|-----------------|-------------------|----------------|
| Speed | Slow — serial | Fast — parallel | Fast — parallel within waves |
| Safety | High — each repo done before next | Low — concurrent mutation risk | High — contracts lock interfaces |
| Complexity | Low | Very High — meta-agent managing agents | Medium — contracts are the coordination mechanism |
| Error handling | Easy — stop at first failure | Hard — rollback across repos | Medium — contract validation catches issues |

**Contract as coordination mechanism:**
- Contracts are **immutable during a sprint wave** — once generated and approved, they don't change until the wave completes
- Each repo implements **only its side** of the contract — the API implements the endpoints, the frontend calls them
- Contract validation runs **between waves**, not during — this prevents mid-sprint confusion
- If validation fails, it produces specific, actionable mismatches (not vague "something is wrong")

**Parallel execution within constraints:**
- Repos in the same dependency tier can sprint in parallel (e.g., if `service-a` and `service-b` both depend only on `shared-lib`, they can sprint simultaneously)
- The dependency graph determines wave grouping:
  ```
  Wave 1: [shared-lib]                    # no dependencies
  Wave 2: [api-service, worker-service]   # both depend on shared-lib only
  Wave 3: [web-app]                       # depends on api-service
  ```

### 5. Workspace Memory Integration (SNPR-0012)

The workspace is the natural home for cross-repo memory:

**Convention promotion flow:**
1. Retro in `api-service` discovers: "All endpoints return `{ data, error, meta }` envelope"
2. Retro agent checks: does this convention exist in other repos?
3. If `web-app` also follows this pattern, the convention is a promotion candidate
4. If `auto_promote: true`, it moves to workspace memory automatically
5. If `auto_promote: false`, the user is prompted to confirm

**Cross-repo anti-pattern detection:**
- An anti-pattern found in one repo is checked against all repos in the workspace
- If the same anti-pattern exists in multiple repos, it's promoted to workspace-level
- Workspace anti-patterns are injected into all agents across all repos

**Shared decisions:**
- Architecture decisions at the workspace level (e.g., "all services use PostgreSQL", "all APIs version with /v1/ prefix") apply to all repos
- Repo-level decisions can refine but not contradict workspace decisions

### 6. CLI Integration

The workspace commands are part of the existing SNIPER CLI:

```bash
sniper workspace init                          # initialize workspace
sniper workspace add-repo ../new-service       # add a repo to workspace
sniper workspace remove-repo old-service       # remove a repo
sniper workspace status                        # show workspace status
sniper workspace validate                      # validate contracts
```

The slash commands (`/sniper-workspace *`) are the Claude Code equivalents that invoke the same logic through the agent framework.

### 7. Workspace Feature Numbering

Workspace features use a `WKSP-XXXX` prefix to distinguish from repo-level `SNPR-XXXX` features:

```yaml
# workspace.yaml
state:
  feature_counter: 3
  features:
    - id: "WKSP-0001"
      title: "User preferences"
      phase: sprint
      sprint_wave: 2
      repos_affected: [api-service, web-app, shared-lib]
      contracts_modified: [api-web, api-shared]
      created_at: "2026-02-20"
```

Each workspace feature maps to one or more repo-level features (via SNPR-0004). The workspace tracks the mapping.

## Acceptance Criteria

1. **Given** `/sniper-workspace init`, **When** sibling directories contain SNIPER-enabled repos, **Then** auto-detect repos and dependency relationships from package.json/imports.

2. **Given** a workspace with 3 repos, **When** `/sniper-workspace feature "Add preferences"` runs, **Then** it produces a workspace brief identifying affected repos, generates interface contracts, and creates per-repo story references.

3. **Given** a dependency graph `web-app -> api-service -> shared-lib`, **When** orchestrated sprints run, **Then** shared-lib sprints first (Wave 1), then api-service (Wave 2), then web-app (Wave 3).

4. **Given** contracts between api-service and web-app, **When** api-service's sprint completes, **Then** contract validation runs and reports any mismatches before web-app's sprint begins.

5. **Given** repos in the same dependency tier, **When** sprints are orchestrated, **Then** they can run in parallel (e.g., two independent services both depending on shared-lib).

6. **Given** a contract validation failure, **When** the orchestrator detects it, **Then** it generates specific fix stories and halts the next wave until fixes are applied.

7. **Given** workspace-level memory conventions, **When** agents are spawned in any repo, **Then** they receive workspace conventions in their spawn prompts.

8. **Given** `/sniper-workspace validate`, **When** run without a sprint context, **Then** it checks all contracts against current repo implementations and reports compliance.

## Implementation Scope

### In Scope
- `workspace.yaml` manifest format and schema
- Workspace initialization with auto-detection of repos and dependencies
- Interface contract format (YAML-based, covering REST, shared types, events)
- Contract lifecycle (generation, review, versioning, validation)
- `/sniper-workspace init` command
- `/sniper-workspace feature` command (scoping, planning, contract generation, per-repo story generation, orchestrated sprints)
- `/sniper-workspace status` command
- `/sniper-workspace validate` command
- Wave-based sprint orchestration following dependency graph
- Contract validation between waves
- Integration with SNPR-0004 (`/sniper-feature`) for per-repo execution
- Integration with SNPR-0012 (workspace-level memory)
- Workspace feature numbering (`WKSP-XXXX`)
- CLI `sniper workspace` commands

### Out of Scope
- Remote repository support (repos must be on local filesystem)
- CI/CD pipeline orchestration (workspace doesn't manage deployments)
- GraphQL or Protobuf contract formats (YAML and OpenAPI only for v1)
- Automatic repo scaffolding (repos must already exist with SNIPER initialized)
- Cross-workspace coordination (no workspace-of-workspaces)
- Real-time contract sync (contracts are point-in-time snapshots)
- Distributed sprint execution (all repos must be accessible from the same machine)
- Contract diffing / changelog generation
- Contract testing framework (validation is structural, not behavioral)

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-workspace-init.md` | NEW — workspace init command definition |
| `packages/core/framework/commands/sniper-workspace-feature.md` | NEW — workspace feature command definition |
| `packages/core/framework/commands/sniper-workspace-status.md` | NEW — workspace status command definition |
| `packages/core/framework/commands/sniper-workspace-validate.md` | NEW — workspace validate command definition |
| `packages/core/framework/personas/process/workspace-orchestrator.md` | NEW — orchestrator agent persona |
| `packages/core/framework/personas/process/contract-designer.md` | NEW — contract designer agent persona |
| `packages/core/framework/personas/process/integration-validator.md` | NEW — integration validator agent persona |
| `packages/core/framework/teams/workspace-feature.yaml` | NEW — team composition for workspace features |
| `packages/core/framework/teams/workspace-validation.yaml` | NEW — team composition for contract validation |
| `packages/core/framework/templates/workspace-brief.md` | NEW — workspace feature brief template |
| `packages/core/framework/templates/workspace-plan.md` | NEW — cross-repo implementation plan template |
| `packages/core/framework/templates/contract.yaml` | NEW — interface contract template |
| `packages/core/framework/templates/contract-validation-report.md` | NEW — validation report template |
| `packages/core/framework/workflows/workspace-feature.md` | NEW — workspace feature workflow definition |
| `packages/core/framework/config.template.yaml` | UPDATE — add workspace configuration section |
| `packages/cli/src/commands/workspace.ts` | NEW — CLI `sniper workspace` command |
| `packages/cli/src/workspace/` | NEW — workspace manager (manifest parsing, contract handling, wave orchestration) |
