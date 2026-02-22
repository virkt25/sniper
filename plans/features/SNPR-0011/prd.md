# SNPR-0011: Improved Domain Packs

> **Status:** Draft
> **Phase:** C — Quality & Depth
> **Dependencies:** None (extends existing pack infrastructure)
> **Soft Dependencies:** SNPR-0004 (feature lifecycle can leverage domain-specific story templates)

## Problem Statement

Domain packs today are limited to knowledge files — markdown documents that provide domain context to agents. This is useful but leaves significant value on the table:

1. **No domain-specific personas** — a healthcare SaaS needs agents who think about HIPAA compliance, patient data flows, and clinical workflows. A fintech product needs agents who understand PCI-DSS, transaction idempotency, and regulatory reporting. Today, packs can only provide background reading, not shape how agents think and what they prioritize.
2. **No domain-specific checklists** — review gates are generic. A healthcare project should check for PHI exposure, audit logging, and consent management. A fintech project should check for transaction atomicity, regulatory reporting, and PCI scope. Today, every project uses the same checklists regardless of domain.
3. **No domain-specific story templates** — stories for a SaaS product always need sections like "API changes", "migration steps", and "feature flags." An e-commerce product needs "cart impact", "pricing rules", and "inventory effects." Today, story templates are one-size-fits-all.
4. **No pack composition** — a multi-tenant healthcare SaaS needs both SaaS patterns and healthcare compliance. Today, you can only use one pack. There's no way to stack domain knowledge.
5. **No domain-specific workflows** — some domains have regulatory workflows (e.g., healthcare requires a compliance review phase; fintech requires a risk assessment phase). Today, all projects follow the same lifecycle phases.

SNIPER can extend domain packs from passive knowledge into active framework participants that shape personas, checklists, templates, workflows, and even add domain-specific review gates.

## Solution Overview

Extend the domain pack structure to include additional content types beyond knowledge files:

```
packages/pack-{name}/pack/
├── knowledge/               # Existing: domain knowledge files
│   ├── overview.md
│   └── ...
├── personas/                # NEW: domain-specific persona overlays
│   ├── process/
│   │   └── compliance-reviewer.md
│   └── cognitive/
│       └── regulatory-minded.md
├── checklists/              # NEW: domain-specific review checklists
│   └── hipaa-review.md
├── templates/               # NEW: domain-specific template extensions
│   ├── story-addendum.md
│   └── prd-addendum.md
├── workflows/               # NEW: domain-specific workflow additions
│   └── compliance-review.md
└── pack.yaml                # NEW: pack manifest (replaces convention-based loading)
```

Support composable pack stacking:

```yaml
# .sniper/config.yaml
domain_pack:
  - sales-dialer              # base pack
  - healthcare                # stacked: adds HIPAA compliance
```

## Detailed Requirements

### 1. Pack Manifest (`pack.yaml`)

Each pack gets a manifest file that declares its contents and metadata:

```yaml
name: healthcare
version: "1.0.0"
description: "Healthcare domain pack — HIPAA compliance, patient data, clinical workflows"
author: "SNIPER Community"

# What this pack provides
provides:
  knowledge:
    - knowledge/overview.md
    - knowledge/hipaa-basics.md
    - knowledge/patient-data-flows.md
  personas:
    - personas/process/compliance-reviewer.md
    - personas/cognitive/regulatory-minded.md
  checklists:
    - checklists/hipaa-review.md
    - checklists/phi-handling.md
  templates:
    - templates/story-addendum.md
    - templates/prd-addendum.md
  workflows:
    - workflows/compliance-review.md

# Pack stacking rules
compatible_with:
  - saas                      # designed to stack with SaaS pack
  - api                       # works with API-only projects too
conflicts_with: []            # packs that should not be combined

# Domain-specific config additions
config_defaults:
  review_gates:
    after_plan: strict         # healthcare always requires strict plan review
  custom_gates:
    compliance_review: strict  # domain-specific gate
```

**Backward compatibility:**
- Packs without `pack.yaml` continue to work — the framework falls back to loading all `.md` files from `knowledge/` (current behavior). The manifest is opt-in.
- Config files with `domain_pack: "sales-dialer"` (string format) are auto-migrated to `domain_pack: ["sales-dialer"]` (array format) during the config migration check.

### 2. Domain-Specific Personas

Pack personas are **overlays** — they don't replace framework personas but extend them. When a pack provides a persona, it becomes available for team composition:

