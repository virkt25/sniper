# @sniper.ai/plugin-typescript

[![npm version](https://img.shields.io/npm/v/@sniper.ai/plugin-typescript)](https://www.npmjs.com/package/@sniper.ai/plugin-typescript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

TypeScript language plugin for the [SNIPER](https://sniperai.dev) framework. Adds build, test, lint, and typecheck commands, enforces strict TypeScript conventions, and injects backend/frontend knowledge into agent personas via mixins.

## Installation

```bash
sniper plugin install @sniper.ai/plugin-typescript
```

## Commands

| Command | Run | Description |
|---------|-----|-------------|
| `build` | `npx tsup \|\| npx tsc` | Compile TypeScript sources (tsup preferred, tsc fallback) |
| `test` | `npx vitest run \|\| npx jest` | Run the test suite (vitest preferred, jest fallback) |
| `lint` | `npx eslint . --ext .ts,.tsx` | Lint all TypeScript and TSX files with ESLint |
| `typecheck` | `npx tsc --noEmit` | Run the TypeScript compiler in type-check-only mode |

## Conventions

The plugin enforces the following TypeScript conventions during reviews:

- Enable strict mode in `tsconfig.json` (`strict: true`)
- Use ESM modules exclusively (`type: module` in package.json, ESNext module target)
- Add explicit return types on all public API functions and methods
- Barrel exports (`index.ts` re-exports) are discouraged; prefer direct imports
- Prefer `unknown` over `any`; narrow types with type guards
- Use `readonly` modifiers on properties and parameters that should not be mutated

## Review Checks

| Check | Blocking | Description |
|-------|----------|-------------|
| `no-any` | No | Ensure no untyped `any` annotations exist in source files |
| `no-ts-ignore` | Yes | Ensure `@ts-ignore` is not used to suppress compiler errors |
| `strict-null-checks` | No | Verify that `strictNullChecks` is enabled in tsconfig.json |

## Agent Mixins

The plugin injects language-specific knowledge into SNIPER agents:

| Agent | Mixin |
|-------|-------|
| `backend-dev` | `mixins/typescript-backend.md` |
| `frontend-dev` | `mixins/typescript-frontend.md` |

## Hooks

| Hook | Command | Purpose |
|------|---------|---------|
| `PreToolUse` | `npx tsc --noEmit --pretty` | Type-check before tool use |
| `Stop` | `npx tsc --noEmit` | Final type-check on agent stop |

## Documentation

Full documentation is available at [sniperai.dev](https://sniperai.dev).

## License

MIT
