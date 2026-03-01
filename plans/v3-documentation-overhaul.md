# SNIPER v3 Documentation & Website Overhaul Plan

**Date:** 2026-02-28
**Branch:** `docs/v3-documentation-overhaul`
**Goal:** Update all documentation and the website to reflect the v3 ground-up rewrite, completing the vision of best-in-class developer documentation for 2026.

---

## Current State Assessment

### What's Working Well
- **16 guide pages** — 14/16 are current and accurate for v3/v3.1/v3.2
- **Auto-generation system** — Generators pull reference content from `packages/core` (commands, personas, teams, checklists, templates, workflows)
- **Home page** — HeroSection, LifecycleWheel, BentoGrid, StatsSection, TerminalDemo all exist and render
- **VitePress infrastructure** — Custom theme, Mermaid support, Pagefind search, dynamic sidebar, clean URLs
- **Design system** — Brand colors, typography, animations framework established

### What Needs Work

#### A. Content Gaps (v3 features undocumented or outdated)
1. **`/sniper-flow` unification** — CLAUDE.md says `/sniper-flow` is the core engine replacing 5 v2 commands, but guides still reference individual phase commands (`/sniper-discover`, `/sniper-plan`, etc.) as primary interface
2. **New CLI subcommands** — 13 CLI subcommands exist (`protocol`, `dashboard`, `workspace`, `revert`, `run`, `marketplace`, `signal`, `knowledge`, `sphere`) but most are undocumented
3. **Headless mode** — `sniper run` for CI/CD with `--auto-approve`, `--output`, `--timeout` flags — no guide page
4. **MCP Knowledge Server** — `packages/mcp-knowledge` exists but no documentation
5. **Marketplace** — `sniper marketplace search` exists but no documentation
6. **Custom Protocols** — `sniper protocol create/list/validate` exists but no documentation
7. **Signal system** — Signal capture, `signal-hooks.json`, `.sniper/memory/signals/` — mentioned in code but not in guides
8. **Plugin development** — Guide exists in `docs/v3-plugin-development.md` (root) but NOT in the VitePress site
9. **v3 Migration guide** — exists at `docs/v3-migration-guide.md` (root) but NOT in the VitePress site
10. **Trigger tables** — Config feature for mapping file patterns to agents/protocols — not in guides
11. **Self-healing CI** — PostToolUse hook pattern — not documented in guides
12. **Logical revert** — `sniper revert` + revert-plan schema — not documented

#### B. Home Page / Website Gaps
1. **Outdated messaging** — Home page content may not reflect v3's full capability set (headless CI/CD, marketplace, MCP, custom protocols)
2. **Phase 4 incomplete** — Custom Cmd+K search modal exists but AI chat widget not built
3. **Phase 5 not started** — Interactive demos (command simulator, persona composer, team builder)
4. **Phase 6 not started** — Performance audit, Lighthouse optimization, WCAG compliance
5. **Phase 7 not started** — OG images, JSON-LD, analytics integration
6. **Missing "Why SNIPER" page** — Competitive comparison, positioning against Codev/Aider/OpenHands
7. **Missing "Ecosystem" page** — Plugins, domain packs, marketplace, community

#### C. Reference Section Gaps
1. **CLI reference** — The 13 `sniper` subcommands need reference pages (separate from slash commands)
2. **Schema reference** — 13 YAML schemas exist but have no reference pages
3. **Hooks reference** — 2 hook files exist but no reference documentation
4. **Configuration reference** — Full `config.yaml` schema needs a dedicated reference page

---

## Implementation Plan

### Phase 1: Content Foundation (Priority: Critical)

Update core documentation content to accurately reflect v3.

#### 1.1 Fix Command Architecture Documentation
**Files:** `getting-started.md`, `cheatsheet-commands.md`, `core-concepts.md`

- Clarify the `/sniper-flow` vs individual phase commands relationship
- Document that `/sniper-flow` is the protocol execution engine with `--protocol` flag
- Show that `/sniper-discover`, `/sniper-plan`, `/sniper-solve`, `/sniper-sprint` are convenience skills that invoke `/sniper-flow` with the appropriate protocol/phase
- Update getting-started to use `/sniper-flow` as primary path with individual commands as shortcuts
- Update cheatsheet to show both `/sniper-flow` usage and individual phase commands

