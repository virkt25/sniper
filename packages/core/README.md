# @sniper.ai/core

Framework core for SNIPER — provides personas, team compositions, templates, checklists, workflows, and spawn prompts as raw YAML and Markdown files.

## Overview

This package contains no executable code. It ships the framework content that the CLI scaffolds into target projects and that Claude Code agents consume at runtime. Everything lives in the `framework/` directory.

## Installation

```bash
npm install @sniper.ai/core
```

## Contents

```
framework/
├── personas/           # Agent persona layers
│   ├── cognitive/      # Thinking styles (analytical, creative, security-first, etc.)
│   ├── domain/         # Domain knowledge (from packs or built-in)
│   ├── process/        # Process roles (architect, implementer, reviewer, etc.)
│   └── technical/      # Technical expertise (frontend, backend, infra, etc.)
├── teams/              # Team compositions per phase
│   ├── discover.yaml   # Discovery phase team
│   ├── plan.yaml       # Planning phase team
│   ├── solve.yaml      # Story sharding (sequential)
│   ├── sprint.yaml     # Implementation sprint team
│   └── doc.yaml        # Documentation team
├── workflows/          # Phase workflow definitions
│   ├── full-lifecycle.md
│   ├── discover-only.md
│   ├── quick-feature.md
│   └── sprint-cycle.md
├── templates/          # Artifact templates (PRD, architecture, stories, etc.)
├── checklists/         # Quality gate checklists for review
├── spawn-prompts/      # Pre-composed spawn prompts for agent roles
├── commands/           # Slash command definitions
├── config.template.yaml
├── claude-md.template
└── settings.template.json
```

## Usage

Import framework files directly via the `./framework/*` export:

```js
import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Resolve the path to a framework file
const require = createRequire(import.meta.url);
const teamPath = require.resolve('@sniper.ai/core/framework/teams/sprint.yaml');
const teamYaml = readFileSync(teamPath, 'utf-8');
```

## Persona Layers

Agents are composed from four persona layers:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Cognitive** | Thinking style and approach | `analytical`, `security-first` |
| **Process** | Role in the workflow | `architect`, `implementer`, `reviewer` |
| **Technical** | Technical expertise area | `frontend`, `backend`, `infra` |
| **Domain** | Project-specific knowledge | Provided by domain packs |

The `/sniper-compose` command combines these layers into a complete spawn prompt for an agent.

## License

MIT
