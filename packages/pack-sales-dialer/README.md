# @sniper.ai/pack-sales-dialer

[![npm version](https://img.shields.io/npm/v/@sniper.ai/pack-sales-dialer)](https://www.npmjs.com/package/@sniper.ai/pack-sales-dialer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

SNIPER domain pack for AI-powered sales dialer SaaS projects. Provides domain knowledge context files that [SNIPER](https://sniperai.dev/) agents reference during planning and implementation.

> **SNIPER** is an AI-powered project lifecycle framework that orchestrates Claude Code agent teams through structured phases. Domain packs inject project-specific knowledge into agent personas so teams can reason about your domain during discovery, planning, and implementation.

## Installation

```bash
sniper add-pack @sniper.ai/pack-sales-dialer
```

## Domain Contexts

This pack provides six context files covering the key domains of a sales dialer platform:

| Context | Description |
|---------|-------------|
| `telephony` | Twilio, WebRTC, call routing, SIP trunking |
| `sales-workflows` | Dialer types, cadences, dispositions, lead management |
| `compliance` | TCPA, DNC lists, recording consent, regulatory requirements |
| `crm-integration` | Salesforce, HubSpot, Follow Up Boss API integration |
| `ai-pipeline` | STT, sentiment analysis, AI coaching, call scoring (OpenAI Realtime API) |
| `analytics` | Call metrics, dashboards, KPIs, reporting |

## Team Overrides

The pack adds a **compliance-analyst** agent to the planning phase, ensuring regulatory requirements (TCPA, DNC, recording consent) are addressed early in the project lifecycle.

## Usage in SNIPER Lifecycle

Domain packs integrate at multiple points in the SNIPER lifecycle:

- **Persona Composition.** When `/sniper-compose` builds agent spawn prompts, domain pack contexts are injected into the domain persona layer. This gives agents specialized knowledge about your project's domain.
- **Discovery Phase.** During `/sniper-discover`, the analyst and risk-researcher agents reference domain contexts to produce informed briefs and risk assessments (e.g., identifying TCPA compliance as a risk area).
- **Planning Phase.** During `/sniper-plan`, the architect and PM agents use domain knowledge to make technology choices grounded in real constraints (e.g., selecting Twilio for telephony, designing around WebRTC latency).
- **Story Sharding.** During `/sniper-solve`, the scrum master can reference `suggested-epics.md` from the pack for pre-defined epic structures tailored to the domain.
- **Implementation.** During `/sniper-sprint`, developers have domain context available for making implementation decisions aligned with industry standards.

## Pack Structure

```
pack/
├── pack.yaml           # Pack manifest (contexts, team overrides)
├── context/            # Domain knowledge files
│   ├── telephony.md
│   ├── sales-workflows.md
│   ├── compliance.md
│   ├── crm-integration.md
│   ├── ai-pipeline.md
│   └── analytics.md
└── suggested-epics.md  # Pre-defined epics for sales dialer projects
```

## Creating Your Own Domain Pack

Use this package as a template for building domain packs for your own projects. A domain pack requires three things:

### 1. Package manifest

Add a `sniper` field to your `package.json`:

```json
{
  "name": "@your-org/pack-your-domain",
  "sniper": {
    "type": "domain-pack",
    "packDir": "pack"
  }
}
```

### 2. Pack definition

Create a `pack/pack.yaml` manifest declaring your domain contexts and optional team overrides:

```yaml
contexts:
  - name: your-context
    file: context/your-context.md
    description: "Brief description of this domain area"

team_overrides:
  plan:
    add:
      - name: your-specialist
        compose:
          cognitive: analytical
          process: analyst
          technical: backend
```

### 3. Context files

Create a `pack/context/` directory with Markdown files for each domain area. These files contain the domain knowledge that agents will reference -- technology constraints, API details, compliance requirements, industry terminology, and architectural patterns.

### 4. Register with SNIPER

Domain packs are registered in `.sniper/config.yaml`:

```yaml
domain_packs:
  - name: "your-domain"
    package: "@your-org/pack-your-domain"
```

Or install via the CLI:

```bash
sniper add-pack @your-org/pack-your-domain
```

## Documentation

Full documentation is available at [sniperai.dev](https://sniperai.dev/).

## License

MIT
