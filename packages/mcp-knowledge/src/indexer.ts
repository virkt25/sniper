import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
import type { KnowledgeEntry, KnowledgeIndex } from "./types.js";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function generateId(sourceFile: string, heading: string): string {
  const hash = createHash("sha256")
    .update(`${sourceFile}:${heading}`)
    .digest("hex")
    .slice(0, 12);
  return hash;
}

function extractTags(content: string): string[] {
  const tags = new Set<string>();
  // Extract words that look like tags: backtick-wrapped terms and capitalized terms
  const backtickMatches = content.match(/`([^`]+)`/g);
  if (backtickMatches) {
    for (const match of backtickMatches.slice(0, 10)) {
      tags.add(match.replace(/`/g, "").toLowerCase());
    }
  }
  return [...tags];
}

function splitByHeadings(
  content: string,
  sourceFile: string,
): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  const sections = content.split(/^## /m);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const newlineIdx = trimmed.indexOf("\n");
    const heading =
      newlineIdx === -1 ? trimmed : trimmed.slice(0, newlineIdx).trim();
    const body = newlineIdx === -1 ? "" : trimmed.slice(newlineIdx + 1).trim();

    if (!heading) continue;

    const fullContent = body || heading;
    const tokens = estimateTokens(fullContent);
    const tags = extractTags(fullContent);
    const topic = heading
      .replace(/^#+\s*/, "")
      .trim()
      .toLowerCase();

    entries.push({
      id: generateId(sourceFile, heading),
      topic,
      content: fullContent,
      tokens,
      tags,
      source_file: sourceFile,
      heading,
    });
  }

  return entries;
}

export async function indexKnowledgeDir(
  dir: string,
): Promise<KnowledgeIndex> {
  const files = await readdir(dir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  const allEntries: KnowledgeEntry[] = [];

  for (const file of mdFiles) {
    const filePath = join(dir, file);
    const content = await readFile(filePath, "utf-8");
    const entries = splitByHeadings(content, basename(file));
    allEntries.push(...entries);
  }

  const totalTokens = allEntries.reduce((sum, e) => sum + e.tokens, 0);

  return {
    entries: allEntries,
    indexed_at: new Date().toISOString(),
    total_tokens: totalTokens,
  };
}

export async function writeIndex(
  indexPath: string,
  index: KnowledgeIndex,
): Promise<void> {
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

export async function readIndex(indexPath: string): Promise<KnowledgeIndex> {
  const raw = await readFile(indexPath, "utf-8");
  return JSON.parse(raw) as KnowledgeIndex;
}
