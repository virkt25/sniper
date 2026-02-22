import { readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import YAML from "yaml";

export interface SniperConfig {
  project: {
    name: string;
    type: string;
    description: string;
  };
  stack: {
    language: string;
    frontend: string | null;
    backend: string | null;
    database: string | null;
    cache: string | null;
    infrastructure: string | null;
    test_runner: string | null;
    package_manager: string;
  };
  review_gates: {
    after_discover: string;
    after_plan: string;
    after_solve: string;
    after_sprint: string;
  };
  agent_teams: {
    max_teammates: number;
    default_model: string;
    planning_model: string;
    delegate_mode: boolean;
    plan_approval: boolean;
    coordination_timeout: number;
  };
  domain_packs: Array<{ name: string; package: string }>;
  memory?: {
    enabled: boolean;
    auto_retro: boolean;
    auto_codify: boolean;
    token_budget: number;
  };
  workspace?: {
    enabled: boolean;
    workspace_path: string | null;
    repo_name: string | null;
  };
  ownership: Record<string, string[]>;
  state: {
    current_phase: string | null;
    phase_history: Array<{
      phase: string;
      started_at: string;
      completed_at?: string;
      approved_by?: string;
    }>;
    current_sprint: number;
    artifacts: Record<string, { status: string | null; version: number } | string | null>;
    retro_counter?: number;
    last_retro_sprint?: number;
  };
}

const CONFIG_PATH = ".sniper/config.yaml";

export async function sniperConfigExists(cwd: string): Promise<boolean> {
  try {
    await access(join(cwd, CONFIG_PATH));
    return true;
  } catch {
    return false;
  }
}

function assertField(
  obj: Record<string, unknown>,
  section: string,
  field: string,
  type: string,
): void {
  const val = obj[field];
  if (typeof val !== type) {
    throw new Error(
      `Invalid config.yaml: "${section}.${field}" must be a ${type}, got ${typeof val}`,
    );
  }
}

function validateConfig(data: unknown): SniperConfig {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid config.yaml: expected an object");
  }
  const cfg = data as Record<string, unknown>;
  for (const key of [
    "project",
    "stack",
    "state",
    "review_gates",
    "agent_teams",
  ]) {
    if (!cfg[key] || typeof cfg[key] !== "object") {
      throw new Error(`Invalid config.yaml: missing "${key}" section`);
    }
  }

  // Validate nested fields
  const project = cfg.project as Record<string, unknown>;
  assertField(project, "project", "name", "string");
  assertField(project, "project", "type", "string");

  const stack = cfg.stack as Record<string, unknown>;
  assertField(stack, "stack", "language", "string");

  const agentTeams = cfg.agent_teams as Record<string, unknown>;
  assertField(agentTeams, "agent_teams", "max_teammates", "number");

  const state = cfg.state as Record<string, unknown>;
  if (state.artifacts !== undefined && typeof state.artifacts !== "object") {
    throw new Error(
      'Invalid config.yaml: "state.artifacts" must be an object',
    );
  }

  // Normalize: ensure domain_packs is always an array
  if (!Array.isArray(cfg.domain_packs)) {
    cfg.domain_packs = [];
  }
  return data as SniperConfig;
}

export async function readConfig(cwd: string): Promise<SniperConfig> {
  const raw = await readFile(join(cwd, CONFIG_PATH), "utf-8");
  return validateConfig(YAML.parse(raw));
}

export async function writeConfig(
  cwd: string,
  config: SniperConfig,
): Promise<void> {
  const content = YAML.stringify(config, { lineWidth: 0 });
  await writeFile(join(cwd, CONFIG_PATH), content, "utf-8");
}

export function getCorePath(): string {
  // Resolve the path to @sniper.ai/core's framework directory
  // Works in both monorepo (workspace link) and published (node_modules)
  const require = createRequire(import.meta.url);
  try {
    const corePkgPath = require.resolve("@sniper.ai/core/package.json");
    return join(dirname(corePkgPath), "framework");
  } catch {
    throw new Error(
      '@sniper.ai/core is not installed. Run "pnpm add -D @sniper.ai/core" first.',
    );
  }
}
