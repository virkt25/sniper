# SNIPER

**Spawn, Navigate, Implement, Parallelize, Evaluate, Release**

SNIPER is a framework for orchestrating Claude Code agent teams through structured project lifecycle phases. It provides personas, team compositions, workflows, and slash commands that coordinate parallel AI agents to build software from discovery through deployment.

## How It Works

SNIPER breaks projects into phases, each driven by a slash command that spawns a coordinated team of AI agents:

1. **Discover** (`/sniper-discover`) — Parallel agents analyze requirements, codebase, and constraints
2. **Plan** (`/sniper-plan`) — Architects and specialists produce PRDs, architecture docs, and tech specs
3. **Solve** (`/sniper-solve`) — Shards work into epics and stories with clear acceptance criteria
4. **Sprint** (`/sniper-sprint`) — Parallel implementation teams build, test, and integrate
5. **Review** (`/sniper-review`) — Quality gates validate phase outputs before advancing

Each agent is composed from layered personas (cognitive style, process role, technical expertise, domain knowledge) and assigned specific tasks with file ownership boundaries.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@sniper.ai/core`](packages/core) | `@sniper.ai/core` | Framework content — personas, teams, templates, checklists, workflows, and spawn prompts |
| [`@sniper.ai/cli`](packages/cli) | `@sniper.ai/cli` | CLI tool — scaffolds and manages SNIPER-enabled projects |
| [`@sniper.ai/pack-sales-dialer`](packages/pack-sales-dialer) | `@sniper.ai/pack-sales-dialer` | Example domain pack — sales dialer SaaS domain knowledge |

## Quick Start

```bash
# Install the CLI
npm install -g @sniper.ai/cli

# Initialize SNIPER in your project
cd your-project
sniper init

# Start the lifecycle
# (use slash commands in Claude Code)
/sniper-discover
/sniper-plan
/sniper-solve
/sniper-sprint
```

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Setup

```bash
git clone https://github.com/sniperai/sniper.git
cd sniper
pnpm install
pnpm build
```

### Commands

```bash
pnpm build          # Build all packages
pnpm dev            # Watch mode for all packages
pnpm clean          # Clean dist directories
pnpm lint           # Lint all packages
pnpm changeset      # Create a changeset for versioning
pnpm release        # Build + publish with changesets
```

### Project Structure

```
sniper/
├── packages/
│   ├── core/               # Framework content (YAML/Markdown)
│   │   └── framework/
│   │       ├── personas/   # Agent persona layers
│   │       ├── teams/      # Team compositions per phase
│   │       ├── workflows/  # Phase workflow definitions
│   │       ├── templates/  # Artifact templates (PRD, arch, stories)
│   │       ├── checklists/ # Quality gate checklists
│   │       ├── spawn-prompts/
│   │       └── commands/   # Slash command definitions
│   ├── cli/                # CLI tool (sniper binary)
│   │   └── src/
│   │       ├── commands/   # CLI subcommands
│   │       ├── scaffolder.ts
│   │       └── pack-manager.ts
│   └── pack-sales-dialer/  # Example domain pack
│       └── pack/
│           ├── pack.yaml
│           ├── context/    # Domain knowledge files
│           └── suggested-epics.md
├── docs/
└── plans/
```

## Domain Packs

Domain packs inject project-specific knowledge into SNIPER agents. They provide context files (telephony, CRM, compliance, etc.) that agents reference during planning and implementation. See [`@sniper.ai/pack-sales-dialer`](packages/pack-sales-dialer) for an example.

```bash
sniper add-pack @sniper.ai/pack-sales-dialer
```

## License

MIT
