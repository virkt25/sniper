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
  domain_pack: string | null;
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
    artifacts: Record<string, string | null>;
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

export async function readConfig(cwd: string): Promise<SniperConfig> {
  const raw = await readFile(join(cwd, CONFIG_PATH), "utf-8");
  return YAML.parse(raw) as SniperConfig;
}

export async function writeConfig(
  cwd: string,
  config: SniperConfig,
): Promise<void> {
  const content = YAML.stringify(config, { lineWidth: 0 });
  await writeFile(join(cwd, CONFIG_PATH), content, "utf-8");
}

export function getCorePath(): string {
  // Resolve the path to @sniperai/core's framework directory
  // Works in both monorepo (workspace link) and published (node_modules)
  const require = createRequire(import.meta.url);
  const corePkgPath = require.resolve("@sniperai/core/package.json");
  return join(dirname(corePkgPath), "framework");
}
