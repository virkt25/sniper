---
name: sniper-init
description: Initialize SNIPER v3 in a new or existing project
arguments:
  - name: language
    description: Primary language (auto-detected if omitted)
    required: false
---

# /sniper-init

Initialize SNIPER v3 framework in the current project.

## Process

### 1. Check Existing State

- If `.sniper/config.yaml` exists, ask user: "SNIPER is already initialized. Reinitialize? (existing config will be backed up)"
- If reinitializing, copy `.sniper/config.yaml` to `.sniper/config.yaml.bak`

### 2. Auto-Detect Project

Scan the project directory to detect:

**Language** (check in order):
- `tsconfig.json` or `*.ts` files → TypeScript
- `package.json` → JavaScript
- `pyproject.toml` or `requirements.txt` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust
- `pom.xml` or `build.gradle` → Java
- Fall back to `--language` argument or ask user

**Package Manager**:
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `bun.lockb` → bun
- `package-lock.json` → npm
- `uv.lock` → uv
- `poetry.lock` → poetry

**Framework**:
- `next.config.*` → Next.js
- `nuxt.config.*` → Nuxt
- `vite.config.*` → Vite
- `angular.json` → Angular

**Test Runner**:
- `vitest.config.*` → Vitest
- `jest.config.*` → Jest
- `pytest.ini` or `conftest.py` → Pytest

**Commands** (from package.json scripts or Makefile):
- Look for `test`, `lint`, `build`, `typecheck` scripts

### 3. Gather User Input

Ask the user (with auto-detected defaults pre-filled):
1. Project name (default: directory name)
2. Project type (saas, api, mobile, cli, library, monorepo)
3. One-line description
4. Max concurrent teammates (default: 5)
5. Confirm detected stack

### 4. Scaffold Structure

Create the following directory structure:
```
.sniper/
  config.yaml              ← Generated from template + user input + auto-detection
  checkpoints/
  gates/
  retros/
  self-reviews/
  checklists/              ← Copied from @sniper.ai/core/checklists/
.claude/
  agents/                  ← Copied from @sniper.ai/core/agents/
  settings.json            ← Merge hooks from @sniper.ai/core/hooks/
docs/
CLAUDE.md                  ← Generated from template
```

### 5. Apply Plugins

If plugins are configured (or auto-detected):
1. Read each plugin's `plugin.yaml`
2. Merge plugin commands into config
3. Copy plugin mixins to `.claude/personas/cognitive/`
4. Merge plugin hooks into `.claude/settings.json`

### 6. Confirm

Display summary:
- Files created/modified
- Detected stack
- Suggested next step: "Run `/sniper-flow` to start your first protocol"

## Rules

- NEVER overwrite existing project source files
- ALWAYS back up existing config before reinitializing
- ALWAYS show the user what will be created before doing it
- Respect `.gitignore` — add `.sniper/checkpoints/` and `.sniper/gates/` if not present