**How overlays work:**
- Pack personas are placed in the same directory structure as framework personas (`personas/process/`, `personas/cognitive/`)
- During `/sniper-compose`, pack personas appear alongside framework personas
- If a pack persona has the same name as a framework persona, the pack version **extends** it (pack content is appended, not replaced)
- Pack personas are namespaced in team YAMLs: `pack:{pack-name}/process/compliance-reviewer`

**Example pack persona — `personas/process/compliance-reviewer.md`:**

```markdown
# Compliance Reviewer

Role: Healthcare compliance specialist. Review all code changes through the lens of
HIPAA requirements — PHI handling, audit logging, access controls, data encryption
at rest and in transit, and minimum necessary principle. Think like a compliance
officer who must sign off before any patient data system goes to production.

## Review Focus
- Protected Health Information (PHI) exposure in logs, errors, or API responses
- Audit trail completeness for all PHI access
- Encryption standards for data at rest and in transit
- Access control granularity (role-based, need-to-know)
- Data retention and disposal procedures
- Business Associate Agreement (BAA) implications for third-party services
```

### 3. Domain-Specific Checklists

Pack checklists are **additive** — they run in addition to framework checklists during review gates. When `/sniper-review` runs:

1. Run all framework checklists for the current phase
2. If a domain pack provides checklists, run those too
3. Report findings from both sources, clearly labeled

**Example pack checklist — `checklists/hipaa-review.md`:**

Checks:
- No PHI in log output or error messages
- All PHI access has audit trail entries
- Data encryption at rest (database, file storage)
- Data encryption in transit (TLS, no HTTP)
- Minimum necessary principle applied to data queries
- BAA status verified for all third-party data processors
- Patient consent flows implemented where required
- Data retention policies implemented and documented

### 4. Domain-Specific Template Extensions

Pack templates are **addendums** — they add sections to existing framework templates rather than replacing them. When a template is rendered:

1. Render the framework template as normal
2. If a pack provides `templates/{template-name}-addendum.md`, append those sections

**Example — `templates/story-addendum.md`:**

```markdown
## Healthcare Compliance

### PHI Impact
- [ ] This story handles Protected Health Information: Yes / No
- [ ] If yes, PHI categories affected: {demographics, medical records, billing, etc.}

### Compliance Requirements
- [ ] Audit logging added for PHI access
- [ ] Data encryption verified
- [ ] Access controls appropriate for data sensitivity
- [ ] No PHI in client-side logs or error messages

### Regulatory Notes
{Any HIPAA, HITECH, or state privacy law considerations for this story}
```

**Naming convention:** Addendums must match the framework template name with `-addendum` suffix. For example, `story-addendum.md` extends `story.md`, `prd-addendum.md` extends `prd.md`.

### 5. Domain-Specific Workflows

Pack workflows define **additional lifecycle phases** that are injected into the standard workflow. These are optional review gates or process steps that run at specific points.

**Example — `workflows/compliance-review.md`:**

```markdown
# Compliance Review Workflow

## Trigger
Runs after `/sniper-plan` (after architecture is approved) and before `/sniper-solve`.

## Process
1. Review the architecture document for compliance implications
2. Identify components that handle regulated data
3. Produce a compliance assessment document
4. Required gate: compliance officer (human) must approve

## Output
`docs/compliance/compliance-assessment.md`
```

**Workflow injection points:**
- `after_discover` — after discovery, before planning
- `after_plan` — after planning, before story creation
- `after_solve` — after stories, before sprint
- `after_sprint` — after implementation, before release

Pack workflows register themselves at a specific injection point. The framework checks for registered pack workflows at each gate.

### 6. Pack Stacking (Composition)

Multiple packs can be loaded simultaneously:

```yaml
# .sniper/config.yaml
domain_pack:
  - saas           # SaaS patterns: multi-tenancy, billing, feature flags
  - healthcare     # Healthcare: HIPAA compliance, PHI handling
```

**Stacking rules:**
1. Knowledge files from all packs are loaded (concatenated context)
2. Personas from all packs are available for composition
3. Checklists from all packs run during review gates
4. Template addendums from all packs are appended (in pack order)
5. Workflows from all packs are injected (in pack order)
6. If packs have `conflicts_with` entries that match, warn the user at init time

**Conflict resolution:**
- If two packs provide a persona with the same name, the later pack in the list wins (with a warning)
- If two packs provide conflicting `config_defaults`, the later pack wins (with a warning)
- Template addendums are always concatenated (no conflicts possible)
- Checklists are always additive (no conflicts possible)

### 7. Pack Discovery and Loading

