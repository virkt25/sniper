# SNIPER v3 Plugin Development

Plugins extend SNIPER with language-specific intelligence, domain knowledge, and custom behavior. The core framework is language-agnostic; plugins make it concrete.

---

## Plugin Types

| Type | Purpose | Examples |
|---|---|---|
| `language` | Language-specific commands, conventions, review checks, hooks | `@sniper.ai/plugin-typescript`, `@sniper.ai/plugin-python` |
| `domain` | Domain knowledge, specialized mixins, review checklists | `@sniper.ai/pack-sales-dialer`, `@sniper.ai/pack-fintech` |

Both types use the same `plugin.yaml` interface. The `type` field distinguishes them.

## Plugin Interface

Every plugin has a `plugin.yaml` at its root:

```yaml
name: typescript
type: language
version: 1.0.0
description: TypeScript and JavaScript support for SNIPER v3.

provides:
  commands:
    build: pnpm build
    test: pnpm test
    lint: pnpm lint
    typecheck: pnpm tsc --noEmit
    format: pnpm prettier --write .
    symbols: ctags -R --output-format=json --languages=typescript src/

  conventions:
    - esm-modules
    - strict-typescript
    - zod-validation

  review_checks:
    - id: no_any
      description: No use of `any` type
      pattern: ": any[^A-Za-z]"
      glob: "*.{ts,tsx}"
      blocking: true
    - id: no_bare_catch
      description: No bare catch blocks
      pattern: "catch\\s*\\{"
      glob: "*.{ts,tsx}"
      blocking: true
    - id: import_order
      description: Imports are organized
      command: "pnpm lint --rule import/order"
      blocking: false

  agent_mixins:
    - typescript-backend
    - typescript-frontend

  hooks:
    PostToolUse:
      - matcher: "Edit|Write"
        glob: "*.{ts,tsx}"
        command: "npx prettier --write $FILE_PATH"
        description: Auto-format TypeScript files on save
```

### Field Reference

#### `provides.commands`

Shell commands the framework uses during execution. These replace `{commands.*}` placeholders in gate checklists and agent prompts.

| Command | Used By | Required |
|---|---|---|
| `build` | Implementation verification | No |
| `test` | Gate reviewer, self-review | Yes |
| `lint` | Gate reviewer, self-review | Yes |
| `typecheck` | Gate reviewer | No |
| `format` | Post-edit hooks | No |
| `symbols` | Code archaeologist (ingest protocol, Tier 2 repo map) | No |

#### `provides.conventions`

List of convention names. Each name maps to a Markdown file in the plugin's `conventions/` directory. These files are injected into agent context via the `code-conventions` skill.

```
plugin-typescript/
  conventions/
    esm-modules.md
    strict-typescript.md
    zod-validation.md
```

Convention files should be concise (under 500 tokens). They describe patterns to follow, not tutorials.

#### `provides.review_checks`

Additional checks the gate-reviewer runs during review phases. Each check is either:

- **Pattern check**: Grep the diff for a regex pattern. Match = failure.
- **Command check**: Run a shell command. Non-zero exit = failure.

The `blocking` field controls whether a failure blocks the protocol or is a warning.

#### `provides.agent_mixins`

Mixin files the plugin adds to the available mixin pool. Stored in the plugin's `mixins/` directory:

```
plugin-typescript/
  mixins/
    typescript-backend.md
    typescript-frontend.md
```

These can be applied to agents in `.sniper/config.yaml`:

```yaml
agents:
  backend-dev:
    base: backend-dev
    mixins:
      - security-first          # from core
      - typescript-backend      # from plugin
```

#### `provides.hooks`

Claude Code hooks the plugin registers. Merged into `.claude/settings.json` at install time.

Hook types:
- `PreToolUse`: Runs before a tool call. Exit 2 to block.
- `PostToolUse`: Runs after a tool call. For formatting, validation, cost tracking.

## Creating a Language Plugin

### Directory Structure

