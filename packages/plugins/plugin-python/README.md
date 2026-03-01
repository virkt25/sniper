# @sniper.ai/plugin-python

[![npm version](https://img.shields.io/npm/v/@sniper.ai/plugin-python)](https://www.npmjs.com/package/@sniper.ai/plugin-python)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Python language plugin for the [SNIPER](https://sniperai.dev) framework. Adds test, lint, typecheck, and format commands, enforces Python conventions, and injects backend knowledge into agent personas via mixins.

## Installation

```bash
sniper plugin install @sniper.ai/plugin-python
```

## Commands

| Command | Run | Description |
|---------|-----|-------------|
| `test` | `pytest` | Run the test suite using pytest |
| `lint` | `ruff check .` | Lint all Python files with ruff |
| `typecheck` | `mypy .` | Run mypy for static type checking |
| `format` | `ruff format .` | Format all Python files with ruff |

## Conventions

The plugin enforces the following Python conventions during reviews:

- Follow PEP 8 style guidelines for all Python code
- Add type hints on all public functions, methods, and class attributes
- Use `pathlib.Path` over `os.path` for filesystem operations
- Use dataclasses or Pydantic models for structured data, not raw dicts
- Prefer f-strings over `str.format()` or `%` formatting
- Include `if __name__ == '__main__'` guard in executable modules

## Review Checks

| Check | Blocking | Description |
|-------|----------|-------------|
| `no-bare-except` | Yes | Ensure no bare `except:` clauses exist (use specific exception types) |
| `type-annotations` | No | Ensure public functions have type annotations |
| `no-print` | No | Prefer logging over print statements in production code |

## Agent Mixins

The plugin injects language-specific knowledge into SNIPER agents:

| Agent | Mixin |
|-------|-------|
| `backend-dev` | `mixins/python-backend.md` |

## Hooks

| Hook | Command | Purpose |
|------|---------|---------|
| `PreToolUse` | `ruff check --quiet` | Lint check before tool use |
| `Stop` | `pytest --tb=short -q` | Run tests on agent stop |

## Documentation

Full documentation is available at [sniperai.dev](https://sniperai.dev).

## License

MIT
