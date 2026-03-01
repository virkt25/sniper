# @sniper.ai/mcp-knowledge

[![npm version](https://img.shields.io/npm/v/@sniper.ai/mcp-knowledge)](https://www.npmjs.com/package/@sniper.ai/mcp-knowledge)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[MCP](https://modelcontextprotocol.io) server for domain knowledge indexing and retrieval in [SNIPER](https://sniperai.dev)-enabled projects. Indexes Markdown knowledge files from `.sniper/knowledge/` and exposes them to Claude Code agents via search, list, and get tools.

## Installation

```bash
npm install @sniper.ai/mcp-knowledge
```

## Usage

Add the server to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "sniper-knowledge": {
      "command": "npx",
      "args": ["sniper-mcp-knowledge"]
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SNIPER_KNOWLEDGE_DIR` | `.sniper/knowledge` | Path to the knowledge files directory (must be within the project) |

## MCP Tools

The server exposes three tools to Claude Code agents:

### `knowledge_search`

Search the knowledge base using a text query. Returns matching entries ranked by relevance.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query` | Yes | Search query |
| `max_results` | No | Maximum number of results (default: 10) |
| `max_tokens` | No | Maximum total tokens in results (default: 4000) |

### `knowledge_list`

List all knowledge entries, optionally filtered by topic.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `topic` | No | Filter entries by topic |

### `knowledge_get`

Get a specific knowledge entry by its ID.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Entry ID |

## MCP Resources

| URI | Description |
|-----|-------------|
| `sniper-knowledge://topics` | List all topics in the knowledge base |
| `sniper-knowledge://entry/{id}` | Get a specific knowledge entry |

## How It Works

1. On first query, the server indexes all Markdown files in the knowledge directory
2. The index is cached to `knowledge-index.json` in the knowledge directory
3. When source files change, the index is automatically rebuilt
4. Agents can search, list, and retrieve domain knowledge entries at runtime

## Development

```bash
# From the monorepo root
pnpm build          # Build
pnpm dev            # Watch mode
```

## Documentation

Full documentation is available at [sniperai.dev](https://sniperai.dev).

## License

MIT