#### 1.2 New Guide Pages
Create new guide pages in `packages/docs/guide/`:

| Page | Content |
|------|---------|
| `headless-ci.md` | Headless mode for CI/CD — `sniper run`, auto-approve gates, output formats, exit codes, timeout handling, GitHub Actions example |
| `custom-protocols.md` | Creating custom protocols — `sniper protocol create`, YAML schema, phase definitions, custom gates, validation |
| `plugin-development.md` | Port `docs/v3-plugin-development.md` into VitePress site — plugin.yaml manifest, commands, conventions, review checks, agent mixins, hooks |
| `migration-from-v2.md` | Port `docs/v3-migration-guide.md` into VitePress site — `sniper migrate`, config changes, command mapping, breaking changes |
| `signals-and-learning.md` | Signal capture system — auto-capture hooks, signal schema, signal injection into agents, learning loop |
| `advanced-features.md` | Trigger tables, self-healing CI, multi-model review, spec sync, velocity calibration deep dive |

#### 1.3 Update VitePress Sidebar Config
**File:** `packages/docs/.vitepress/config.mts`

Add new pages to sidebar:
```
Guide → Using SNIPER:
  + Headless & CI/CD
  + Custom Protocols

Guide → Deep Dives:
  + Signals & Learning
  + Advanced Features

Guide → Extending:
  + Plugin Development
  + Migration from v2
```

#### 1.4 New Reference Sections
Add auto-generators and reference pages for:

| Section | Source | Generator |
|---------|--------|-----------|
| CLI Commands | `packages/cli/src/commands/*.ts` | New `generators/cli-commands.mjs` |
| Schemas | `packages/core/schemas/*.yaml` | New `generators/schemas.mjs` |
| Hooks | `packages/core/hooks/*.json` | New `generators/hooks.mjs` |
| Configuration | `packages/core/config.template.yaml` | New `generators/config-reference.mjs` |

---

### Phase 2: Home Page & Landing Experience

Update the home page to showcase v3's full capability set.

#### 2.1 Update Home Page Content
**File:** `packages/docs/.vitepress/theme/components/home/HomePage.vue`

- Update StatsSection numbers to reflect v3 inventory (9 agents, 7 protocols, 43+ personas, 13 schemas, etc.)
- Add new BentoGrid cards for v3 features:
  - Headless CI/CD — run protocols in pipelines
  - Marketplace — discover and install plugins/packs
  - Custom Protocols — define your own workflows
  - MCP Knowledge — context-aware code intelligence
  - Signal Learning — framework learns from failures
  - Multi-Model Review — consensus-based quality gates
- Update "Two Paths" section to show v3 protocol names accurately
- Update TerminalDemo to show v3 command flow

#### 2.2 New Landing Sections

| Section | Content |
|---------|---------|
| **"Why SNIPER"** | Competitive positioning — what makes SNIPER different from Codev, Aider, OpenHands. Based on v3 research findings. Link to dedicated page. |
| **Ecosystem Overview** | Visual grid of plugins (TypeScript, Python, Go), domain packs (Sales Dialer), and marketplace concept |
| **Testimonials / Case Study** | Placeholder section for social proof (production metrics from v3 research: token efficiency, protocol completion rates) |

#### 2.3 Update HeroSection
**File:** `HeroSection.vue`

- Update tagline/subtitle to reference v3 capabilities
- Verify animation performance (GPU-accelerated transforms, will-change)
- Add "v3" badge or version indicator

---

### Phase 3: Interactive Components & Enhanced Content Experience

#### 3.1 New Vue Components

| Component | Purpose |
|-----------|---------|
| `ProtocolFlowDiagram.vue` | Interactive protocol state machine — click phases to see agents, gates, outputs |
| `ConfigExplorer.vue` | Interactive config.yaml explorer — click sections to see docs, examples, defaults |
| `EcosystemGrid.vue` | Plugin/pack gallery with install commands |
| `ComparisonMatrix.vue` | Feature comparison table (SNIPER vs alternatives) |
| `CIBadge.vue` | Shows example CI badge for headless mode |

#### 3.2 Enhance Existing Components

