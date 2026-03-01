---
title: Plugin Development
description: Build language plugins and domain packs with the plugin.yaml manifest format
---

# Plugin Development

Plugins extend SNIPER with language-specific commands, conventions, review checks, and agent mixins. SNIPER ships with plugins for TypeScript, Python, and Go. You can create your own.

## Plugin Structure

A plugin is an npm package with this structure:

```
plugin-mylanaguage/
  package.json              # npm package metadata
  plugin.yaml               # Plugin manifest (required)
  mixins/                   # Agent knowledge mixins
    mylanaguage-backend.md  # Backend-dev language context
    mylanaguage-frontend.md # Frontend-dev language context
```

## Plugin Manifest

The `plugin.yaml` file defines everything the plugin provides:

```yaml
name: mylanaguage
version: 1.0.0
description: MyLanguage language support for SNIPER
language: mylanaguage

commands:
  build:
    run: "mylang build"
    description: Build the project
  test:
    run: "mylang test"
    description: Run tests
  lint:
    run: "mylang lint"
    description: Run linter
  typecheck:
    run: "mylang check"
    description: Run type checker

conventions:
  - Use descriptive variable names following community style guide
  - All public functions must have doc comments
  - Error handling must use Result types, never panic
  - Tests must be in the same package as the code they test

review_checks:
  - id: no-panic
    description: No panic() calls in production code
    command: "!grep:src/**/*.ml:panic"
    blocking: true
  - id: doc-comments
    description: Public functions have doc comments
    command: "grep:src/**/*.ml:///|/\\*\\*"
    blocking: false

agent_mixins:
  backend-dev: mixins/mylanaguage-backend.md
  frontend-dev: mixins/mylanaguage-frontend.md

hooks:
  PreToolUse:
    - "mylang typecheck --no-emit 2>&1 | head -20"
  Stop:
    - "mylang typecheck --no-emit"
```

## Manifest Reference

### `commands`

Maps command names to shell commands. These are used by agents when they need to build, test, or lint:

| Key | Used By | Purpose |
|-----|---------|---------|
| `build` | Implement agents | Compile / bundle the project |
| `test` | Implement agents, QA | Run the test suite |
| `lint` | Implement agents, reviewer | Check code style |
| `typecheck` | Implement agents, reviewer | Verify type safety |
| `format` | Implement agents | Auto-format code |

### `conventions`

A list of coding convention strings. These are injected into agent spawn prompts so developers follow your language's idioms. Keep conventions concise -- each one should be a single sentence.

### `review_checks`

Automated checks run during review gates. Each check has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `description` | string | What this check validates |
| `command` | string | Shell command or check expression (see Check Types below) |
| `blocking` | boolean | Whether failure blocks gate advancement |

**Check Types:**

The `command` field accepts raw shell commands or pattern expressions:

- `grep:<path>:<pattern>` -- check that pattern exists in files
- `!grep:<path>:<pattern>` -- check that pattern does NOT exist
- Raw shell command (e.g., `npx tsc --noEmit`) -- run command, check exit code 0

### `agent_mixins`

Map agent names to markdown files that provide language-specific context. When a plugin is installed, these mixins are composed into the agent's persona.

For example, the TypeScript plugin's `typescript-backend.md` mixin tells the backend-dev agent about:

- TypeScript strict mode and compiler options
- ESM module patterns
- Type assertion best practices
- Framework-specific patterns (Express, Fastify)

### `hooks`

Plugin-specific hooks that extend SNIPER's hook system. These merge with the core hooks during installation.

## Official Plugins

### TypeScript (`@sniper.ai/plugin-typescript`)

```yaml
commands:
  build: "npx tsup" or "npx tsc"
  test: "npx vitest run" or "npx jest"
  lint: "npx eslint ."
  typecheck: "npx tsc --noEmit"

conventions:
  - Strict mode enabled (strict: true in tsconfig)
  - ESM modules (type: module)
  - Explicit return types on exported functions
  - No barrel exports (index.ts re-exports)
  - Use unknown over any
  - Use readonly modifiers for immutable data

review_checks:
  - no-any (non-blocking)
  - no-ts-ignore (blocking)
  - strict-null-checks (non-blocking)
```

### Python (`@sniper.ai/plugin-python`)

```yaml
commands:
  test: "pytest"
  lint: "ruff check ."
  typecheck: "mypy ."
  format: "ruff format ."

conventions:
  - PEP 8 style
  - Type hints on all function signatures
  - pathlib.Path over os.path
  - dataclasses or Pydantic for data models
  - f-strings for formatting
  - if __name__ == "__main__" guard

review_checks:
  - no-bare-except (blocking)
  - type-annotations (blocking)
  - no-print (optional)
```

### Go (`@sniper.ai/plugin-go`)

```yaml
commands:
  test: "go test ./..."
  lint: "golangci-lint run"
  vet: "go vet ./..."
  build: "go build ./..."

conventions:
  - Effective Go style
  - Explicit error handling (no _ for errors)
  - context.Context as first parameter
  - Table-driven tests
  - Small interfaces (1-3 methods)

review_checks:
  - no-fmt-println (blocking)
  - error-handling (blocking)
  - context-first (optional)
```

## Installing Plugins

```bash
sniper plugin install @sniper.ai/plugin-typescript
```

This:

1. Resolves the npm package
2. Reads the `plugin.yaml` manifest
3. Copies agent mixins into `.sniper/personas/`
4. Merges review checks into the gate configuration
5. Registers commands in `.sniper/config.yaml`
6. Installs hooks

### Managing Plugins

```bash
sniper plugin list                              # List installed plugins
sniper plugin remove typescript                 # Remove a plugin
```

## Creating a Domain Pack

Domain packs are similar to plugins but provide industry-specific knowledge rather than language tooling. See the [Domain Packs](/guide/domain-packs) guide for details on creating packs.

The key difference:

| Aspect | Plugin | Domain Pack |
|--------|--------|-------------|
| Provides | Language commands, conventions, type checking | Industry knowledge, compliance rules, suggested epics |
| Installed via | `sniper plugin install` | Config in `.sniper/config.yaml` |
| Agent mixins | Language-specific coding patterns | Domain expertise (telephony, healthcare, fintech) |
| Review checks | Code quality (no-any, error handling) | Domain compliance (TCPA, HIPAA, PCI) |

## Next Steps

- [Domain Packs](/guide/domain-packs) -- create industry-specific knowledge packs
- [Configuration](/guide/configuration) -- configure installed plugins
- [Review Gates](/guide/review-gates) -- how plugin review checks integrate with gates
