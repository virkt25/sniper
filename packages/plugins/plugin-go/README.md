# @sniper.ai/plugin-go

[![npm version](https://img.shields.io/npm/v/@sniper.ai/plugin-go)](https://www.npmjs.com/package/@sniper.ai/plugin-go)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Go language plugin for the [SNIPER](https://sniperai.dev) framework. Adds test, lint, vet, and build commands, enforces Go conventions, and injects backend knowledge into agent personas via mixins.

## Installation

```bash
sniper plugin install @sniper.ai/plugin-go
```

## Commands

| Command | Run | Description |
|---------|-----|-------------|
| `test` | `go test ./...` | Run all tests in the module |
| `lint` | `golangci-lint run` | Run golangci-lint for comprehensive linting |
| `vet` | `go vet ./...` | Run go vet for static analysis |
| `build` | `go build ./...` | Compile all packages in the module |

## Conventions

The plugin enforces the following Go conventions during reviews:

- Follow Effective Go guidelines and Go code review comments
- Always handle errors -- never assign to `_` for error returns
- Use `context.Context` as the first parameter for functions that do I/O or may be cancelled
- Write table-driven tests with `t.Run` subtests
- Keep interfaces small -- prefer 1-2 method interfaces
- Accept interfaces, return structs -- depend on behavior, not implementation

## Review Checks

| Check | Blocking | Description |
|-------|----------|-------------|
| `no-fmt-println` | Yes | Ensure `fmt.Println` is not used in production code (use structured logging) |
| `error-handling` | No | Ensure errors are not silently discarded |
| `context-first` | No | Verify `context.Context` is the first parameter where applicable |

## Agent Mixins

The plugin injects language-specific knowledge into SNIPER agents:

| Agent | Mixin |
|-------|-------|
| `backend-dev` | `mixins/go-backend.md` |

## Hooks

| Hook | Command | Purpose |
|------|---------|---------|
| `PreToolUse` | `go vet ./...` | Static analysis before tool use |
| `Stop` | `go test ./... -count=1` | Run tests on agent stop |

## Documentation

Full documentation is available at [sniperai.dev](https://sniperai.dev).

## License

MIT
