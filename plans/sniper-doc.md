# SNIPER Doc Plan

## Problem

After running through SNIPER phases (Discover → Plan → Solve → Sprint), a project accumulates rich artifacts — briefs, PRDs, architecture docs, UX specs, security reviews, epics, stories. But there's no mechanism to:

1. **Generate user-facing project documentation** from these artifacts (README, API docs, setup guides, contributing guides)
2. **Keep documentation in sync** as the project evolves through subsequent sprints
3. **Document an existing project** that wasn't built with SNIPER but needs comprehensive docs

Today, documentation is a manual afterthought. SNIPER automates every phase of product development *except* the docs that ship with the product.

## Goal

Ship a `/sniper-doc` command that:
- Generates comprehensive project documentation from SNIPER artifacts + codebase analysis
- Updates existing documentation when code or artifacts change
- Works on projects that weren't built with SNIPER (standalone mode)
- Produces docs that are immediately useful, not boilerplate

---

## Two Modes

### Mode 1: SNIPER Project (artifact-aware)

When `.sniper/config.yaml` exists with completed phases, the command leverages existing artifacts:

```
SNIPER Artifacts          Generated Docs
─────────────────         ──────────────
brief.md            →     README.md (vision, value prop)
prd.md              →     README.md (features section), CONTRIBUTING.md
architecture.md     →     docs/architecture.md, docs/api.md
ux-spec.md          →     docs/ui-guide.md
security.md         →     docs/security.md, SECURITY.md
epics/*.md          →     docs/roadmap.md
stories/*.md        →     CHANGELOG.md (from completed stories)
config.yaml (stack) →     docs/setup.md, docs/development.md
```

### Mode 2: Standalone (codebase analysis)

When no SNIPER artifacts exist, the command analyzes the codebase directly:

```
Codebase Analysis         Generated Docs
─────────────────         ──────────────
package.json/Cargo.toml → README.md (name, description, deps)
src/ structure           → docs/architecture.md (inferred)
*.test.* files           → docs/testing.md
Dockerfile/docker-compose→ docs/deployment.md
.env.example             → docs/configuration.md
API routes/controllers   → docs/api.md
```

---

## Command Design

### `/sniper-doc`

```
$ /sniper-doc

? Documentation mode:
  ● Generate new docs (full generation)
  ○ Update existing docs (incremental)

? What to generate: (multi-select)
  ✓ README.md
  ✓ Setup guide
  ✓ Architecture overview
  ✓ API reference
  ○ Contributing guide
  ○ Security policy
  ○ Changelog
  ○ Deployment guide
  ○ UI/Component guide

? Output directory: docs/
```

### Incremental Update Mode

When docs already exist, the command:
1. Diffs current codebase against last doc generation snapshot
2. Identifies which docs are stale (new routes, changed schemas, added packages)
3. Proposes targeted updates rather than full regeneration
4. Preserves manual edits (sections marked `<!-- sniper:managed -->` get updated; unmarked sections are preserved)

---

## Architecture

### Team Definition: `.sniper/teams/doc.yaml`

```yaml
team_name: sniper-doc
phase: doc

teammates:
  - name: doc-analyst
    compose:
      process: doc-analyst
      technical: null
      cognitive: user-empathetic
      domain: from-config
    tasks:
      - id: analyze-project
        name: "Analyze Project Structure & Artifacts"
        output: "docs/.sniper-doc-index.json"
        description: >
          Scan the codebase and SNIPER artifacts. Produce a documentation
          index: what exists, what's missing, what's stale. Map source
          files to documentation topics.

  - name: doc-writer
    compose:
      process: doc-writer
      technical: from-config
      cognitive: mentor-explainer
      domain: from-config
    tasks:
      - id: write-readme
        name: "Generate README.md"
        output: "README.md"
        template: ".sniper/templates/doc-readme.md"
        description: >
          Write the project README from artifacts and codebase analysis.
          Include: overview, quick start, features, tech stack, project
          structure, contributing link, license.
        blocked_by: [analyze-project]

      - id: write-guides
        name: "Generate Documentation Guides"
        output: "docs/"
        template: ".sniper/templates/doc-guide.md"
        description: >
          Generate selected documentation files (setup, architecture,
          API, deployment, etc.) based on the doc index.
        blocked_by: [analyze-project]

  - name: doc-reviewer
    compose:
      process: doc-reviewer
      technical: null
      cognitive: devils-advocate
      domain: null
    tasks:
      - id: review-docs
        name: "Review & Validate Documentation"
        output: "docs/.sniper-doc-review.md"
        description: >
          Review all generated docs for accuracy, completeness, and
          consistency. Verify code examples compile, links resolve,
          and setup instructions actually work.
        blocked_by: [write-readme, write-guides]

coordination:
  - from: doc-analyst
    to: doc-writer
    trigger: analyze-project.complete
    message: "Doc index ready — here's what to generate"

review_gate:
  checklist: ".sniper/checklists/doc-review.md"
  mode: flexible
```