```
plugin-my-language/
  plugin.yaml              # Plugin manifest
  package.json             # npm package metadata
  conventions/             # Convention files (Markdown)
    naming.md
    module-structure.md
  mixins/                  # Agent mixin files (Markdown)
    my-language-backend.md
    my-language-frontend.md
  review_checks/           # (Optional) Complex check scripts
    check-naming.sh
```

### Step 1: Create `plugin.yaml`

```yaml
name: my-language
type: language
version: 1.0.0
description: My Language support for SNIPER v3.

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

`conventions/naming.md`:

```markdown
# Naming Conventions

- Functions: snake_case
- Types: PascalCase
- Modules: snake_case matching filename
- Constants: SCREAMING_SNAKE_CASE
- Private fields: prefix with underscore
```

Keep conventions under 500 tokens. Agents read these during implementation; bloated conventions waste context window.

### Step 3: Write Mixin Files

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

`package.json`:

```json
{
  "name": "@sniper.ai/plugin-my-language",
  "version": "1.0.0",
  "description": "My Language support for SNIPER v3",
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

## Installing and Removing Plugins

```bash
# Install from npm
sniper plugin install my-language

# List installed plugins
sniper plugin list

# Remove
sniper plugin remove my-language
```

### What Install Does

1. Runs `pnpm add @sniper.ai/plugin-<name>`
2. Copies plugin content to `.sniper/plugins/<name>/`
3. Merges plugin hooks into `.claude/settings.json`
4. Registers plugin mixins in the available mixin pool
5. Updates `config.yaml` with plugin-provided commands

### What Remove Does

1. Removes hooks from `.claude/settings.json`
2. Removes plugin content from `.sniper/plugins/<name>/`
3. Removes mixins from agents that used them (re-scaffolds affected agents)
4. Runs `pnpm remove @sniper.ai/plugin-<name>`

## Example: The TypeScript Plugin

The `@sniper.ai/plugin-typescript` plugin ships with SNIPER and serves as the reference implementation.

### plugin.yaml

```yaml
name: typescript
type: language
version: 1.0.0

provides:
  commands:
    build: pnpm build
    test: pnpm test
    lint: pnpm lint
    typecheck: pnpm tsc --noEmit
    format: pnpm prettier --write .
    symbols: ctags -R --output-format=json --languages=typescript src/

  conventions:
    - esm-modules
    - strict-typescript
    - zod-validation

  review_checks:
    - id: no_any
      description: "Disallow `any` type usage"
      pattern: ":\\s*any[^A-Za-z]"
      glob: "*.{ts,tsx}"
      blocking: true
    - id: no_bare_catch
      description: "Catch blocks must type the error"
      pattern: "catch\\s*\\{"
      glob: "*.{ts,tsx}"
      blocking: true
    - id: no_console_log
      description: "No console.log in production code"
      pattern: "console\\.log"
      glob: "src/**/*.{ts,tsx}"
      blocking: false

  agent_mixins:
    - typescript-backend
    - typescript-frontend

  hooks:
    PostToolUse:
      - matcher: "Edit|Write"
        glob: "*.{ts,tsx,js,jsx}"
        command: "npx prettier --write $FILE_PATH"
```

### Convention: `esm-modules.md`

```markdown
# ESM Module Conventions

- Use `import`/`export`, never `require`/`module.exports`
- File extensions in imports: always include `.js` (even for `.ts` source files) when targeting Node
- Barrel exports (`index.ts`) only at package boundaries, not within features
- Prefer named exports over default exports
- Type-only imports: use `import type { Foo }` for types not used at runtime
```

### Mixin: `typescript-backend.md`

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

## Creating a Domain Pack

Domain packs use the same plugin interface with `type: domain`. They provide domain knowledge rather than language tooling.

```yaml
name: sales-dialer
type: domain
version: 1.0.0
description: Sales dialer domain knowledge — telephony, CRM, OpenAI Realtime API.

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
