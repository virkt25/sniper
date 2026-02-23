# SNIPER Documentation Site — Implementation Plan

## Context

SNIPER has 137 framework files (812KB) of rich content — personas, teams, commands, checklists, templates, workflows — but zero user-facing documentation. The `docs/` directory is empty. Users have no way to discover or learn the framework without reading raw source files. We need a browsable documentation website and comprehensive user guides.

## Approach

Build a VitePress docs site at `packages/docs` with:
1. Auto-generation scripts that transform framework YAML/MD into reference pages
2. Hand-written conceptual guides and tutorials
3. GitHub Pages deployment triggered on framework or docs changes

---

## Phase 1: VitePress Scaffolding

Create `packages/docs` as a new workspace package:

**Files to create:**
- `packages/docs/package.json` — private package with vitepress, yaml, gray-matter, glob deps
- `packages/docs/.vitepress/config.mts` — site config with sidebar, nav, local search, edit links
- `packages/docs/index.md` — hero landing page with feature highlights
- `packages/docs/.vitepress/theme/index.ts` — custom theme extending default

**Root integration:**
- Add `docs:dev`, `docs:build`, `docs:preview` scripts to root `package.json`
- Add `packages/docs/generated/`, `.vitepress/dist/`, `.vitepress/cache/` to `.gitignore`

**Site structure:**
```
/                     → Landing page (hero + features)
/guide/*              → Hand-written conceptual guides
/reference/commands/* → Auto-generated command reference
/reference/personas/* → Auto-generated persona gallery
/reference/teams/*    → Auto-generated team compositions
/reference/checklists/* → Auto-generated checklists
/reference/templates/* → Auto-generated template catalog
/reference/workflows/* → Auto-generated workflows
/reference/config-schema → Config reference
```

---

## Phase 2: Auto-Generation Scripts

Scripts in `packages/docs/scripts/` that read `packages/core/framework/` and write to `packages/docs/generated/` (gitignored). Run before every dev/build via `pnpm generate`.

**Files to create:**
- `scripts/generate.mjs` — orchestrator that resolves framework path and runs generators
- `scripts/generators/commands.mjs` — transforms 18 command MD files into reference pages
- `scripts/generators/personas.mjs` — groups 42 persona files into 3 layer pages (process, technical, cognitive)
- `scripts/generators/teams.mjs` — parses 17 team YAML files into composition pages with persona cross-links
- `scripts/generators/checklists.mjs` — transforms 15 checklist files with gate mode badges
- `scripts/generators/templates.mjs` — catalogs 38 template files grouped by category
- `scripts/generators/workflows.mjs` — transforms 5 workflow files with command cross-links
- `scripts/generators/sidebar.mjs` — collects all generated pages into `sidebar-data.json` for dynamic sidebar

**Key design decisions:**
- Framework path resolved via `../../core/framework` (no package resolution needed)
- Generated files use VitePress `rewrites` to appear under `/reference/` URLs
- `sidebar-data.json` is imported by VitePress config for dynamic navigation
- Adding a new framework file automatically creates a new docs page on next build

---

## Phase 3: Guide Content (Hand-Written)

13 guide pages in `packages/docs/guide/`:

| Page | Content |
|------|---------|
| `what-is-sniper.md` | Overview, philosophy, architecture diagram |
| `getting-started.md` | Install CLI, `sniper init`, first lifecycle walkthrough |
| `core-concepts.md` | Phases, personas, teams, spawn prompts, artifacts, review gates |
| `configuration.md` | Section-by-section config.yaml walkthrough |
| `full-lifecycle.md` | Detailed discover→plan→solve→sprint walkthrough |
| `review-gates.md` | STRICT/FLEXIBLE/AUTO modes, checklist usage |
| `personas.md` | Layered composition, customization, `/sniper-compose` |
| `teams.md` | Team YAML structure, coordination, file ownership |
| `domain-packs.md` | Pack authoring guide using sales-dialer as example |
| `workspace-mode.md` | Multi-repo orchestration |
| `memory.md` | Memory system, retros, auto-codification |
| `troubleshooting.md` | Common issues and solutions |
| `glossary.md` | All SNIPER-specific terminology |

Reference index pages (6 files in `reference/*/index.md`) provide overviews for each reference section.

---

## Phase 4: Custom Vue Components

- `PersonaCard.vue` — card component for persona gallery layout
- `TeamDiagram.vue` — simple box diagram for team composition visualization

Lightweight, no external deps. Use VitePress built-in Vue support.

---

## Phase 5: Deployment

**File to create:** `.github/workflows/docs.yml`

GitHub Actions workflow:
- Triggers on push to `main` when `packages/docs/**` or `packages/core/framework/**` change
- Installs pnpm, runs `pnpm --filter @sniper.ai/docs build`
- Deploys to GitHub Pages at `virkt25.github.io/sniper`

---

## Implementation Order

| Step | What | Parallel? |
|------|------|-----------|
| 1 | Package scaffolding + VitePress config + landing page | — |
| 2 | Generate orchestrator + commands generator (most useful reference) | — |
| 3 | Remaining generators (personas, teams, checklists, templates, workflows, sidebar) | Yes, with step 4 |
| 4 | Guide pages: getting-started, core-concepts, configuration | Yes, with step 3 |
| 5 | Dynamic sidebar integration with sidebar-data.json | After 3 |
| 6 | Remaining guide pages | After 4 |
| 7 | Vue components (polish) | After 3 |
| 8 | GitHub Actions deployment | After 5 |
| 9 | Root integration (scripts, gitignore) | With step 1 |

**First milestone:** Steps 1+2+9 → working site with command reference, buildable and serveable locally.

---

## Verification

1. `cd packages/docs && pnpm dev` — VitePress dev server starts, landing page renders
2. Navigate to `/reference/commands/sniper-init` — auto-generated command page renders correctly
3. Navigate to `/guide/getting-started` — hand-written guide renders
4. `pnpm build` in docs — static site builds without errors
5. Sidebar dynamically lists all generated pages
6. Add a test file to `packages/core/framework/commands/`, re-run generate — new page appears
7. `pnpm docs:build` from root works
8. GitHub Pages deployment succeeds

---

## Key Files to Reference

- `packages/core/framework/teams/discover.yaml` — team YAML structure for parser
- `packages/core/framework/commands/sniper-discover.md` — command format for transformer
- `packages/core/framework/personas/process/developer.md` — persona structure
- `packages/core/framework/config.template.yaml` — config schema to document
- `package.json` (root) — add docs scripts
- `pnpm-workspace.yaml` — already covers `packages/*`
