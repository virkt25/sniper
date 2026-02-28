import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { sniperConfigExists } from "../config.js";
import { pathExists } from "../fs-utils.js";

const KNOWLEDGE_DIR = ".sniper/knowledge";
const INDEX_FILENAME = "knowledge-index.json";

interface KnowledgeIndex {
  entries: Array<{
    id: string;
    topic: string;
    tokens: number;
    source_file: string;
    heading: string;
  }>;
  indexed_at: string;
  total_tokens: number;
}

const indexSubcommand = defineCommand({
  meta: {
    name: "index",
    description: "Index the SNIPER knowledge base",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const knowledgeDir = join(cwd, KNOWLEDGE_DIR);

    if (!(await pathExists(knowledgeDir))) {
      p.log.error(
        `Knowledge directory not found: ${KNOWLEDGE_DIR}\nCreate it and add .md files to index.`,
      );
      process.exit(1);
    }

    const s = p.spinner();
    s.start("Indexing knowledge base...");

    try {
      // Dynamic import to avoid hard dependency on mcp-knowledge package
      const { indexKnowledgeDir, writeIndex } = await import(
        "@sniper.ai/mcp-knowledge/indexer"
      );
      const index = await indexKnowledgeDir(knowledgeDir);
      const indexPath = join(knowledgeDir, INDEX_FILENAME);
      await writeIndex(indexPath, index);

      s.stop("Done!");
      p.log.success(`Indexed ${index.entries.length} entries`);
      p.log.info(`Total tokens: ${index.total_tokens.toLocaleString()}`);
      p.log.info(`Index written to: ${KNOWLEDGE_DIR}/${INDEX_FILENAME}`);
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Indexing failed: ${err}`);
      process.exit(1);
    }
  },
});

const statusSubcommand = defineCommand({
  meta: {
    name: "status",
    description: "Show knowledge base status",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const indexPath = join(cwd, KNOWLEDGE_DIR, INDEX_FILENAME);

    if (!(await pathExists(indexPath))) {
      p.log.warn(
        'Knowledge base has not been indexed yet. Run "sniper knowledge index" first.',
      );
      return;
    }

    try {
      const raw = await readFile(indexPath, "utf-8");
      const index: KnowledgeIndex = JSON.parse(raw);

      const topics = [...new Set(index.entries.map((e) => e.topic))];

      p.log.step("Knowledge Base Status:");
      console.log(`  Entries:      ${index.entries.length}`);
      console.log(`  Topics:       ${topics.length}`);
      console.log(
        `  Total tokens: ${index.total_tokens.toLocaleString()}`,
      );
      console.log(`  Last indexed: ${index.indexed_at}`);

      if (topics.length > 0) {
        p.log.step("Topics:");
        for (const topic of topics.slice(0, 20)) {
          const count = index.entries.filter((e) => e.topic === topic).length;
          console.log(`  - ${topic} (${count} entries)`);
        }
        if (topics.length > 20) {
          console.log(`  ... and ${topics.length - 20} more`);
        }
      }
    } catch (err) {
      p.log.error(`Failed to read index: ${err}`);
      process.exit(1);
    }
  },
});

export const knowledgeCommand = defineCommand({
  meta: {
    name: "knowledge",
    description: "Manage SNIPER knowledge base",
  },
  subCommands: {
    index: indexSubcommand,
    status: statusSubcommand,
  },
});