| Component | Enhancement |
|-----------|-------------|
| `TerminalDemo.vue` | Add v3 flow demo — show `/sniper-flow` executing a full protocol with checkpoints |
| `TeamDiagram.vue` | Add interactive agent selection — click agent to see capabilities |
| `CommandPalette.vue` | Include CLI subcommands alongside slash commands |
| `PersonaCard.vue` | Add "composition preview" — show what a persona looks like when composed |

#### 3.3 Content Enhancements
- Add Mermaid diagrams to protocol reference pages (state machine flows)
- Add collapsible YAML examples in configuration guide
- Add "copy to clipboard" for all YAML/config snippets
- Add reading time badges to guide pages
- Add "Edit on GitHub" links to all pages

---

### Phase 4: Search, AI & Developer Experience

#### 4.1 Enhanced Search
- Verify Pagefind indexes all generated reference pages
- Add search result categories (Guide, Commands, Personas, Teams, etc.)
- Add keyboard navigation (arrow keys, Enter to select)
- Index CLI subcommands in search

#### 4.2 llms.txt Enhancement
**File:** `generators/llmstxt.mjs`

- Update `llms.txt` to include v3 complete context
- Add all 13 CLI subcommands
- Add all 13 schemas
- Add hook definitions
- Ensure token budget stays reasonable

#### 4.3 Developer Quick-Start Improvements
- Add "5-minute quickstart" card on home page
- Add copy-paste install + init commands
- Add visual "what happens next" flow after init

---

### Phase 5: New Pages for v3 Positioning

#### 5.1 "Why SNIPER" Page (`guide/why-sniper.md`)
- The problem: AI coding assistants lack structured lifecycle management
- The SNIPER approach: protocol-driven, team-based, quality-gated
- Comparison with alternatives (based on v3-rewrite.md research):
  - vs Codev: deeper persona composition, domain packs, multi-human coordination
  - vs Aider: team-based not pair-based, structured phases not ad-hoc
  - vs OpenHands: framework not runtime, works inside Claude Code natively
- When NOT to use SNIPER (small scripts, one-off fixes)

#### 5.2 "Ecosystem" Page (`guide/ecosystem.md`)
- Official plugins (TypeScript, Python, Go)
- Domain packs (Sales Dialer as example)
- Creating your own plugin
- Creating your own domain pack
- Marketplace vision

#### 5.3 "Architecture" Page (`guide/architecture.md`)
- How SNIPER maps to Claude Code primitives (skills → slash commands, agents → subagents, hooks → event handlers)
- The lead-orchestrator pattern (read-only coordinator)
- Protocol state machines
- Gate evaluation flow
- Memory and learning loop
- Workspace multi-project coordination

---

### Phase 6: Performance, Polish & Accessibility

#### 6.1 Performance Audit
- Run Lighthouse on built site
- Target: Performance 95+, Accessibility 100, Best Practices 100, SEO 100
- Optimize: lazy-load Vue components below fold, minimize CSS, preload critical fonts
- Verify all images have width/height attributes
- Check bundle size — target <100KB gzipped JS

#### 6.2 Accessibility
- WCAG 2.1 AA compliance audit
- All interactive components keyboard-navigable
- All images have alt text
- Color contrast ratios verified
- Focus indicators visible
- Screen reader testing for custom components

#### 6.3 Mobile Experience
- Test all pages on mobile viewports (320px, 375px, 414px)
- Ensure sidebar navigation works on mobile
- Touch targets ≥44px
- No horizontal scroll

#### 6.4 Dark/Light Mode
- Verify all custom components respect dark mode
- Check syntax highlighting themes in both modes
- Ensure Mermaid diagrams are readable in both modes

---

### Phase 7: SEO & Meta

#### 7.1 OpenGraph Images
- Auto-generate OG images per page using `vite-plugin-og-image` or similar
- Brand template with SNIPER logo + page title
- Different templates for guide vs reference pages

#### 7.2 Structured Data
- JSON-LD for SoftwareApplication on home page
- JSON-LD for HowTo on getting-started
- JSON-LD for FAQ on troubleshooting
- Breadcrumbs structured data on all pages

#### 7.3 Sitemap & Robots
- Verify sitemap includes all generated reference pages
- Verify robots.txt allows all documentation pages
- Add canonical URLs

---

## Implementation Priority & Sequencing

