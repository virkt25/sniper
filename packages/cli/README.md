# @sniperai/cli

CLI tool for scaffolding and managing SNIPER-enabled projects.

## Installation

```bash
npm install -g @sniperai/cli
```

## Commands

### `sniper init`

Initialize SNIPER in the current project. Scaffolds the `.sniper/` config directory, installs framework files, and sets up Claude Code slash commands.

```bash
sniper init
```

### `sniper status`

Show the current lifecycle phase, artifact state, and team status.

```bash
sniper status
```

### `sniper update`

Update the scaffolded framework files to the latest version from `@sniperai/core`.

```bash
sniper update
```

### `sniper add-pack <pack>`

Install a domain pack to inject project-specific context into agents.

```bash
sniper add-pack @sniperai/pack-sales-dialer
```

### `sniper remove-pack <pack>`

Remove an installed domain pack.

```bash
sniper remove-pack @sniperai/pack-sales-dialer
```

### `sniper list-packs`

List all installed domain packs.

```bash
sniper list-packs
```

## How It Works

The CLI reads framework content from `@sniperai/core` and scaffolds it into your project's `.sniper/` directory. This gives Claude Code access to personas, team definitions, templates, and slash commands that drive the SNIPER lifecycle.

## Tech Stack

- **Runtime:** Node.js >= 18
- **CLI framework:** [citty](https://github.com/unjs/citty)
- **Prompts:** [@clack/prompts](https://github.com/bombshell-dev/clack)
- **YAML parsing:** [yaml](https://github.com/eemeli/yaml)
- **Build:** [tsup](https://github.com/egoist/tsup)

## Development

```bash
# From the monorepo root
pnpm dev    # Watch mode
pnpm build  # Production build
```

## License

MIT
