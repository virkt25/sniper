# SNIPER Deployment Plan

## Current State

SNIPER is a collection of YAML configs, Markdown personas/templates/checklists, and Claude Code skills that live inside a single repo. To use it in a new project, you'd manually copy `.sniper/`, `CLAUDE.md`, and `.claude/settings.json`. Domain packs are subdirectories under `.sniper/domain-packs/`. There's no installation, versioning, or update mechanism.

## Goal

Ship SNIPER as a standalone, installable tool where:
- The **core framework** (personas, teams, templates, checklists, workflows) is a single distributable
- Each **domain pack** is a separate, independently versioned module
- Users can scaffold a new SNIPER-enabled project in seconds
- Users can add/remove domain packs without touching the core

---

## Decision: Do We Need a CLI?

**Yes.** Here's why:

| Approach | Pros | Cons |
|----------|------|------|
| **npm package (library only)** | Simple publish | No UX — user must write code to scaffold files |
| **GitHub template repo** | Zero tooling | No versioning, no domain pack management, no updates |
| **npm + CLI** | Great UX, composable, versionable | More code to write |
| **Claude Code extension only** | Native integration | Locks out non-Claude-Code users, no standalone pack management |

The CLI is the right call because SNIPER's core operation is **file scaffolding + module composition** — exactly what CLIs excel at. The actual "runtime" is Claude Code itself; the CLI just sets up the workspace.

---

## Architecture

```
@sniper.ai/cli        →  CLI binary (npx sniper init, sniper add-pack, etc.)
@sniper.ai/core       →  Framework files (personas, teams, templates, checklists, workflows)
@sniper.ai/pack-*     →  Domain packs (e.g., @sniper.ai/pack-sales-dialer)
```

### Package Structure

```
sniper/
├── packages/
│   ├── cli/                          # @sniper.ai/cli
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts              # Entry point (bin)
│   │       ├── commands/
│   │       │   ├── init.ts           # sniper init
│   │       │   ├── add-pack.ts       # sniper add-pack <name>
│   │       │   ├── remove-pack.ts    # sniper remove-pack <name>
│   │       │   ├── list-packs.ts     # sniper list-packs
│   │       │   ├── update.ts         # sniper update
│   │       │   └── status.ts         # sniper status
│   │       ├── scaffolder.ts         # File generation from core templates
│   │       ├── pack-manager.ts       # Install/remove domain packs
│   │       └── config.ts             # Read/write .sniper/config.yaml
│   │
│   ├── core/                         # @sniper.ai/core
│   │   ├── package.json
│   │   └── framework/               # All framework files, shipped as-is
│   │       ├── personas/
│   │       │   ├── cognitive/        # 6 cognitive personas
│   │       │   ├── process/          # 7 process personas
│   │       │   └── technical/        # 7 technical personas
│   │       ├── teams/                # 4 team definitions
│   │       ├── templates/            # 10 artifact templates
│   │       ├── checklists/           # 5 quality gates
│   │       ├── workflows/            # 4 execution patterns
│   │       ├── spawn-prompts/        # Spawn prompt template
│   │       ├── claude-md.template    # CLAUDE.md template
│   │       └── settings.template.json # .claude/settings.json template
│   │
│   └── pack-sales-dialer/           # @sniper.ai/pack-sales-dialer
│       ├── package.json
│       └── pack/
│           ├── pack.yaml            # Pack metadata, team overrides
│           └── context/             # Domain context files
│               ├── ai-pipeline.md
│               ├── telephony.md
│               ├── crm-integration.md
│               ├── compliance.md
│               ├── sales-workflows.md
│               └── analytics.md
│
├── package.json                      # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

### Monorepo Tooling

- **pnpm workspaces** — already in the stack, lightweight, great for monorepos
- **tsup** — zero-config bundler for the CLI (fast, produces CJS+ESM)
- **changesets** — independent versioning per package

---

## CLI Commands

### `npx @sniper.ai/cli init`

Interactive project initialization:

```
$ npx @sniper.ai/cli init

? Project name: my-saas-app
? Project type: (saas / api / mobile / cli / library)
? Stack — Language: TypeScript
? Stack — Frontend: React
? Stack — Backend: Node + Express
? Stack — Database: PostgreSQL
? Stack — Infra: AWS
? Max concurrent teammates: 5
? Add a domain pack? (y/n)

✓ Created .sniper/config.yaml
✓ Copied personas (20 files)
✓ Copied teams (4 files)
✓ Copied templates (10 files)
✓ Copied checklists (5 files)
✓ Copied workflows (4 files)
✓ Created CLAUDE.md
✓ Created .claude/settings.json
✓ Created docs/ directory