### New Personas

**Process Persona: `doc-analyst.md`**
- Scans project structure, identifies documentation needs
- Maps SNIPER artifacts → documentation topics
- Detects stale docs by comparing file modification times
- Produces a structured doc index (JSON) for the writer

**Process Persona: `doc-writer.md`**
- Writes clear, concise technical documentation
- Follows the project's existing voice/tone
- Generates working code examples from actual source
- Respects `<!-- sniper:managed -->` boundaries in existing docs

**Process Persona: `doc-reviewer.md`**
- Validates accuracy of generated documentation
- Checks code examples against actual codebase
- Verifies internal links and cross-references
- Ensures setup instructions produce a working environment

### New Templates

**`doc-readme.md`** — README template with sections:
- Project name, badges, one-liner
- Features (from PRD P0/P1 or inferred from code)
- Quick start (from stack analysis)
- Tech stack table
- Project structure tree
- Contributing link
- License

**`doc-guide.md`** — Generic guide template with sections:
- Overview
- Prerequisites
- Step-by-step instructions
- Examples
- Troubleshooting
- Related docs

**`doc-api.md`** — API reference template:
- Base URL, authentication
- Endpoints grouped by resource
- Request/response examples
- Error codes

### New Checklist

**`doc-review.md`**:
- [ ] README has working quick-start instructions
- [ ] All code examples are syntactically valid
- [ ] Internal doc links resolve correctly
- [ ] Setup guide produces a running environment
- [ ] Architecture doc matches actual project structure
- [ ] API docs cover all public endpoints
- [ ] No placeholder text or TODOs remain
- [ ] Consistent formatting and voice across all docs

---

## Doc Index Format

The doc-analyst produces a JSON index that drives generation:

```json
{
  "project": {
    "name": "my-app",
    "type": "saas",
    "stack": { "language": "typescript", "frontend": "react", "backend": "node-express" }
  },
  "sources": {
    "sniper_artifacts": {
      "brief": "docs/brief.md",
      "prd": "docs/prd.md",
      "architecture": "docs/architecture.md"
    },
    "codebase": {
      "entry_point": "src/index.ts",
      "api_routes": ["src/routes/*.ts"],
      "models": ["src/models/*.ts"],
      "tests": ["tests/**/*.test.ts"],
      "config_files": [".env.example", "docker-compose.yml"]
    }
  },
  "docs_to_generate": [
    { "type": "readme", "path": "README.md", "status": "missing" },
    { "type": "setup", "path": "docs/setup.md", "status": "stale", "reason": "3 new deps since last gen" },
    { "type": "api", "path": "docs/api.md", "status": "stale", "reason": "2 new routes added" }
  ],
  "docs_current": [
    { "type": "architecture", "path": "docs/architecture.md", "status": "current" }
  ]
}
```

---

## Managed Section Protocol

To support incremental updates without clobbering manual edits:

```markdown
<!-- sniper:managed:start -->
## Installation

npm install my-app
<!-- sniper:managed:end -->

## Custom Section Written by Human

This section is never touched by sniper-doc.

<!-- sniper:managed:start -->
## API Reference
...
<!-- sniper:managed:end -->
```

