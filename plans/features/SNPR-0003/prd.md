# SNPR-0003: Codebase Ingestion (`/sniper-ingest`)

> **Status:** Draft
> **Phase:** A — Foundation
> **Dependencies:** SNPR-0001 (artifacts should use versioned format)

## Problem Statement

SNIPER can only be used on projects that go through the full discover → plan lifecycle. For existing codebases, there is no way to bootstrap the planning artifacts (`brief.md`, `architecture.md`, `conventions.md`) that other SNIPER commands depend on.

Without these artifacts:
- `/sniper-feature` has no architecture doc to reference for architecture deltas
- `/sniper-sprint` agents have no shared context about the codebase's patterns and conventions
- `/sniper-debug` agents waste time rediscovering the project structure every session
- `/sniper-audit` has no baseline architecture to audit against

## Solution Overview

A new `/sniper-ingest` command spawns a 3-agent team that reads the existing codebase and reverse-engineers the planning artifacts. This is distinct from `/sniper-doc` which produces human-facing documentation — ingest produces agent-facing planning artifacts.

## Detailed Requirements

### 1. New Command: `/sniper-ingest`

**Usage:**
```
/sniper-ingest
/sniper-ingest --scope "src/api/ src/models/"    # limit to specific directories
/sniper-ingest --update                           # re-run on existing artifacts (amendment mode)
```

### 2. Team Composition

Three teammates, all running in parallel (no dependencies between them):

| Teammate | Persona Layers | Output | Purpose |
|----------|---------------|--------|---------|
| `code-archaeologist` | process: analyst, cognitive: systems-thinker | `docs/brief.md` | Reverse-engineer a project brief from the codebase |
| `architecture-cartographer` | process: architect, technical: backend, cognitive: systems-thinker | `docs/architecture.md` | Reverse-engineer the system architecture |
| `convention-miner` | process: analyst, cognitive: systems-thinker | `docs/conventions.md` + config updates | Extract coding patterns and update ownership rules |

### 3. Code Archaeologist — Project Brief

Reads the codebase and produces `docs/brief.md` following the existing template.

**What the agent reads:**
- `package.json` / `Cargo.toml` / `pyproject.toml` (project metadata, dependencies)
- `README.md` (if exists — existing project description)
- Top-level directory structure
- Key entry points (`src/index.ts`, `src/main.py`, `app/`, etc.)
- CI/CD configs (`.github/workflows/`, `Dockerfile`, etc.)
- Environment files (`.env.example`, not `.env`)

**What the agent produces in `docs/brief.md`:**
- Executive Summary — what this project does (inferred from code, README, package description)
- Problem Statement — what problem it solves (inferred from features and domain)
- Target Market — who uses it (inferred from UI, API consumers, etc.)
- Technical Constraints — languages, frameworks, infrastructure already chosen
- Current Scope — what's built today (feature inventory from the code)

**Important:** The brief is a reverse-engineering exercise, not a product vision. It describes what IS, not what SHOULD BE. The template sections for "Unique Value Proposition" and "Key Assumptions" should note "Inferred from existing codebase — review and update manually."

### 4. Architecture Cartographer — System Architecture

Reads the codebase and produces `docs/architecture.md` following the existing template.

**What the agent reads:**
- Full directory tree (to map component boundaries)
- Database schemas / migrations / ORM models
- API route definitions (Express routes, FastAPI endpoints, etc.)
- Configuration files (database connections, cache configs, queue configs)
- Infrastructure files (Docker, Terraform, K8s manifests)
- Key service files (to understand component responsibilities)
- Dependency graph (imports between modules)

**What the agent produces in `docs/architecture.md`:**
- Architecture Overview — component diagram (ASCII/Mermaid) of the system as-built
- Technology Choices — what's used and why (inferred from package.json/deps)
- Component Architecture — each major directory/module as a component with responsibility and interfaces
- Data Models — extracted from ORM models or migration files, with field types and relationships
- API Contracts — extracted from route definitions, with methods, paths, request/response shapes
- Infrastructure Topology — extracted from Docker/Terraform/K8s files
- Cross-Cutting Concerns — auth patterns, logging setup, error handling patterns found in code

**Important:** The architecture doc describes the system AS BUILT, including any technical debt or inconsistencies found. It should note "Pattern inconsistency found: {detail}" where applicable.

### 5. Convention Miner — Coding Conventions

