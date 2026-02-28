export interface KnowledgeEntry {
  id: string;
  topic: string;
  content: string;
  tokens: number;
  tags: string[];
  source_file: string;
  heading: string;
}

export interface KnowledgeIndex {
  entries: KnowledgeEntry[];
  indexed_at: string;
  total_tokens: number;
}

export interface SearchResult {
  entry: KnowledgeEntry;
  score: number;
}
