---
title: Headless & CI/CD
description: Run SNIPER protocols headlessly in CI/CD pipelines with sniper run
---

# Headless & CI/CD

Run SNIPER protocols in automated pipelines without human interaction. The `sniper run` CLI command executes protocols headlessly with structured output, automatic gate approval, and configurable timeouts.

## Overview

Headless mode is designed for CI/CD environments where:

- No human is available to approve gates
- Output must be structured (JSON, YAML, or plain text)
- Execution must complete within a time budget
- Exit codes signal success or failure to the pipeline

## Basic Usage

```bash
sniper run <protocol> [options]
```

### Required Arguments

| Argument | Description |
|----------|-------------|
| `protocol` | Protocol to execute: `full`, `feature`, `patch`, `ingest`, `explore`, `refactor`, `hotfix` |

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--ci` | Enable CI mode (non-interactive) | `false` |
| `--auto-approve` | Auto-approve all review gates | `false` |
| `--output <format>` | Output format: `json`, `yaml`, `text` | `text` |
| `--timeout <minutes>` | Maximum execution time | from config |

### Examples

```bash
# Run a patch protocol with auto-approved gates
sniper run patch --ci --auto-approve

# Run a feature protocol with JSON output
sniper run feature --output json --auto-approve

# Run with a 30-minute timeout
sniper run feature --timeout 30 --auto-approve
```

## Configuration

Configure headless defaults in `.sniper/config.yaml`:

```yaml
headless:
  auto_approve_gates: true
  output_format: json
  log_level: info
  timeout_minutes: 60
  fail_on_gate_failure: true
```

| Key | Description | Default |
|-----|-------------|---------|
| `auto_approve_gates` | Skip human approval at gates | `false` |
| `output_format` | Default output format | `text` |
| `log_level` | Logging verbosity | `info` |
| `timeout_minutes` | Global timeout | `60` |
| `fail_on_gate_failure` | Exit non-zero on gate failure | `true` |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Protocol completed successfully |
| `1` | Configuration error (missing config, invalid protocol) |
| `2` | Gate failure (when `fail_on_gate_failure: true`) |
| `3` | Timeout exceeded |
| `4` | Runtime error |

## Output Formats

### JSON

```bash
sniper run patch --output json --auto-approve
```

Returns a structured JSON object with protocol results, gate evaluations, artifact paths, and token usage.

### YAML

```bash
sniper run patch --output yaml --auto-approve
```

Same structure as JSON, formatted as YAML for easier reading in logs.

### Text

```bash
sniper run patch --output text --auto-approve
```

Human-readable output with status indicators and summaries.

## GitHub Actions Example

```yaml
name: SNIPER Feature Pipeline
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  sniper-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install SNIPER CLI
        run: npm install -g @sniper.ai/cli

      - name: Run SNIPER review
        run: |
          sniper run patch \
            --ci \
            --auto-approve \
            --output json \
            --timeout 15
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: sniper-review
          path: .sniper/gates/
```

## Gate Behavior in CI

When `auto_approve_gates` is enabled:

- **Flexible gates** auto-advance if no critical failures (same as interactive mode)
- **Strict gates** auto-advance if all checks pass. If any check fails and `fail_on_gate_failure` is true, the process exits with code `2`
- **Auto gates** always advance (no evaluation)

::: warning
Running strict gates with `auto_approve_gates` in production pipelines means gate failures stop the pipeline entirely. Make sure your checklists are tuned to avoid false positives.
:::

## Protocol Selection for CI

| Use Case | Protocol | Typical Timeout |
|----------|----------|-----------------|
| PR code review | `patch` | 10 min |
| Feature branch validation | `feature` | 30 min |
| Nightly full review | `full` | 60 min |
| Codebase documentation | `ingest` | 45 min |
| Refactoring analysis | `refactor` | 20 min |

## Combining with `/sniper-flow`

Headless mode runs protocols through the CLI binary (`sniper run`), separate from the interactive `/sniper-flow` slash command. Both use the same protocol definitions, agents, and gates -- the difference is the execution environment:

| Aspect | `/sniper-flow` | `sniper run` |
|--------|----------------|--------------|
| Environment | Claude Code (interactive) | Shell / CI pipeline |
| Gate approval | Human in the loop | Auto-approve or fail |
| Output | Live agent updates | Structured results |
| Resume | `--resume` flag | Not supported |

## Next Steps

- [Configuration](/guide/configuration) -- set up headless defaults
- [Review Gates](/guide/review-gates) -- understand gate modes and how they affect CI
- [Custom Protocols](/guide/custom-protocols) -- create CI-specific protocols