Rules:
- Content between `sniper:managed` tags is regenerated on update
- Content outside tags is preserved exactly
- New sections are appended at the end (user can reorder)
- On first generation, entire file is wrapped in managed tags
- Users can "eject" a section by removing the tags

---

## Workflow Integration

### Where `/sniper-doc` Fits in the Lifecycle

```
discover → plan → solve → sprint → [doc] → release
```

- **Not a gated phase** — it's a utility command that can run at any time
- **Best after sprint** — when code exists and artifacts are complete
- **Can re-run** — incremental mode makes it safe to run repeatedly
- **Standalone capable** — works without prior SNIPER phases

### Config Addition

```yaml
# Added to .sniper/config.yaml
documentation:
  output_dir: "docs/"
  managed_sections: true          # Use <!-- sniper:managed --> protocol
  include:                        # Default doc types to generate
    - readme
    - setup
    - architecture
    - api
  exclude: []                     # Doc types to skip
  custom_sections: {}             # User-defined sections per doc type
```

---

## Implementation Plan

### Phase 1: Foundation
- [ ] Create `doc-analyst.md` process persona
- [ ] Create `doc-writer.md` process persona
- [ ] Create `doc-reviewer.md` process persona
- [ ] Create `doc.yaml` team definition
- [ ] Add `documentation` section to `config.yaml` schema

### Phase 2: Templates & Checklist
- [ ] Create `doc-readme.md` template
- [ ] Create `doc-guide.md` template
- [ ] Create `doc-api.md` template
- [ ] Create `doc-review.md` checklist

### Phase 3: Command Workflow
- [ ] Create `sniper-doc.md` command/workflow definition
- [ ] Implement doc index generation logic (analyst task spec)
- [ ] Implement managed section parsing protocol
- [ ] Implement incremental update detection (stale doc identification)

### Phase 4: Skill Registration
- [ ] Register `/sniper-doc` as a Claude Code skill
- [ ] Add command to CLAUDE.md quick reference
- [ ] Update `.claude/settings.json` with new skill permissions

### Phase 5: Standalone Mode
- [ ] Add codebase-only analysis path (no SNIPER artifacts required)
- [ ] Infer project metadata from package.json / Cargo.toml / pyproject.toml / etc.
- [ ] Infer architecture from directory structure and imports
- [ ] Infer API surface from route definitions

### Phase 6: Testing & Polish
- [ ] Test on a SNIPER project (sales-dialer)
- [ ] Test on a non-SNIPER project (standalone mode)
- [ ] Test incremental update mode (add code, re-run, verify managed sections)
- [ ] Run doc-review checklist on generated output

---

## Key Design Decisions

### 1. Utility, not a phase

`/sniper-doc` is not a lifecycle phase like discover/plan/solve/sprint. It doesn't gate subsequent phases and doesn't require prior phases to complete. This keeps it flexible — you can document a project at any point, or re-document after changes.

### 2. Managed sections over full regeneration

Full doc regeneration destroys manual edits. The `<!-- sniper:managed -->` protocol lets SNIPER own specific sections while humans own others. This is borrowed from code generators like Prisma and OpenAPI codegen that face the same problem.

### 3. Three-agent team

- **Analyst** scans and plans (what to document)
- **Writer** generates content (writes the docs)
- **Reviewer** validates output (catches errors)

This mirrors the discover/plan/sprint pattern and prevents the writer from both deciding what to write AND writing it.

### 4. Doc index as intermediate artifact

The JSON doc index is the handoff between analyst and writer. It's explicit, inspectable, and makes the "what to generate" decision transparent. It also enables the incremental update mode — diff the current index against the previous one.

### 5. Standalone mode as first-class

Many users will want to document existing projects that weren't built with SNIPER. Standalone mode makes `/sniper-doc` useful even if you never use the full SNIPER lifecycle. This also serves as an on-ramp — users discover SNIPER through doc generation, then adopt the full framework.