Reads the codebase and produces two outputs:

**Output 1: `docs/conventions.md`** (new template)

Content:
- **Naming Conventions** — variable naming (camelCase/snake_case), file naming, directory naming
- **Code Organization** — how files are structured within directories, barrel exports, index files
- **Error Handling** — how errors are thrown/caught/propagated (custom error classes, error codes)
- **Testing Patterns** — test file location (co-located vs `__tests__/`), test naming, mock patterns, fixtures
- **API Patterns** — request validation, response formatting, middleware usage
- **State Management** — (frontend) how state is managed, data fetching patterns
- **Import Ordering** — how imports are organized
- **Configuration** — how env vars and config are accessed
- **Logging** — logging library, log levels, structured logging patterns

Each convention includes a code example extracted from the actual codebase showing the pattern in use.

**Output 2: Config ownership updates**

The convention miner reads the actual directory structure and updates `.sniper/config.yaml` `ownership` section to match reality:

```yaml
# Before (template defaults):
ownership:
  backend:
    - "src/backend/"
    - "src/api/"

# After (actual project structure):
ownership:
  backend:
    - "server/src/"
    - "server/routes/"
    - "server/services/"
    - "server/models/"
  frontend:
    - "client/src/"
    - "client/components/"
    - "client/hooks/"
  infrastructure:
    - "docker/"
    - ".github/"
    - "deploy/"
  tests:
    - "server/__tests__/"
    - "client/__tests__/"
    - "e2e/"
```

### 6. New Persona Files

**`packages/core/framework/personas/process/code-archaeologist.md`**

Role: Reverse-engineer project purpose, scope, and domain from source code. Think like a new team member on day 1 trying to understand what the project does and why. Focus on the "what" and "why", not the "how".

**`packages/core/framework/personas/process/architecture-cartographer.md`**

Role: Map the technical architecture of an existing system by reading its source code. Think like a solutions architect doing a technical assessment. Focus on component boundaries, data flow, API surface, and infrastructure. Note inconsistencies and technical debt honestly.

**`packages/core/framework/personas/process/convention-miner.md`**

Role: Extract coding patterns and conventions from an existing codebase. Think like a senior developer writing an onboarding guide. Every convention must be backed by a real code example from the project. If multiple patterns exist for the same thing, note the inconsistency.

### 7. New Team YAML

**`packages/core/framework/teams/ingest.yaml`**

```yaml
team_name: sniper-ingest
description: "Reverse-engineer project artifacts from an existing codebase"
model_override: null  # use default model

teammates:
  - name: code-archaeologist
    compose:
      process: code-archaeologist
      technical: null
      cognitive: systems-thinker
    tasks:
      - id: project-brief
        name: "Reverse-engineer Project Brief"
        output: docs/brief.md
        template: .sniper/templates/brief.md
        reads: ["package.json", "README.md", "src/"]
        blocked_by: []

  - name: architecture-cartographer
    compose:
      process: architecture-cartographer
      technical: backend
      cognitive: systems-thinker
    tasks:
      - id: system-architecture
        name: "Reverse-engineer System Architecture"
        output: docs/architecture.md
        template: .sniper/templates/architecture.md
        reads: ["src/", "db/", "docker/", "infra/"]
        blocked_by: []

  - name: convention-miner
    compose:
      process: convention-miner
      technical: null
      cognitive: systems-thinker
    tasks:
      - id: conventions
        name: "Extract Coding Conventions"
        output: docs/conventions.md
        reads: ["src/", "tests/", ".eslintrc*", "tsconfig*", ".prettierrc*"]
        blocked_by: []
      - id: ownership-update
        name: "Update Config Ownership Rules"
        output: .sniper/config.yaml (ownership section only)
        blocked_by: []

coordination: []  # all tasks are independent

review_gate:
  checklist: .sniper/checklists/ingest-review.md
  mode: flexible
```

### 8. New Command Definition

**`packages/core/framework/commands/sniper-ingest.md`**

Follows the same structure as existing commands (pre-flight → state update → read team → compose prompts → spawn → delegate → verify → review → state update → present results).

**Pre-flight checks:**
- Verify SNIPER is initialized (`.sniper/config.yaml` exists)
- Check if artifacts already exist → if yes and `--update` not passed, ask user: "Artifacts already exist. Options: (a) Amend existing (b) Overwrite (c) Cancel"
- If `--scope` is provided, validate the directories exist

