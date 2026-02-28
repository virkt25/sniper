import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { indexKnowledgeDir, readIndex, writeIndex } from "./indexer.js";
import { searchKnowledge } from "./search.js";
import type { KnowledgeIndex } from "./types.js";
import { join } from "node:path";
import { access, readdir, stat } from "node:fs/promises";

const INDEX_FILENAME = "knowledge-index.json";

async function getNewestMtime(dir: string): Promise<number> {
  let newest = 0;
  try {
    const files = await readdir(dir);
    for (const file of files) {
      const s = await stat(join(dir, file));
      if (s.mtimeMs > newest) newest = s.mtimeMs;
    }
  } catch {
    // Directory may not exist
  }
  return newest;
}

async function getIndex(knowledgeDir: string): Promise<KnowledgeIndex> {
  const indexPath = join(knowledgeDir, INDEX_FILENAME);
  try {
    await access(indexPath);
    // Check if any knowledge files are newer than the index
    const indexStat = await stat(indexPath);
    const newestFile = await getNewestMtime(knowledgeDir);
    if (newestFile > indexStat.mtimeMs) {
      // Index is stale, rebuild
      const index = await indexKnowledgeDir(knowledgeDir);
      await writeIndex(indexPath, index);
      return index;
    }
    return await readIndex(indexPath);
  } catch {
    // Index doesn't exist, build it
    const index = await indexKnowledgeDir(knowledgeDir);
    await writeIndex(indexPath, index);
    return index;
  }
}

export function createServer(): Server {
  const knowledgeDir =
    process.env.SNIPER_KNOWLEDGE_DIR || ".sniper/knowledge";

  const server = new Server(
    { name: "sniper-mcp-knowledge", version: "3.0.0" },
    { capabilities: { tools: {}, resources: {} } },
  );

  // ── Tools ──

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "knowledge_search",
        description:
          "Search the SNIPER knowledge base for relevant domain knowledge",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            max_results: {
              type: "number",
              description: "Maximum number of results (default: 10)",
            },
            max_tokens: {
              type: "number",
              description: "Maximum total tokens in results (default: 4000)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "knowledge_list",
        description: "List all knowledge entries, optionally filtered by topic",
        inputSchema: {
          type: "object" as const,
          properties: {
            topic: {
              type: "string",
              description: "Optional topic filter",
            },
          },
        },
      },
      {
        name: "knowledge_get",
        description: "Get a specific knowledge entry by ID",
        inputSchema: {
          type: "object" as const,
          properties: {
            id: {
              type: "string",
              description: "Entry ID",
            },
          },
          required: ["id"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const index = await getIndex(knowledgeDir);

      switch (name) {
        case "knowledge_search": {
          const query = args?.query as string;
          const maxResults = (args?.max_results as number) || 10;
          const maxTokens = (args?.max_tokens as number) || 4000;
          const results = searchKnowledge(index, query, maxResults, maxTokens);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  results.map((r) => ({
                    id: r.entry.id,
                    topic: r.entry.topic,
                    heading: r.entry.heading,
                    score: r.score,
                    tokens: r.entry.tokens,
                    content: r.entry.content,
                    source_file: r.entry.source_file,
                  })),
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "knowledge_list": {
          const topic = args?.topic as string | undefined;
          let entries = index.entries;
          if (topic) {
            const topicLower = topic.toLowerCase();
            entries = entries.filter((e) =>
              e.topic.toLowerCase().includes(topicLower),
            );
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  entries.map((e) => ({
                    id: e.id,
                    topic: e.topic,
                    heading: e.heading,
                    tokens: e.tokens,
                    source_file: e.source_file,
                  })),
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "knowledge_get": {
          const id = args?.id as string;
          const entry = index.entries.find((e) => e.id === id);
          if (!entry) {
            return {
              content: [
                { type: "text", text: `No entry found with ID: ${id}` },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(entry, null, 2),
              },
            ],
          };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // ── Resources ──

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "sniper-knowledge://topics",
        name: "Knowledge Topics",
        description: "List all topics in the knowledge base",
        mimeType: "application/json",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    const index = await getIndex(knowledgeDir);

    if (uri === "sniper-knowledge://topics") {
      const topics = [...new Set(index.entries.map((e) => e.topic))];
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(topics, null, 2),
          },
        ],
      };
    }

    // Handle sniper-knowledge://entry/{id}
    const entryMatch = uri.match(/^sniper-knowledge:\/\/entry\/(.+)$/);
    if (entryMatch) {
      const id = entryMatch[1];
      const entry = index.entries.find((e) => e.id === id);
      if (!entry) {
        throw new Error(`No entry found with ID: ${id}`);
      }
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(entry, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  return server;
}
