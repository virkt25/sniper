---
title: Domain Packs
description: Inject business domain knowledge into agent personas with domain packs
---

# Domain Packs

Domain packs inject industry-specific knowledge into SNIPER agents. They provide context that general-purpose agents lack -- telephony protocols, compliance regulations, CRM integration patterns, and other domain expertise.

## What Packs Provide

A domain pack can include any combination of:

| Content Type | Purpose |
|-------------|---------|
| **Knowledge files** | Industry-specific context injected into agent prompts |
| **Personas** | Domain-specific process personas (e.g., telephony specialist) |
| **Checklists** | Additional review gate criteria for domain concerns |
| **Templates** | Domain-specific artifact templates or addenda |
| **Team overrides** | Extra teammates added to standard phase teams |
| **Config defaults** | Recommended configuration changes |

## Using a Pack

### Installation

Install the pack as an npm dependency:

```bash
pnpm add @sniper.ai/pack-sales-dialer
```

### Registration

Register the pack in `.sniper/config.yaml`:

```yaml
domain_packs:
  - name: "sales-dialer"
    package: "@sniper.ai/pack-sales-dialer"
```

Or during `/sniper-init`, specify the domain pack when prompted.

### How Packs Are Loaded

When a phase command runs:

1. SNIPER reads the pack's `pack.yaml` manifest
2. Knowledge files are loaded as domain context for agent prompts
3. Pack personas are discovered and made available for composition
4. Pack checklists are appended to phase review gates
5. Team overrides add extra teammates to standard teams

## Pack Structure

A domain pack is an npm package with a `pack/` directory:

```
pack-sales-dialer/
  package.json
  pack/
    pack.yaml                     # Pack manifest
    knowledge/                    # Domain knowledge files
      telephony.md
      sales-workflows.md
      compliance.md
      crm-integration.md
      ai-pipeline.md
      analytics.md
    personas/
      process/
        telephony-specialist.md   # Domain-specific process persona
    checklists/
      telephony-review.md        # Domain-specific review criteria
    templates/
      story-addendum.md          # Domain-specific story additions
```

### package.json

The pack's `package.json` must include the `sniper` field:

```json
{
  "name": "@sniper.ai/pack-sales-dialer",
  "version": "1.0.0",
  "sniper": {
    "type": "domain-pack",
    "packDir": "pack"
  },
  "files": ["pack"]
}
```

### pack.yaml

The manifest declares what the pack provides:

```yaml
name: sales-dialer
version: 1.1.0
description: "AI-powered sales dialer SaaS"

provides:
  knowledge:
    - knowledge/telephony.md
    - knowledge/sales-workflows.md
    - knowledge/compliance.md
    - knowledge/crm-integration.md
    - knowledge/ai-pipeline.md
    - knowledge/analytics.md
  personas:
    - personas/process/telephony-specialist.md
  checklists:
    - checklists/telephony-review.md
  templates:
    - templates/story-addendum.md

default_context: sales-workflows

compatible_with:
  - saas
  - api
conflicts_with: []

config_defaults:
  review_gates:
    after_plan: strict

team_overrides:
  plan:
    extra_teammates:
      - name: compliance-analyst
        compose:
          process: architect
          technical: security
          cognitive: security-first
          domain: compliance
        tasks:
          - id: compliance-reqs
            name: "Regulatory Compliance Requirements"
            output: "docs/compliance.md"
            blocked_by: [prd]
```

## Creating a Domain Pack

### Step 1: Set Up the Package

```bash
mkdir my-domain-pack
cd my-domain-pack
pnpm init
mkdir -p pack/knowledge pack/personas/process pack/checklists pack/templates
```

### Step 2: Write Knowledge Files

Create markdown files in `pack/knowledge/` covering your domain:

```markdown
# Telephony Domain Knowledge

## Protocols
- SIP (Session Initiation Protocol) for call setup/teardown
- RTP (Real-time Transport Protocol) for media
- WebRTC for browser-based calling

## Key Concepts
- Power dialer: sequential dialing with predictive pacing
- Progressive dialer: dials next number when agent becomes available
...
```

### Step 3: Create the Manifest

Write `pack/pack.yaml` listing all provided content with compatibility and override information.

### Step 4: Add Custom Personas (Optional)

If your domain needs specialized roles, add process persona files in `pack/personas/process/`:

```markdown
# Telephony Specialist (Process Layer)

## Role
You are the Telephony Integration Specialist...

## Responsibilities
1. Design call flow architectures
2. Evaluate SIP/WebRTC provider options
...
```

### Step 5: Add Checklists (Optional)

Add domain-specific review criteria in `pack/checklists/`:

```markdown
# Telephony Review Checklist

- [ ] Call recording complies with two-party consent laws
- [ ] TCPA compliance verified for automated dialing
- [ ] SIP trunk failover strategy documented
...
```

### Step 6: Publish

```bash
npm publish --access public
```

## Pack Stacking

Multiple packs can be active simultaneously. The `conflicts_with` field in `pack.yaml` declares incompatible packs. SNIPER warns if conflicting packs are loaded together.

Pack content is additive -- knowledge files are merged, checklists are appended, and team overrides add teammates without replacing existing ones.

## Next Steps

- [Personas](/guide/personas) -- how pack personas extend the framework
- [Review Gates](/guide/review-gates) -- how pack checklists integrate
- [Configuration](/guide/configuration) -- registering packs in config.yaml