**Amendment mode:** If artifacts exist and user chooses amend, agents are instructed to read existing artifacts first and update them (using SNPR-0001 versioning).

**State updates:**
- Adds an `ingest` entry to the `phase_log` (using SNPR-0002 format)
- Sets artifact statuses for brief, architecture to `draft` (version 1 for new, version N+1 for amend)

### 9. New Template

**`packages/core/framework/templates/conventions.md`**

```markdown
# Coding Conventions: {project_name}

> **Version:** 1
> **Status:** Draft
> **Last Updated:** {date}
> **Author:** Ingestion Team — Convention Miner
> **Source:** Extracted from codebase analysis

## Naming Conventions
<!-- sniper:managed:naming:start -->
<!-- sniper:managed:naming:end -->

## Code Organization
<!-- sniper:managed:code-org:start -->
<!-- sniper:managed:code-org:end -->

## Error Handling Patterns
<!-- sniper:managed:error-handling:start -->
<!-- sniper:managed:error-handling:end -->

## Testing Patterns
<!-- sniper:managed:testing:start -->
<!-- sniper:managed:testing:end -->

## API Patterns
<!-- sniper:managed:api-patterns:start -->
<!-- sniper:managed:api-patterns:end -->

## Import & Module Patterns
<!-- sniper:managed:imports:start -->
<!-- sniper:managed:imports:end -->

## Configuration & Environment
<!-- sniper:managed:config:start -->
<!-- sniper:managed:config:end -->

## Logging
<!-- sniper:managed:logging:start -->
<!-- sniper:managed:logging:end -->

## Additional Conventions
<!-- Add project-specific conventions not covered above -->
```

### 10. New Checklist

**`packages/core/framework/checklists/ingest-review.md`**

Review criteria:
- Brief accurately describes what the project does (not aspirational)
- Architecture doc component diagram matches actual directory structure
- Data models match actual ORM/migration files
- API contracts match actual route definitions
- Conventions are backed by real code examples
- Config ownership paths match actual project directories
- No hallucinated components or APIs (agent didn't make things up)

## Acceptance Criteria

1. **Given** an existing TypeScript/Express project, **When** `/sniper-ingest` is run, **Then** `docs/brief.md`, `docs/architecture.md`, and `docs/conventions.md` are produced with accurate content matching the actual codebase.

2. **Given** an existing project with a non-standard directory structure (`apps/api/`, `apps/web/`), **When** the convention-miner runs, **Then** `.sniper/config.yaml` ownership paths are updated to match the actual structure.

3. **Given** artifacts from a previous ingestion exist, **When** `/sniper-ingest --update` is run, **Then** existing artifacts are amended (version incremented) rather than overwritten.

4. **Given** `/sniper-ingest --scope "src/api/"`, **When** agents run, **Then** they only analyze the specified directories.

5. **Given** a completed ingestion, **When** `/sniper-status` is run, **Then** it shows the ingest phase in the phase log and the artifact statuses.

## Implementation Scope

### In Scope
- `/sniper-ingest` command definition
- 3 new persona files (code-archaeologist, architecture-cartographer, convention-miner)
- `ingest.yaml` team definition
- `conventions.md` template
- `ingest-review.md` checklist
- `--scope` and `--update` flags
- Config ownership auto-detection

### Out of Scope
- Integration with external tools (Sentry, Datadog) for runtime analysis
- Git history analysis (blame, frequency of changes)
- Automated test execution to understand behavior
- Language-specific deep analysis (AST parsing) — agents read code as text

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/commands/sniper-ingest.md` | NEW — command definition |
| `packages/core/framework/teams/ingest.yaml` | NEW — team composition |
| `packages/core/framework/personas/process/code-archaeologist.md` | NEW — persona |
| `packages/core/framework/personas/process/architecture-cartographer.md` | NEW — persona |
| `packages/core/framework/personas/process/convention-miner.md` | NEW — persona |
| `packages/core/framework/templates/conventions.md` | NEW — template |
| `packages/core/framework/checklists/ingest-review.md` | NEW — checklist |
| `packages/core/framework/commands/sniper-status.md` | Update to show ingest in phase log |
| `packages/core/framework/commands/sniper-review.md` | Add `ingest` to phase-to-checklist mapping |
| `packages/core/framework/config.template.yaml` | Add conventions artifact tracking (see phase-a-config-schema.md) |
