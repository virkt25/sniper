---
title: Custom Protocols
description: Create, validate, and manage custom protocol YAML files for specialized workflows
---

# Custom Protocols

SNIPER ships with 7 built-in protocols (`full`, `feature`, `patch`, `ingest`, `explore`, `refactor`, `hotfix`). You can define your own protocols to model workflows specific to your team or domain.

## Built-in Protocols

| Protocol | Phases | Use Case |
|----------|--------|----------|
| `full` | discover → plan → implement → review | Complete greenfield lifecycle |
| `feature` | plan → implement → review | Incremental feature development |
| `patch` | implement → review | Bug fixes and small changes |
| `ingest` | scan → document → extract | Reverse-engineer an existing codebase |
| `explore` | discover | Exploratory research and analysis |
| `refactor` | analyze → implement → review | Code improvement without new features |
| `hotfix` | implement | Critical emergency fix, relaxed gates |

## Creating a Custom Protocol

### Using the CLI

```bash
sniper protocol create my-protocol
```

The CLI prompts you for:

1. **Description** -- what the protocol does
2. **Phases** -- which phases to include

This generates a YAML file at `.sniper/protocols/my-protocol.yaml`.

### Manual Creation

Create a YAML file following this structure:

```yaml
name: api-review
description: Focused API contract review for microservices

phases:
  - name: analyze
    description: Analyze API contracts and identify issues
    agents:
      - architect
      - code-reviewer
    spawn_strategy: team
    gate:
      checklist: plan
      human_approval: false

  - name: report
    description: Produce review report with recommendations
    agents:
      - code-reviewer
    spawn_strategy: single
    gate:
      checklist: review
      human_approval: true

outputs:
  - docs/api-review.md
  - docs/api-recommendations.md
```

### Protocol Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Unique protocol identifier |
| `description` | string | yes | What the protocol does |
| `phases` | array | yes | Ordered list of phase definitions |
| `phases[].name` | string | yes | Phase identifier |
| `phases[].description` | string | yes | What this phase produces |
| `phases[].agents` | array | yes | Agent definitions for this phase |
| `phases[].spawn_strategy` | string | yes | `single` (one agent) or `team` (multiple agents) |
| `phases[].gate` | object | no | Gate configuration |
| `phases[].gate.checklist` | string | no | Which checklist to evaluate |
| `phases[].gate.human_approval` | boolean | no | Whether human must approve gate results |
| `outputs` | array | no | Expected output file paths |

## Managing Protocols

### List All Protocols

```bash
sniper protocol list
```

Shows both built-in protocols (from `@sniper.ai/core`) and custom protocols (from `.sniper/protocols/`).

### Validate a Protocol

```bash
sniper protocol validate my-protocol
```

Checks your protocol YAML against the schema and reports errors:

- Missing required fields (`name`, `description`, `phases`)
- Empty phases array
- Invalid spawn strategy (must be `single` or `team`)
- Invalid gate configuration (human_approval must be boolean)

## Using Custom Protocols

### With `/sniper-flow`

```
/sniper-flow --protocol my-protocol
```

### With Headless Mode

```bash
sniper run my-protocol --auto-approve
```

### In Trigger Tables

Map file patterns to your custom protocol:

```yaml
# .sniper/config.yaml
triggers:
  - pattern: "src/api/**/*.ts"
    protocol: api-review
  - pattern: "*.proto"
    protocol: api-review
```

## Examples

### Documentation Protocol

```yaml
name: doc-refresh
description: Regenerate and review project documentation

phases:
  - name: analyze
    description: Audit existing docs for staleness
    agents:
      - analyst
    spawn_strategy: single
    gate:
      checklist: discover
      human_approval: false

  - name: write
    description: Update documentation
    agents:
      - analyst
      - architect
    spawn_strategy: team
    gate:
      checklist: review
      human_approval: false

outputs:
  - README.md
  - docs/architecture.md
  - docs/api.md
```

### Security Audit Protocol

```yaml
name: security-deep
description: Deep security audit with threat modeling and pen-test planning

phases:
  - name: threat-model
    description: STRIDE threat modeling
    agents:
      - architect
    spawn_strategy: single
    gate:
      checklist: review
      human_approval: true

  - name: scan
    description: Automated vulnerability scanning
    agents:
      - code-reviewer
    spawn_strategy: single
    gate:
      checklist: review
      human_approval: true

  - name: report
    description: Consolidated security report
    agents:
      - architect
    spawn_strategy: single

outputs:
  - docs/security/threat-model.md
  - docs/security/vulnerabilities.md
  - docs/security/remediation-plan.md
```

## Next Steps

- [Configuration](/guide/configuration) -- configure protocol routing and trigger tables
- [Review Gates](/guide/review-gates) -- customize gate behavior for your protocols
- [Headless & CI/CD](/guide/headless-ci) -- run custom protocols in pipelines
