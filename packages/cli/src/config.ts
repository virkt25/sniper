import { readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import YAML from "yaml";

// ── v3 Config Interface ──

export interface SniperConfigV3 {
  project: {
    name: string;
    type: string;
    description: string;
  };
  agents: {
    default_model: string;
    planning_model: string;
    max_teammates: number;
    plan_approval: boolean;
    coordination_timeout: number;
    base: string[];
    mixins: Record<string, string[]>;
  };
  routing: {
    auto_detect: {
      patch_max_files: number;
      feature_max_files: number;
    };
    default: string;
    budgets: Record<string, number>;
  };
  cost: {
    warn_threshold: number;
    soft_cap: number;
    hard_cap: number;
  };
  review?: {
    multi_model: boolean;
    models: string[];
    require_consensus: boolean;
  };
  ownership: Record<string, string[]>;
  stack: {
    language: string;
    frontend: string | null;
    backend: string | null;
    database: string | null;
    infrastructure: string | null;
    test_runner: string | null;
    package_manager: string;
    commands: {
      test: string;
      lint: string;
      typecheck: string;
      build: string;
    };
  };
  plugins: Array<{ name: string; package: string }>;
  triggers?: Array<{
    pattern: string;
    agent?: string;
    protocol?: string;
  }>;
  knowledge?: {
    directory: string;
    manifest: string;
    max_total_tokens: number;
  };
  mcp_knowledge?: {
    enabled: boolean;
    directory: string;
    auto_index: boolean;
  };
  headless?: {
    auto_approve_gates: boolean;
    output_format: "json" | "yaml" | "text";
    log_level: "debug" | "info" | "warn" | "error";
    timeout_minutes: number;
    fail_on_gate_failure: boolean;
  };
  workspace?: {
    ref: string;
  };
  visibility: {
    live_status: boolean;
    checkpoints: boolean;
    cost_tracking: boolean;
    auto_retro: boolean;
  };
}

// ── v2 Config Interface (for migration detection) ──

export interface SniperConfigV2 {
  project: { name: string; type: string; description: string };
  stack: { language: string; [key: string]: unknown };
  review_gates: Record<string, string>;
  agent_teams: {
    max_teammates: number;
    default_model: string;
    planning_model: string;
    delegate_mode: boolean;
    plan_approval: boolean;
    coordination_timeout: number;
  };
  domain_packs: Array<{ name: string; package: string }>;
  ownership: Record<string, string[]>;
  state: Record<string, unknown>;
  [key: string]: unknown;
}

// ── Type Guards ──

export function isV2Config(data: unknown): data is SniperConfigV2 {
  if (!data || typeof data !== "object") return false;
  const cfg = data as Record<string, unknown>;
  return (
    "review_gates" in cfg ||
    "agent_teams" in cfg ||
    "domain_packs" in cfg ||
    "state" in cfg
  );
}

export function isV3Config(data: unknown): data is SniperConfigV3 {
  if (!data || typeof data !== "object") return false;
  const cfg = data as Record<string, unknown>;
  return "agents" in cfg && "routing" in cfg && "visibility" in cfg;
}

// ── Validation ──

const CONFIG_PATH = ".sniper/config.yaml";

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

function validateV3Config(data: unknown): SniperConfigV3 {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid config.yaml: expected an object");
  }
  const cfg = data as Record<string, unknown>;

  // Check required sections
  for (const key of ["project", "agents", "routing", "cost", "stack"]) {
    if (!cfg[key] || typeof cfg[key] !== "object") {
      throw new Error(`Invalid config.yaml: missing "${key}" section`);
    }
  }

  // Validate project
  const project = cfg.project as Record<string, unknown>;
  assertField(project, "project", "name", "string");
  assertField(project, "project", "type", "string");

  // Validate agents
  const agents = cfg.agents as Record<string, unknown>;
  assertField(agents, "agents", "max_teammates", "number");

  // Validate stack
  const stack = cfg.stack as Record<string, unknown>;
  assertField(stack, "stack", "language", "string");

  // Normalize optional sections
  if (!cfg.plugins || !Array.isArray(cfg.plugins)) {
    (cfg as Record<string, unknown>).plugins = [];
  }
  if (!cfg.visibility || typeof cfg.visibility !== "object") {
    (cfg as Record<string, unknown>).visibility = {
      live_status: true,
      checkpoints: true,
      cost_tracking: true,
      auto_retro: true,
    };
  }
  if (!cfg.ownership || typeof cfg.ownership !== "object") {
    (cfg as Record<string, unknown>).ownership = {};
  }

  return data as SniperConfigV3;
}

// ── File I/O ──

export async function sniperConfigExists(cwd: string): Promise<boolean> {
  try {
    await access(join(cwd, CONFIG_PATH));
    return true;
  } catch {
    return false;
  }
}

export async function readConfig(cwd: string): Promise<SniperConfigV3> {
  const raw = await readFile(join(cwd, CONFIG_PATH), "utf-8");
  const data = YAML.parse(raw);

  if (isV2Config(data)) {
    throw new Error(
      'This project uses SNIPER v2 config. Run "sniper migrate" to upgrade to v3.',
    );
  }

  return validateV3Config(data);
}

export async function readRawConfig(cwd: string): Promise<unknown> {
  const raw = await readFile(join(cwd, CONFIG_PATH), "utf-8");
  return YAML.parse(raw);
}

export async function writeConfig(
  cwd: string,
  config: SniperConfigV3,
): Promise<void> {
  const content = YAML.stringify(config, { lineWidth: 0 });
  await writeFile(join(cwd, CONFIG_PATH), content, "utf-8");
}

// ── Default Budgets ──

export const DEFAULT_BUDGETS: Record<string, number> = {
  full: 2000000,
  feature: 800000,
  patch: 200000,
  ingest: 1000000,
  explore: 500000,
  refactor: 600000,
  hotfix: 100000,
};

// ── Core Path Resolution ──

export function getCorePath(): string {
  const require = createRequire(import.meta.url);
  try {
    const corePkgPath = require.resolve("@sniper.ai/core/package.json");
    return dirname(corePkgPath);
  } catch (err) {
    throw new Error(
      '@sniper.ai/core is not installed. Run "pnpm add -D @sniper.ai/core" first.',
      { cause: err },
    );
  }
}