SNIPER initialized. Run `sniper add-pack <name>` to add domain packs.
```

**What it does:**
1. Installs `@sniper.ai/core` as a devDependency
2. Copies framework files from `@sniper.ai/core` into `.sniper/`
3. Generates `config.yaml` from user answers
4. Generates `CLAUDE.md` and `.claude/settings.json`
5. Creates empty `docs/` directory structure

### `sniper add-pack <name>`

```
$ sniper add-pack sales-dialer

✓ Installed @sniper.ai/pack-sales-dialer@1.2.0
✓ Copied pack to .sniper/domain-packs/sales-dialer/
✓ Added domain persona layer for sales-dialer
✓ Updated config.yaml with pack reference

Pack "sales-dialer" added. 6 context files available.
```

**What it does:**
1. `pnpm add -D @sniper.ai/pack-sales-dialer`
2. Copies pack files into `.sniper/domain-packs/<name>/`
3. If the pack includes domain personas (`.sniper/personas/domain/`), copies those too
4. Adds pack reference to `config.yaml`

### `sniper remove-pack <name>`

Removes pack files and devDependency.

### `sniper list-packs`

```
$ sniper list-packs

Available packs:
  @sniper.ai/pack-sales-dialer    v1.2.0   Sales dialer SaaS domain knowledge
  @sniper.ai/pack-fintech         v0.3.0   Fintech/payments domain knowledge
  @sniper.ai/pack-healthcare      v0.1.0   Healthcare/HIPAA domain knowledge

Installed:
  sales-dialer  v1.2.0
```

Queries the npm registry for `@sniper.ai/pack-*` packages.

### `sniper update`

```
$ sniper update

Checking for updates...
  @sniper.ai/core: 1.0.0 → 1.1.0 (minor)
  @sniper.ai/pack-sales-dialer: 1.2.0 → 1.2.1 (patch)

? Update all? (y/n)

✓ Updated core framework files
✓ Updated sales-dialer pack
```

**What it does:**
1. Updates npm packages
2. Re-copies framework files from updated `@sniper.ai/core` into `.sniper/`
3. Re-copies pack files from updated packs
4. Preserves user customizations in `config.yaml` (merge strategy, not overwrite)

### `sniper status`

```
$ sniper status

SNIPER v1.1.0
Phase: plan (started 2h ago)
Sprint: —

Artifacts:
  ✓ brief.md        approved
  ✓ risks.md         approved
  ✓ personas.md      approved
  ◐ prd.md           draft
  ○ architecture.md  —
  ○ ux-spec.md       —

Packs: sales-dialer@1.2.0
```

Reads `.sniper/config.yaml` lifecycle state and renders it.

---

## Domain Pack Contract

Every domain pack must follow this structure:

```
@sniper.ai/pack-<name>/
├── package.json           # name: @sniper.ai/pack-<name>, sniper.type: "domain-pack"
└── pack/
    ├── pack.yaml          # Required — pack metadata
    │   ├── name           # Pack display name
    │   ├── version        # Semver
    │   ├── description    # One-liner
    │   ├── contexts[]     # List of context file names
    │   ├── default_context # Which context to use when none specified
    │   └── team_overrides # Optional extra teammates per phase
    └── context/           # Domain knowledge files (Markdown)
        ├── *.md           # One file per context area
        └── ...
