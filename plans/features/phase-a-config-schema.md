# Phase A: Unified Config Schema

> This document defines the final `config.template.yaml` state section after all Phase A PRDs (SNPR-0001 through SNPR-0004) are applied. All PRDs reference this as the canonical target schema.

## Schema Version

```yaml
schema_version: 2    # v1 = original flat format, v2 = Phase A format
```

All commands check `schema_version` on config read. If absent or `1`, run the v1→v2 migration (defined below) before proceeding.

## Full State Section

```yaml
# ─────────────────────────────────────────
# Lifecycle State (managed by SNIPER, don't edit manually)
# ─────────────────────────────────────────

schema_version: 2

state:
  # Phase log — replaces current_phase + phase_history (SNPR-0002)
  # Valid phases: discover | plan | solve | sprint | ingest | feature
  phase_log:
    # - phase: discover
    #   context: "initial"
    #   started_at: "2026-01-10T..."
    #   completed_at: "2026-01-10T..."
    #   approved_by: "auto-flexible"

  # Sprint counter — kept for convenience (derived from phase_log sprint entries)
  current_sprint: 0

  # Artifact tracking — object format with version (SNPR-0001)
  artifacts:
    brief:
      status: null       # null | draft | approved
      version: 0
    risks:
      status: null
      version: 0
    personas:
      status: null
      version: 0
    prd:
      status: null
      version: 0
    architecture:
      status: null
      version: 0
    ux_spec:
      status: null
      version: 0
    security:
      status: null
      version: 0
    conventions:         # NEW — produced by /sniper-ingest (SNPR-0003)
      status: null
      version: 0
    epics:
      status: null
      version: 0
    stories:
      status: null
      version: 0

  # Feature tracking (SNPR-0004)
  feature_counter: 1     # next SNPR-{XXXX} ID to assign
  features: []
    # - id: "SNPR-0001"
    #   slug: "feature-slug"
    #   title: "Feature title"
    #   phase: scoping     # scoping | planning | solving | sprint | complete
    #   created_at: "2026-02-21T..."
    #   completed_at: null
    #   arch_base_version: 0   # architecture.md version when feature started (SNPR-0004 conflict detection)
    #   stories_total: 0
    #   stories_complete: 0
```

## Status Value Definitions

Artifact statuses are kept simple — no `amended` status. The `version` field tracks iterations:

| Status | Meaning |
|--------|---------|
| `null` | Artifact does not exist |
| `draft` | Artifact exists but has not been reviewed/approved |
| `approved` | Artifact has been reviewed and approved |

When an artifact is amended (re-generated in amendment mode), it returns to `draft` status and the `version` increments. The approval cycle restarts. This is simpler than adding an `amended` status that no downstream consumer checks.

## Phase Vocabulary

Valid values for `phase_log[].phase`:

| Phase | Command | Notes |
|-------|---------|-------|
| `discover` | `/sniper-discover` | |
| `plan` | `/sniper-plan` | |
| `solve` | `/sniper-solve` | |
| `sprint` | `/sniper-sprint` | context auto-set to `sprint-{N}` |
| `ingest` | `/sniper-ingest` | SNPR-0003 |

**Note:** Feature lifecycles are tracked in `state.features[]`, NOT in `phase_log`. The feature command does NOT add entries to `phase_log`. This avoids dual-state confusion — `phase_log` is for the main project lifecycle, `features[]` is for incremental feature work.

## v1 → v2 Migration

When any command reads config and finds `schema_version` absent or `1`:

1. Set `schema_version: 2`
2. **Artifact migration:** For each flat artifact entry (e.g., `brief: draft`), convert to object:
   ```yaml
   brief:
     status: draft
     version: 1     # existing artifact = version 1
   ```
   For `null` values: `brief: { status: null, version: 0 }`
3. **Phase log migration:** Rename `phase_history` to `phase_log`. Add `context: "initial"` to all existing entries. Remove `current_phase` field.
4. **Add missing fields:** `feature_counter: 1`, `features: []`, `conventions: { status: null, version: 0 }`, `risks: { status: null, version: 0 }`, `personas: { status: null, version: 0 }`
5. Migration runs once — subsequent reads see `schema_version: 2` and skip.

## Config Reader Protocol

All commands should follow this protocol when reading config:

```
1. Read .sniper/config.yaml
2. Check schema_version
3. If schema_version < 2: run v1→v2 migration, write updated config
4. Proceed with command logic using v2 schema
```

This replaces the per-command migration logic described in individual PRDs. Each command references this shared protocol rather than defining its own migration.
