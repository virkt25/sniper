# SNPR-0001: Artifact Versioning & Amendment

> **Status:** Draft
> **Phase:** A — Foundation
> **Dependencies:** None (unblocks SNPR-0002, SNPR-0003, SNPR-0004)

## Problem Statement

Every SNIPER artifact (brief, PRD, architecture, UX spec, security, epics, stories) is created once and treated as immutable. Re-running any phase command overwrites the existing artifact entirely. This means:

1. A team that runs `/sniper-discover` twice loses all edits from the first run.
2. There is no way to track what changed between versions of an artifact.
3. Manual edits made to artifacts after generation are destroyed on re-run.
4. The config only tracks `null | draft | approved` — there's no `amended` or version number.

This blocks every other v2 feature. `/sniper-feature` needs to amend `architecture.md` with deltas. Flexible phase navigation needs re-running phases without data loss. `/sniper-ingest` needs to produce versioned artifacts that can be amended later.

## Solution Overview

Three interconnected changes:

1. **Version headers** — all artifact templates gain version metadata
2. **Managed sections** — extend the `<!-- sniper:managed -->` protocol (already designed for `/sniper-doc`) to all artifacts
3. **Amendment mode** — phase commands detect existing artifacts and amend rather than overwrite

## Detailed Requirements

### 1. Version Headers in All Templates

Every artifact template gains a standardized metadata block:

```markdown
> **Version:** 1
> **Status:** Draft
> **Last Updated:** {date}
> **Author:** {team} — {role}
> **Change Log:**
> - v1 ({date}): Initial version
```

When an artifact is amended, the version increments and a new changelog entry is appended:

```markdown
> **Version:** 2
> **Status:** Amended
> **Last Updated:** 2026-02-25
> **Author:** Planning Team — Product Manager
> **Change Log:**
> - v2 (2026-02-25): Added webhook feature requirements (SNPR-0014)
> - v1 (2026-02-10): Initial version
```

**Files to modify:**
- `packages/core/framework/templates/brief.md`
- `packages/core/framework/templates/prd.md`
- `packages/core/framework/templates/architecture.md`
- `packages/core/framework/templates/ux-spec.md`
- `packages/core/framework/templates/security.md`
- `packages/core/framework/templates/epic.md`
- `packages/core/framework/templates/story.md`

### 2. Managed Sections Protocol

Extend the `<!-- sniper:managed -->` pattern from `/sniper-doc` to all artifact templates. Sections wrapped in managed markers can be regenerated without affecting content outside the markers.

```markdown
## 3. User Stories

<!-- sniper:managed:user-stories:start -->
### P0 — Critical (Must Ship)
| ID | As a... | I want to... | So that... | Acceptance Criteria |
|----|---------|-------------|-----------|-------------------|
| US-001 | ... | ... | ... | ... |
<!-- sniper:managed:user-stories:end -->

## 4. Manual Notes
These notes were added by the developer and will NOT be overwritten.
```

**Rules:**
- Content between `<!-- sniper:managed:{section-name}:start -->` and `<!-- sniper:managed:{section-name}:end -->` is owned by SNIPER and can be regenerated.
- Content outside managed sections is owned by the developer and must be preserved on re-generation.
- Each managed section has a unique name (e.g., `user-stories`, `data-models`, `api-contracts`).
- If a template has no managed section markers, the entire file is treated as SNIPER-managed (backward compatible — existing v1 behavior).

**Files to modify:** Same template files as above, adding managed section markers to regenerable sections.

### 3. Amendment Mode for Phase Commands

When a phase command runs and detects existing artifacts, it enters **amendment mode** instead of overwriting.

**Detection logic (based on artifact file existence, NOT phase state):**

Amendment detection is purely file-based — it checks whether the target output file exists on disk. It does NOT depend on `current_phase` or `phase_log`. This ensures it works regardless of the phase navigation model (SNPR-0002).

```
If the target artifact file (e.g., docs/prd.md) exists AND is non-empty:
  → Enter amendment mode
  → Read existing artifact
  → Instruct agents to AMEND, not create from scratch
  → Increment version number in the artifact header
  → Append changelog entry
  → Set artifact config status back to "draft" (requires re-approval)

If the target artifact file does NOT exist:
  → Normal create mode (current behavior)
```