```

**package.json must include:**
```json
{
  "name": "@sniper.ai/pack-sales-dialer",
  "version": "1.0.0",
  "sniper": {
    "type": "domain-pack",
    "packDir": "pack"
  }
}
```

The CLI reads the `sniper.type` field to validate that a package is a real domain pack.

---

## Claude Code Skills Distribution

The `/sniper-*` slash commands (skills) currently live wherever Claude Code stores custom skills. These need to ship with `@sniper.ai/core` and be installed into the project's `.claude/` directory.

**Approach:** The `sniper init` command copies skill definitions into the project so they're available when Claude Code loads the workspace. Skills reference `.sniper/` files using relative paths, so they work regardless of where the project lives.

---

## Implementation Plan

### Phase 1: Monorepo Setup
- [ ] Restructure repo as pnpm monorepo with `packages/` directory
- [ ] Move framework files into `packages/core/framework/`
- [ ] Move sales-dialer pack into `packages/pack-sales-dialer/pack/`
- [ ] Add root `pnpm-workspace.yaml` and `tsconfig.base.json`
- [ ] Add `package.json` for each package with correct metadata

### Phase 2: CLI Foundation
- [ ] Scaffold `packages/cli/` with TypeScript + tsup
- [ ] Add CLI framework (recommend **citty** — lightweight, zero-dep, by UnJS)
- [ ] Implement `init` command — interactive prompts + file scaffolding
- [ ] Implement `status` command — read config.yaml and render state
- [ ] Wire up `bin` field in package.json, test with `npx`

### Phase 3: Pack Management
- [ ] Implement `add-pack` command — npm install + copy files
- [ ] Implement `remove-pack` command — remove files + npm uninstall
- [ ] Implement `list-packs` command — query registry for `@sniper.ai/pack-*`
- [ ] Implement `update` command — update packages + re-copy files with merge

### Phase 4: Skills Integration
- [ ] Move Claude Code skill definitions into `@sniper.ai/core`
- [ ] Have `init` command copy skills into `.claude/commands/` (or equivalent)
- [ ] Ensure skills reference `.sniper/` paths correctly

### Phase 5: Publish & Documentation
- [ ] Set up changesets for independent versioning
- [ ] Configure npm publishing (scope: `@sniper.ai`)
- [ ] Write README for each package
- [ ] Write "Create a Domain Pack" guide
- [ ] Publish v0.1.0 of all three packages

### Phase 6: Additional Domain Packs
- [ ] Package template: `sniper create-pack <name>` scaffolds a new pack repo
- [ ] Community pack registry / discovery (future — start with npm search)

---

## Key Design Decisions

### 1. Copy files, don't symlink
When the CLI installs core or packs, it **copies** files into the project's `.sniper/` directory rather than symlinking to `node_modules`. This means:
- Framework files are visible and inspectable in the project
- Users can customize personas/templates for their project
- Claude Code can read them without resolving symlinks
- Works correctly with git (files are committed to the project)

Trade-off: Updates require re-copying. The `sniper update` command handles this with a merge strategy that preserves user edits to `config.yaml` while replacing framework files.

### 2. Monorepo vs separate repos
**Monorepo** is the right choice for now:
- Core + CLI are tightly coupled (CLI templates match core structure)
- Easier to develop and test together
- Changesets handles independent versioning
- Domain packs can live in the monorepo initially, move to separate repos later if community contributes

### 3. CLI framework: citty over commander/yargs
- Zero dependencies (SNIPER should be fast to install)
- TypeScript-first
- Built by the UnJS ecosystem (proven, maintained)
- Simple API for the ~6 commands we need

### 4. No runtime dependency
The CLI is a dev tool only. After `sniper init`, the project has zero runtime dependency on SNIPER. All files are copied into the project. The `@sniper.ai/core` and `@sniper.ai/pack-*` packages are devDependencies used only for the copy-on-install pattern.

### 5. npm scope: `@sniper.ai`
All packages live under the `@sniper.ai` scope (registered via sniper.ai):
- `@sniper.ai/cli`
- `@sniper.ai/core`
- `@sniper.ai/pack-sales-dialer`
- `@sniper.ai/pack-fintech` (future)

Official packs use `@sniper.ai/pack-*`. Community packs can use any scope — the CLI validates packs by the `sniper.type` field in `package.json`, not by scope.

---

## Tech Stack for the CLI

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript | Matches target stack, type safety |
| Bundler | tsup | Zero-config, fast, CJS+ESM output |
| CLI framework | citty | Zero-dep, TypeScript-first, UnJS |
| Prompts | @clack/prompts | Beautiful terminal UI, spinner, select |
| YAML parsing | yaml (npm) | Full YAML 1.2, already in ecosystem |
| File copy | fs-extra | Recursive copy, merge, ensureDir |
| Versioning | changesets | Independent versioning per package |
| Monorepo | pnpm workspaces | Already using pnpm, native workspace support |

---

## Resolved Decisions

1. **npm org name** — Registered `@sniper.ai` on npm (brand: sniper.ai).
2. **Community packs** — Official packs use `@sniper.ai/pack-*`. Community/third-party packs can use any scope (e.g., `@myorg/sniper-pack-fintech`) — the CLI identifies packs by the `sniper.type: "domain-pack"` field in `package.json`, not by scope. `sniper add-pack` accepts any valid npm package name.
3. **Config migration** — Schema versioning + migration scripts. Each `config.yaml` will carry a `schema_version` field. The CLI's `update` command runs migration scripts sequentially (v1→v2→v3) to transform old configs to the current schema.
4. **Skill distribution** — Verify Claude Code's current skill/command storage format and ensure forward compatibility. Skills ship inside `@sniper.ai/core` and get copied into `.claude/commands/` (or equivalent) during `sniper init`.
5. **Private packs** — Yes. The CLI will support installing packs from private npm registries (via `.npmrc` auth) and git repos (`sniper add-pack git+ssh://...`) for enterprise use.
