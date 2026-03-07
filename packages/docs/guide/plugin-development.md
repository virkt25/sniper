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
| `symbols` | Code archaeologist (ingest protocol) | Generate ctags for Tier 2 repo map |

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

**Blocking vs non-blocking checks:**

- **Blocking** (`blocking: true`) -- if the check fails, the gate rejects advancement. The agent must fix the issue before the protocol can proceed to the next phase.
- **Non-blocking** (`blocking: false`) -- if the check fails, it appears as a warning in the gate report but does not prevent advancement. Useful for advisory checks like import ordering or stylistic preferences.

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

## Creating a Plugin Step by Step

### Step 1: Create `plugin.yaml`

Define your plugin manifest with commands, conventions, review checks, and mixins:

```yaml
name: my-language
type: language
version: 1.0.0
description: My Language support for SNIPER.

provides:
  commands:
    build: make build
    test: make test
    lint: make lint
  conventions:
    - naming
    - module-structure
  review_checks:
    - id: no_unsafe_cast
      description: No unsafe type casts
      pattern: "unsafe\\.cast"
      glob: "*.ml"
      blocking: true
  agent_mixins:
    - my-language-backend
    - my-language-frontend
  hooks:
    PostToolUse:
      - matcher: "Edit|Write"
        glob: "*.ml"
        command: "my-formatter --write $FILE_PATH"
```

### Step 2: Write Convention Files

Create a `conventions/` directory with one Markdown file per convention listed in `plugin.yaml`. Keep each file under 500 tokens -- agents read these during implementation, so bloated conventions waste context window.

`conventions/naming.md`:

```markdown
# Naming Conventions

- Functions: snake_case
- Types: PascalCase
- Modules: snake_case matching filename
- Constants: SCREAMING_SNAKE_CASE
- Private fields: prefix with underscore
```

### Step 3: Write Mixin Files

Create a `mixins/` directory with one Markdown file per mixin listed in `plugin.yaml`.

`mixins/my-language-backend.md`:

```markdown
# My Language Backend Mixin

## Additional Knowledge
- Use the standard library HTTP server, not third-party frameworks
- Database access via the official driver with connection pooling
- Error handling: use Result types, never panic in library code
- Serialization: derive macros for JSON, explicit for binary formats

## Testing Patterns
- Table-driven tests for all public functions
- Integration tests in a separate `tests/` directory
- Use test fixtures, not inline data
```

### Step 4: Package and Publish

Create a `package.json` that includes all plugin files:

```json
{
  "name": "@sniper.ai/plugin-my-language",
  "version": "1.0.0",
  "description": "My Language support for SNIPER",
  "files": [
    "plugin.yaml",
    "conventions/",
    "mixins/",
    "review_checks/"
  ],
  "keywords": ["sniper", "plugin", "my-language"]
}
```

Publish to npm:

```bash
npm publish --access public
```

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

**Convention example -- `esm-modules.md`:**

```markdown
# ESM Module Conventions

- Use `import`/`export`, never `require`/`module.exports`
- File extensions in imports: always include `.js` (even for `.ts` source files) when targeting Node
- Barrel exports (`index.ts`) only at package boundaries, not within features
- Prefer named exports over default exports
- Type-only imports: use `import type { Foo }` for types not used at runtime
```

**Mixin example -- `typescript-backend.md`:**

```markdown
# TypeScript Backend Mixin

## Additional Knowledge
- Use zod for runtime validation of all external input (API payloads, query params, env vars)
- Prefer `unknown` over `any` — narrow with type guards
- Use branded types for IDs (`type UserId = string & { __brand: 'UserId' }`)
- Error handling: custom error classes extending a base `AppError`, never throw raw strings
- Database queries: use parameterized queries via the ORM, never string interpolation
- Async: always handle promise rejections, use `Promise.allSettled` for parallel independent operations
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

### What Install Does

1. Runs `pnpm add @sniper.ai/plugin-<name>` to fetch the package
2. Copies plugin content to `.sniper/plugins/<name>/`
3. Merges plugin hooks into `.claude/settings.json`
4. Registers plugin mixins in the available mixin pool
5. Updates `config.yaml` with plugin-provided commands

### What Remove Does

1. Removes hooks from `.claude/settings.json`
2. Removes plugin content from `.sniper/plugins/<name>/`
3. Removes mixins from agents that used them (re-scaffolds affected agents)
4. Runs `pnpm remove @sniper.ai/plugin-<name>`

### Managing Plugins

```bash
sniper plugin list                              # List installed plugins
sniper plugin remove typescript                 # Remove a plugin
```

## Creating a Domain Pack

Domain packs are similar to plugins but provide industry-specific knowledge rather than language tooling. See the [Domain Packs](/guide/domain-packs) guide for details on creating packs.

Domain packs use the same `plugin.yaml` interface with `type: domain`. They provide domain knowledge rather than language tooling:

```yaml
name: sales-dialer
type: domain
version: 1.0.0
description: Sales dialer domain knowledge -- telephony, CRM, OpenAI Realtime API.

provides:
  conventions:
    - telephony-patterns
    - crm-integration
  agent_mixins:
    - telephony
    - crm-specialist
  review_checks:
    - id: no_hardcoded_phones
      description: "No hardcoded phone numbers"
      pattern: "\\+?1?\\d{10,11}"
      glob: "src/**/*.{ts,tsx}"
      blocking: true
```

Domain packs typically do not provide `commands` or `hooks` (those come from language plugins), but they can if the domain requires specific tooling.

Install identically:

```bash
sniper plugin install pack-sales-dialer
```

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
