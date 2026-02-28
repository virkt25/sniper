import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import YAML from "yaml";

const WORKSPACE_DIR = ".sniper-workspace";
const WORKSPACE_CONFIG = "config.yaml";

// ── Interfaces ──

export interface WorkspaceProject {
  name: string;
  path: string;
  type?: string;
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  date: string;
}

export interface WorkspaceConfig {
  name: string;
  projects: WorkspaceProject[];
  shared?: {
    conventions?: string[];
    anti_patterns?: string[];
    architectural_decisions?: ArchitecturalDecision[];
  };
  memory?: {
    directory?: string;
  };
}

// ── Helpers ──

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// ── Public API ──

/**
 * Walk parent directories looking for `.sniper-workspace/config.yaml`.
 * Returns the directory containing `.sniper-workspace/` or null if not found.
 */
export async function findWorkspaceRoot(
  cwd: string,
): Promise<string | null> {
  let dir = resolve(cwd);

  while (true) {
    const configPath = join(dir, WORKSPACE_DIR, WORKSPACE_CONFIG);
    if (await pathExists(configPath)) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

/**
 * Read and parse `.sniper-workspace/config.yaml` from the workspace root.
 */
export async function readWorkspaceConfig(
  workspaceRoot: string,
): Promise<WorkspaceConfig> {
  const configPath = join(workspaceRoot, WORKSPACE_DIR, WORKSPACE_CONFIG);
  const raw = await readFile(configPath, "utf-8");
  const data = YAML.parse(raw) as WorkspaceConfig;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid workspace config: expected an object");
  }
  if (!data.name || typeof data.name !== "string") {
    throw new Error('Invalid workspace config: missing "name"');
  }
  if (!Array.isArray(data.projects)) {
    throw new Error('Invalid workspace config: missing "projects" array');
  }

  return data;
}

/**
 * Return the shared conventions array from workspace config.
 */
export async function getSharedConventions(
  workspaceRoot: string,
): Promise<string[]> {
  const config = await readWorkspaceConfig(workspaceRoot);
  return config.shared?.conventions ?? [];
}

/**
 * Add a project entry to the workspace config.
 */
export async function addProject(
  workspaceRoot: string,
  name: string,
  path: string,
): Promise<void> {
  const config = await readWorkspaceConfig(workspaceRoot);

  if (config.projects.some((p) => p.name === name)) {
    throw new Error(`Project "${name}" already exists in workspace`);
  }

  config.projects.push({ name, path });

  const configPath = join(workspaceRoot, WORKSPACE_DIR, WORKSPACE_CONFIG);
  await writeFile(configPath, YAML.stringify(config, { lineWidth: 0 }), "utf-8");
}

/**
 * Sync shared conventions to individual projects.
 * Currently returns projects that have a SNIPER config (candidates for sync).
 * TODO: Actually write workspace conventions into each project's config.
 */
export async function syncConventions(
  workspaceRoot: string,
): Promise<string[]> {
  const config = await readWorkspaceConfig(workspaceRoot);
  const candidates: string[] = [];

  for (const project of config.projects) {
    const projectConfigPath = join(
      workspaceRoot,
      project.path,
      ".sniper",
      "config.yaml",
    );
    if (await pathExists(projectConfigPath)) {
      candidates.push(project.name);
    }
  }

  return candidates;
}

/**
 * Initialize a new workspace: creates `.sniper-workspace/` with config, memory, and locks dirs.
 * Returns the path to the workspace directory.
 */
export async function initWorkspace(
  cwd: string,
  name: string,
): Promise<string> {
  const wsDir = join(cwd, WORKSPACE_DIR);
  const memoryDir = join(wsDir, "memory");
  const locksDir = join(wsDir, "locks");

  await mkdir(wsDir, { recursive: true });
  await mkdir(memoryDir, { recursive: true });
  await mkdir(locksDir, { recursive: true });

  const config: WorkspaceConfig = {
    name,
    projects: [],
    shared: {
      conventions: [],
      anti_patterns: [],
      architectural_decisions: [],
    },
    memory: {
      directory: `${WORKSPACE_DIR}/memory`,
    },
  };

  const configPath = join(wsDir, WORKSPACE_CONFIG);
  await writeFile(configPath, YAML.stringify(config, { lineWidth: 0 }), "utf-8");

  return wsDir;
}
