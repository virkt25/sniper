import type { KnowledgeIndex, SearchResult } from "./types.js";

export function searchKnowledge(
  index: KnowledgeIndex,
  query: string,
  maxResults: number = 10,
  maxTokens: number = 4000,
): SearchResult[] {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (queryWords.length === 0) return [];

  const scored: SearchResult[] = [];

  for (const entry of index.entries) {
    let score = 0;
    const topicLower = entry.topic.toLowerCase();
    const contentLower = entry.content.toLowerCase();
    const tagsLower = entry.tags.map((t) => t.toLowerCase());

    for (const word of queryWords) {
      // Topic match (highest weight)
      if (topicLower.includes(word)) score += 3;
      // Tag match
      if (tagsLower.some((t) => t.includes(word))) score += 2;
      // Content match
      if (contentLower.includes(word)) score += 1;
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Truncate to maxResults and maxTokens
  const results: SearchResult[] = [];
  let tokenCount = 0;

  for (const result of scored) {
    if (results.length >= maxResults) break;
    if (tokenCount + result.entry.tokens > maxTokens) break;
    results.push(result);
    tokenCount += result.entry.tokens;
  }

  return results;
}