**During `/sniper-init`:**
1. If `domain_pack` is set in config, resolve each pack name to a package
2. For each pack, read `pack.yaml` (or fall back to knowledge-only loading)
3. Copy pack content to `.sniper/` in a namespaced structure:
   - `.sniper/packs/{pack-name}/personas/`
   - `.sniper/packs/{pack-name}/checklists/`
   - `.sniper/packs/{pack-name}/templates/`
   - `.sniper/packs/{pack-name}/workflows/`
4. Merge pack knowledge into the main knowledge context

**During command execution:**
1. Framework loads its own content from `.sniper/` as normal
2. Then scans `.sniper/packs/*/` for additional content
3. Personas, checklists, templates, and workflows are merged per the rules above

### 8. CLI Changes

**`sniper init`:**
- Gains a `--pack {name}` flag (can be specified multiple times)
- Pack selection is also available interactively during init
- Validates pack compatibility during init

**`sniper status`:**
- Shows loaded packs and their content counts:

```
Domain Packs:
  saas (v1.2.0)        3 knowledge, 1 persona, 2 checklists
  healthcare (v1.0.0)  4 knowledge, 2 personas, 3 checklists, 1 workflow
```

### 9. `/sniper-status` Integration

Status should show loaded packs with content inventory, as shown above.

### 10. Updating the Example Pack

Update `packages/pack-sales-dialer` to use the new structure:
1. Add `pack.yaml` manifest
2. Move existing knowledge files to `knowledge/` subdirectory (if not already there)
3. Add at least one domain-specific persona (e.g., `telephony-specialist.md`)
4. Add at least one domain-specific checklist (e.g., `telephony-review.md`)
5. Add a story addendum template with sales-dialer-specific sections

This serves as the reference implementation for pack authors.

## Acceptance Criteria

1. **Given** a pack with `pack.yaml`, **When** `/sniper-init --pack healthcare` runs, **Then** pack content is scaffolded to `.sniper/packs/healthcare/`.

2. **Given** a pack with domain personas, **When** `/sniper-compose` runs, **Then** pack personas appear alongside framework personas as composition options.

3. **Given** a pack with domain checklists, **When** `/sniper-review` runs, **Then** both framework and pack checklists are evaluated.

4. **Given** a pack with template addendums, **When** a story is generated, **Then** the story includes the pack's addendum sections.

5. **Given** `domain_pack: [saas, healthcare]` in config, **When** commands run, **Then** content from both packs is loaded and merged.

6. **Given** two packs with conflicting persona names, **When** loaded, **Then** the later pack wins and a warning is printed.

7. **Given** a pack without `pack.yaml`, **When** loaded, **Then** it falls back to knowledge-only loading (backward compatible).

## Implementation Scope

### In Scope
- `pack.yaml` manifest format and parser
- Domain-specific personas (overlay model)
- Domain-specific checklists (additive model)
- Domain-specific template extensions (addendum model)
- Domain-specific workflows (injection model)
- Pack stacking with conflict resolution
- Pack discovery and loading during init
- CLI `--pack` flag for init
- Updated `pack-sales-dialer` as reference implementation
- `/sniper-status` pack display

### Out of Scope
- Pack registry or marketplace (packs are npm packages, discovered via npm)
- Pack versioning constraints (semver compatibility checking)
- Pack auto-update mechanism
- Pack creation wizard / scaffolding CLI
- Runtime pack switching (requires re-init)
- Pack-specific command definitions (packs cannot add new slash commands)

## Files Changed

| File | Change |
|------|--------|
| `packages/core/framework/config.template.yaml` | UPDATE — `domain_pack` field supports array, add pack loading docs |
| `packages/core/framework/commands/sniper-init.md` | UPDATE — add `--pack` flag handling and pack scaffolding |
| `packages/core/framework/commands/sniper-status.md` | UPDATE — show loaded packs |
| `packages/core/framework/commands/sniper-compose.md` | UPDATE — include pack personas in composition |
| `packages/core/framework/commands/sniper-review.md` | UPDATE — merge pack checklists into review gates |
| `packages/cli/src/commands/init.ts` | UPDATE — add `--pack` flag, pack discovery, pack scaffolding |
| `packages/cli/src/pack-manager/` | UPDATE — extend to handle new pack content types |
| `packages/pack-sales-dialer/pack/pack.yaml` | NEW — manifest file |
| `packages/pack-sales-dialer/pack/personas/process/telephony-specialist.md` | NEW — example domain persona |
| `packages/pack-sales-dialer/pack/checklists/telephony-review.md` | NEW — example domain checklist |
| `packages/pack-sales-dialer/pack/templates/story-addendum.md` | NEW — example story addendum |
