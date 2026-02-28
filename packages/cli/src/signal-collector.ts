import { readFile, writeFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";
import { ensureDir, pathExists } from "./fs-utils.js";

export interface Signal {
  type: "ci_failure" | "pr_review_comment" | "production_error" | "manual";
  source: string;
  timestamp: string;
  summary: string;
  details?: string;
  learning?: string;
  relevance_tags?: string[];
  affected_files?: string[];
}

const SIGNAL_DIR = ".sniper/memory/signals";

export function getSignalDir(cwd: string): string {
  return join(cwd, SIGNAL_DIR);
}

function signalFilename(signal: Signal): string {
  const date = new Date(signal.timestamp);
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const ts = Math.floor(date.getTime() / 1000);
  return `${dateStr}-${signal.type}-${ts}.yaml`;
}

export async function ingestSignal(
  cwd: string,
  signal: Signal,
): Promise<string> {
  const dir = getSignalDir(cwd);
  await ensureDir(dir);

  const filename = signalFilename(signal);
  const filepath = join(dir, filename);
  const content = YAML.stringify(signal, { lineWidth: 0 });
  await writeFile(filepath, content, "utf-8");

  return filename;
}

export async function ingestFromPR(
  cwd: string,
  prNumber: number,
): Promise<Signal[]> {
  const raw = execFileSync("gh", [
    "pr",
    "view",
    prNumber.toString(),
    "--json",
    "comments,reviews,title",
  ], { cwd, encoding: "utf-8" });

  const prData = JSON.parse(raw) as {
    title: string;
    comments: Array<{ body: string; author: { login: string }; createdAt: string }>;
    reviews: Array<{ body: string; author: { login: string }; state: string; submittedAt: string }>;
  };

  const signals: Signal[] = [];

  for (const review of prData.reviews) {
    if (!review.body) continue;

    const signal: Signal = {
      type: "pr_review_comment",
      source: `pr-${prNumber}`,
      timestamp: review.submittedAt,
      summary: `PR #${prNumber} review (${review.state}) by ${review.author.login}`,
      details: review.body,
      relevance_tags: ["pr-review", review.state.toLowerCase()],
    };
    const filename = await ingestSignal(cwd, signal);
    signals.push(signal);
  }

  for (const comment of prData.comments) {
    const signal: Signal = {
      type: "pr_review_comment",
      source: `pr-${prNumber}`,
      timestamp: comment.createdAt,
      summary: `PR #${prNumber} comment by ${comment.author.login}`,
      details: comment.body,
      relevance_tags: ["pr-comment"],
    };
    await ingestSignal(cwd, signal);
    signals.push(signal);
  }

  return signals;
}

export async function listSignals(
  cwd: string,
  options?: { type?: string; limit?: number },
): Promise<Signal[]> {
  const dir = getSignalDir(cwd);

  if (!(await pathExists(dir))) {
    return [];
  }

  const files = await readdir(dir);
  const yamlFiles = files.filter((f) => f.endsWith(".yaml"));

  const signals: Signal[] = [];
  for (const file of yamlFiles) {
    const raw = await readFile(join(dir, file), "utf-8");
    const signal = YAML.parse(raw) as Signal;
    signals.push(signal);
  }

  let filtered = signals;
  if (options?.type) {
    filtered = filtered.filter((s) => s.type === options.type);
  }

  filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export async function getRelevantSignals(
  cwd: string,
  affectedFiles: string[],
  tags: string[],
): Promise<Signal[]> {
  const all = await listSignals(cwd);

  const scored = all.map((signal) => {
    let score = 0;

    if (signal.affected_files) {
      for (const file of signal.affected_files) {
        if (affectedFiles.some((af) => af.includes(file) || file.includes(af))) {
          score += 2;
        }
      }
    }

    if (signal.relevance_tags) {
      for (const tag of signal.relevance_tags) {
        if (tags.includes(tag)) {
          score += 1;
        }
      }
    }

    return { signal, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.signal);
}

export async function clearSignals(cwd: string): Promise<number> {
  const dir = getSignalDir(cwd);

  if (!(await pathExists(dir))) {
    return 0;
  }

  const files = await readdir(dir);
  const yamlFiles = files.filter((f) => f.endsWith(".yaml"));

  for (const file of yamlFiles) {
    await rm(join(dir, file));
  }

  return yamlFiles.length;
}
