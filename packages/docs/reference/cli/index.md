---
title: CLI Commands
---

# CLI Commands

The `sniper` CLI binary provides project scaffolding, plugin management, protocol operations, and CI/CD support.

## Installation

```bash
npm install -g @sniper.ai/cli
```

## Commands

| Command | Description |
|---------|-------------|
| `sniper init` | Scaffold `.sniper/` directory and configure project |
| `sniper status` | Show lifecycle status and protocol progress |
| `sniper migrate` | Migrate v2 configuration to v3 format |
| `sniper plugin` | Manage language plugins (install, remove, list) |
| `sniper protocol` | Manage protocols (create, list, validate) |
| `sniper run` | Run a protocol headlessly for CI/CD |
| `sniper workspace` | Multi-repo workspace management |
| `sniper marketplace` | Search the SNIPER marketplace for packages |
| `sniper revert` | Revert a failed phase using logical revert plan |
| `sniper dashboard` | Project dashboard |
| `sniper signal` | Signal management |
| `sniper knowledge` | Knowledge base management |
| `sniper sphere` | Sphere management |

## Relationship to Slash Commands

The `sniper` CLI binary runs in your terminal. Slash commands (`/sniper-flow`, `/sniper-init`, etc.) run inside Claude Code. They serve different purposes:

| Aspect | CLI (`sniper`) | Slash Commands (`/sniper-*`) |
|--------|---------------|------------------------------|
| Environment | Terminal / CI pipeline | Claude Code session |
| Use case | Scaffolding, management, CI/CD | Protocol execution, review, status |
| Interactivity | Interactive prompts or headless | Agent-driven with human oversight |

Browse individual CLI command reference pages in the sidebar.