**Amendment instructions added to agent spawn prompts:**

When a phase command detects existing artifacts, the task instructions change from:
- "Write a comprehensive PRD covering..." (create mode)

To:
- "Read the existing PRD at `docs/prd.md` (version {N}). Amend it based on the new context. Preserve all existing content outside managed sections. Add new requirements, update changed sections, and mark removed items as deprecated. Increment the version to {N+1} and add a changelog entry describing what changed." (amendment mode)

**Commands affected:**
- `/sniper-discover` — amends `brief.md`, `risks.md`, `personas.md`
- `/sniper-plan` — amends `prd.md`, `architecture.md`, `ux-spec.md`, `security.md`
- `/sniper-solve` — amends existing epics, adds new stories (does not overwrite completed stories)

### 4. Config Schema Changes

See `plans/features/phase-a-config-schema.md` for the unified final config schema across all Phase A PRDs.

Key changes for SNPR-0001:
- Artifact entries expand from flat strings (`brief: null`) to objects (`brief: { status: null, version: 0 }`)
- Status values are `null | draft | approved` (no `amended` status — when an artifact is amended, it returns to `draft` and version increments)
- `risks` and `personas` artifacts are added to tracking (previously only checked on disk)
- A `schema_version: 2` field gates migration
- Migration runs once via a shared Config Reader Protocol (not per-command)

### 5. Solve Command Amendment Behavior

`/sniper-solve` requires special amendment logic because it produces many files:

- **Existing completed stories** (marked `Status: Complete (Sprint N)`) are NEVER overwritten.
- **Existing draft stories** can be amended (updated acceptance criteria, embedded context refresh).
- **New requirements** in an amended PRD generate new stories with the next available story number.
- **New epics** are added with the next available epic number.
- **Removed requirements** — stories for removed PRD items are marked `Status: Deprecated` rather than deleted.

## Acceptance Criteria

1. **Given** all existing v1 templates, **When** SNPR-0001 is implemented, **Then** every template in `packages/core/framework/templates/` has a version header block.

2. **Given** a project with an existing `docs/prd.md` (v1), **When** `/sniper-plan` is run, **Then** the agent reads the existing PRD, amends it, increments the version to 2, and preserves content outside managed sections.

3. **Given** a project with completed stories, **When** `/sniper-solve` is run in amendment mode, **Then** completed stories are not modified, and new stories are created for new requirements.

4. **Given** a project with old-format config (`brief: draft`), **When** any command reads the config, **Then** it auto-migrates to the new object format (`brief: { status: draft, version: 1 }`).

5. **Given** a developer has added manual notes outside managed sections in `docs/architecture.md`, **When** `/sniper-plan` runs in amendment mode, **Then** the manual notes are preserved.

## Implementation Scope

### In Scope
- Version headers in all 7 templates
- Managed section markers in all templates
- Amendment detection logic in `/sniper-discover`, `/sniper-plan`, `/sniper-solve`
- Config schema expansion and auto-migration
- `/sniper-solve` special handling for completed/draft/new stories

### Out of Scope
- Diff visualization (showing what changed between versions) — future enhancement
- Git-based version history — artifacts already live in git
- Amendment mode for `/sniper-sprint` — sprints don't produce planning artifacts
- `/sniper-doc` changes — it already has managed sections

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/templates/brief.md` | Add version header + managed sections |
| `packages/core/framework/templates/prd.md` | Add version header + managed sections |
| `packages/core/framework/templates/architecture.md` | Add version header + managed sections |
| `packages/core/framework/templates/ux-spec.md` | Add version header + managed sections |
| `packages/core/framework/templates/security.md` | Add version header + managed sections |
| `packages/core/framework/templates/epic.md` | Add version header + managed sections |
| `packages/core/framework/templates/story.md` | Add version header + managed sections |
| `packages/core/framework/config.template.yaml` | Expand artifact state schema |
| `packages/core/framework/commands/sniper-discover.md` | Add amendment detection + amended spawn instructions |
| `packages/core/framework/commands/sniper-plan.md` | Add amendment detection + amended spawn instructions |
| `packages/core/framework/commands/sniper-solve.md` | Add amendment detection + story preservation logic |
