# @sniper.ai/pack-sales-dialer

SNIPER domain pack for AI-powered sales dialer SaaS projects. Provides domain knowledge context files that SNIPER agents reference during planning and implementation.

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

Use this package as a template. A domain pack needs:

1. A `pack.yaml` manifest declaring contexts and optional team overrides
2. A `context/` directory with Markdown files for each domain area
3. A `"sniper": { "type": "domain-pack", "packDir": "pack" }` field in `package.json`

## License

MIT
