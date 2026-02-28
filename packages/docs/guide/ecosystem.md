---
title: Ecosystem
description: Language plugins, domain packs, and the SNIPER marketplace
---

# Ecosystem

SNIPER ships a lean core and extends through **plugins** and **domain packs**. This page covers the available extensions, how they work together, and the marketplace for discovering community packages.

## Language Plugins

Language plugins add tooling commands, coding conventions, review checks, and agent knowledge mixins specific to a programming language. Install with:

```bash
sniper plugin install typescript
```

### Official Plugins

| Plugin | Package | Commands | Review Checks |
|--------|---------|----------|---------------|
| **TypeScript** | `@sniper.ai/plugin-typescript` | `build`, `test`, `lint`, `typecheck` | `no-any`, `no-ts-ignore`, `strict-null-checks` |
| **Python** | `@sniper.ai/plugin-python` | `test`, `lint`, `typecheck`, `format` | `no-bare-except`, `type-annotations`, `no-print` |
| **Go** | `@sniper.ai/plugin-go` | `test`, `lint`, `vet`, `build` | `no-fmt-println`, `error-handling`, `context-first` |

### What a Plugin Provides

Every plugin is defined by a `plugin.yaml` manifest with five sections:

| Section | Purpose |
|---------|---------|
| `commands` | Shell commands agents can run (e.g., `npx vitest run`) |
| `conventions` | Coding standards injected into agent context |
| `review_checks` | Automated checks the gate reviewer runs during review |
| `agent_mixins` | Markdown files appended to agent personas for domain knowledge |
| `hooks` | Claude Code hooks that run at `PreToolUse` and `Stop` events |

For example, when the TypeScript plugin is installed:

- Agents know to use `strict: true` in `tsconfig.json`
- The code reviewer runs `no-any` and `no-ts-ignore` checks
- A `PreToolUse` hook runs `tsc --noEmit` before file writes to catch type errors early
- Backend and frontend agent personas get TypeScript-specific knowledge injected

### Plugin Hooks

Plugins can contribute hooks that merge with the core hook definitions:

```yaml
hooks:
  PreToolUse:
    - "npx tsc --noEmit --pretty 2>&1 | head -20"
  Stop:
    - "npx tsc --noEmit"
```

These run alongside SNIPER's built-in self-healing CI hooks. See the [Hooks reference](/reference/hooks/) for details on hook events.

## Domain Packs

Domain packs provide **business domain knowledge** rather than language tooling. They inject specialized conventions, compliance checks, and expert knowledge into agent personas.

### Official Packs

| Pack | Package | Domain |
|------|---------|--------|
| **Sales Dialer** | `@sniper.ai/pack-sales-dialer` | Telephony, TCPA compliance, CRM integration, AI pipelines |

### What a Domain Pack Provides

Domain packs use the same `plugin.yaml` format as language plugins. The sales dialer pack, for example:

- **Conventions** -- E.164 phone number format, dual-channel recording, TCPA calling hours, DNC list checks, recording consent
- **Review checks** -- `tcpa-compliance`, `dnc-check`, `recording-consent`, `pci-recording-pause`
- **Agent mixins** -- Telephony specialist knowledge injected into backend-dev and architect personas

Domain packs typically don't define `commands` because they focus on knowledge and compliance rather than tooling.

### Combining Plugins and Packs

A project can install multiple plugins and packs simultaneously. They compose cleanly:

```bash
sniper plugin install typescript
sniper plugin install sales-dialer
```

After installation, a TypeScript sales dialer project would have:

- TypeScript build/test/lint commands
- TypeScript coding conventions + telephony conventions
- TypeScript review checks + TCPA compliance checks
- Backend-dev persona with both TypeScript and telephony knowledge

## The Marketplace

The SNIPER marketplace is a registry of community-contributed plugins and domain packs.

### Browsing

```bash
sniper marketplace search "react"
sniper marketplace search --category "domain-pack"
```

### Installing from Marketplace

```bash
sniper marketplace install @community/plugin-rust
```

Marketplace packages follow the same `plugin.yaml` format. The CLI validates the manifest before installation.

## Creating Extensions

See the [Plugin Development](/guide/plugin-development) guide for a complete walkthrough on creating your own plugins and domain packs.

The key steps:

1. Create a `plugin.yaml` manifest
2. Add commands, conventions, review checks, and/or agent mixins
3. Optionally add hooks for build-time validation
4. Publish to the marketplace with `sniper marketplace publish`

## Next Steps

- [Plugin Development](/guide/plugin-development) -- build your own plugin or domain pack
- [Configuration](/guide/configuration) -- configure installed plugins in `.sniper/config.yaml`
- [Custom Protocols](/guide/custom-protocols) -- create protocols that leverage plugin commands