### Wave 1 — Content First (Highest Impact)
1. **Phase 1.1** — Fix command architecture (getting-started, cheatsheet)
2. **Phase 1.2** — Write new guide pages (headless, custom protocols, plugin dev, migration, signals, advanced)
3. **Phase 1.3** — Update sidebar config
4. **Phase 5.1** — "Why SNIPER" page (positioning)
5. **Phase 5.3** — "Architecture" page (technical overview)

### Wave 2 — Reference Expansion
6. **Phase 1.4** — New reference generators (CLI commands, schemas, hooks, config)
7. **Phase 4.2** — Update llms.txt
8. **Phase 5.2** — "Ecosystem" page

### Wave 3 — Home Page & Visuals
9. **Phase 2.1** — Update home page content & stats
10. **Phase 2.2** — New landing sections
11. **Phase 2.3** — Update HeroSection
12. **Phase 3.1** — New interactive components
13. **Phase 3.2** — Enhance existing components

### Wave 4 — Polish & Ship
14. **Phase 3.3** — Content enhancements (diagrams, copy buttons, reading time)
15. **Phase 4.1** — Enhanced search
16. **Phase 4.3** — Developer quick-start improvements
17. **Phase 6** — Performance, accessibility, mobile, dark mode
18. **Phase 7** — SEO & meta

---

## File Inventory: What Gets Created/Modified

### New Files (Guide Pages)
- `packages/docs/guide/headless-ci.md`
- `packages/docs/guide/custom-protocols.md`
- `packages/docs/guide/plugin-development.md`
- `packages/docs/guide/migration-from-v2.md`
- `packages/docs/guide/signals-and-learning.md`
- `packages/docs/guide/advanced-features.md`
- `packages/docs/guide/why-sniper.md`
- `packages/docs/guide/ecosystem.md`
- `packages/docs/guide/architecture.md`

### New Files (Reference)
- `packages/docs/scripts/generators/cli-commands.mjs`
- `packages/docs/scripts/generators/schemas.mjs`
- `packages/docs/scripts/generators/hooks.mjs`
- `packages/docs/scripts/generators/config-reference.mjs`
- `packages/docs/reference/cli/index.md`
- `packages/docs/reference/schemas/index.md`
- `packages/docs/reference/hooks/index.md`
- `packages/docs/reference/config/index.md`

### New Files (Components)
- `packages/docs/.vitepress/theme/components/ProtocolFlowDiagram.vue`
- `packages/docs/.vitepress/theme/components/ConfigExplorer.vue`
- `packages/docs/.vitepress/theme/components/EcosystemGrid.vue`
- `packages/docs/.vitepress/theme/components/ComparisonMatrix.vue`
- `packages/docs/.vitepress/theme/components/CIBadge.vue`

### Modified Files
- `packages/docs/guide/getting-started.md` — command architecture fix
- `packages/docs/guide/cheatsheet-commands.md` — command architecture fix
- `packages/docs/guide/core-concepts.md` — minor updates
- `packages/docs/.vitepress/config.mts` — sidebar, nav, rewrites
- `packages/docs/.vitepress/theme/components/home/HomePage.vue` — v3 content
- `packages/docs/.vitepress/theme/components/home/HeroSection.vue` — v3 messaging
- `packages/docs/.vitepress/theme/components/TerminalDemo.vue` — v3 flow demo
- `packages/docs/.vitepress/theme/components/TeamDiagram.vue` — interactive agents
- `packages/docs/.vitepress/theme/components/CommandPalette.vue` — CLI commands
- `packages/docs/.vitepress/theme/components/PersonaCard.vue` — composition preview
- `packages/docs/scripts/generate.mjs` — new generators
- `packages/docs/scripts/generators/llmstxt.mjs` — v3 context
- `packages/docs/public/robots.txt` — verify
- `packages/docs/index.md` — if home layout changes needed

---

## Success Criteria

1. All v3 features are documented with guide pages and reference entries
2. New developer can go from zero to running a full SNIPER protocol in <10 minutes using only the docs
3. Every CLI subcommand and slash command has a reference page
4. Home page accurately showcases v3 capabilities with current stats
5. Lighthouse scores: Performance 95+, Accessibility 100, Best Practices 100, SEO 100
6. All generated reference pages are indexed in search
7. `llms.txt` provides complete v3 context for AI consumption
8. Mobile experience is fully functional
9. Dark/light mode works correctly on all pages
10. Site deploys cleanly to sniperai.dev
