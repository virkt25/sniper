import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { pathExists } from "./fs-utils.js";

const WORKSPACE_DIR = ".sniper-workspace";
const LOCKS_DIR = "locks";
const DEPENDENCY_GRAPH_FILE = "dependency-graph.yaml";

// ── Interfaces ──

export interface FileLock {
  file: string;
  locked_by: {
    project: string;
    agent: string;
    protocol: string;
  };
  since: string;
  reason?: string;
}

export interface Conflict {
  file: string;
  held_by: {
    project: string;
    agent: string;
    protocol: string;
  };
  requested_by: {
    project: string;
    agent: string;
    protocol: string;
  };
}

export interface ApiDependency {
  api: string;
  file: string;
  from_project?: string;
}

// ── Helpers ──

function encodeLockFilename(file: string): string {
  // Use percent-encoding for separators to avoid collisions (e.g. "a/b" vs "a__b")
  return file.replace(/%/g, "%25").replace(/\//g, "%2F").replace(/\\/g, "%5C") + ".yaml";
}

function locksDir(workspaceRoot: string): string {
  return join(workspaceRoot, WORKSPACE_DIR, LOCKS_DIR);
}

// ── Public API ──

/**
 * Create an advisory lock for a file in the workspace.
 */
export async function createLock(
  workspaceRoot: string,
  file: string,
  project: string,
  agent: string,
  protocol: string,
  reason?: string,
): Promise<void> {
  const dir = locksDir(workspaceRoot);
  await mkdir(dir, { recursive: true });

  const lock: FileLock = {
    file,
    locked_by: { project, agent, protocol },
    since: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };

  const lockPath = join(dir, encodeLockFilename(file));
  try {
    await writeFile(lockPath, YAML.stringify(lock, { lineWidth: 0 }), {
      encoding: "utf-8",
      flag: "wx",
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(
        `Lock already exists for "${file}". Another agent may be modifying this file.`,
      );
    }
    throw err;
  }
}

/**
 * Release an advisory lock for a file.
 * Returns true if the lock existed and was removed, false otherwise.
 */
export async function releaseLock(
  workspaceRoot: string,
  file: string,
  owner?: string,
): Promise<boolean> {
  const lockPath = join(locksDir(workspaceRoot), encodeLockFilename(file));

  if (await pathExists(lockPath)) {
    if (owner) {
      const raw = await readFile(lockPath, "utf-8");
      const lock = YAML.parse(raw) as FileLock;
      if (lock?.locked_by?.agent !== owner && lock?.locked_by?.project !== owner) {
        throw new Error(
          `Cannot release lock for "${file}": owned by agent "${lock?.locked_by?.agent}" / project "${lock?.locked_by?.project}", not "${owner}"`,
        );
      }
    }
    await rm(lockPath);
    return true;
  }

  return false;
}

/**
 * Read all active file locks from the workspace.
 */
export async function readLocks(
  workspaceRoot: string,
): Promise<FileLock[]> {
  const dir = locksDir(workspaceRoot);

  if (!(await pathExists(dir))) {
    return [];
  }

  const files = await readdir(dir);
  const yamlFiles = files.filter(
    (f) => f.endsWith(".yaml") || f.endsWith(".yml"),
  );

  const locks: FileLock[] = [];
  for (const file of yamlFiles) {
    const raw = await readFile(join(dir, file), "utf-8");
    const data = YAML.parse(raw) as FileLock;
    if (data && data.file && data.locked_by) {
      locks.push(data);
    }
  }

  return locks;
}

/**
 * Check if any of the given files are locked by another project.
 */
export async function checkConflicts(
  workspaceRoot: string,
  filesToModify: string[],
  project: string,
): Promise<Conflict[]> {
  const locks = await readLocks(workspaceRoot);
  const conflicts: Conflict[] = [];
  // Normalize paths to forward-slash for consistent comparison
  const normalizedFiles = filesToModify.map((f) => f.replace(/\\/g, "/"));

  for (const lock of locks) {
    const normalizedLockFile = lock.file.replace(/\\/g, "/");
    if (
      normalizedFiles.includes(normalizedLockFile) &&
      lock.locked_by.project !== project
    ) {
      conflicts.push({
        file: lock.file,
        held_by: lock.locked_by,
        requested_by: {
          project,
          agent: "unknown",
          protocol: "unknown",
        },
      });
    }
  }

  return conflicts;
}

/**
 * Detect if any changed files are exported APIs that other projects depend on.
 * Returns a list of project names that depend on the changed APIs.
 */
export async function detectApiChanges(
  workspaceRoot: string,
  changedFiles: string[],
): Promise<string[]> {
  const graphPath = join(
    workspaceRoot,
    WORKSPACE_DIR,
    DEPENDENCY_GRAPH_FILE,
  );

  if (!(await pathExists(graphPath))) {
    return [];
  }

  const raw = await readFile(graphPath, "utf-8");
  const graph = YAML.parse(raw) as {
    projects: Array<{
      name: string;
      exports: Array<{ api: string; file: string }>;
      imports: Array<{ api: string; from_project: string }>;
    }>;
  };

  if (!graph?.projects) {
    return [];
  }

  // Build a map: exported file -> { project, api }
  const exportMap = new Map<string, { project: string; api: string }[]>();
  for (const proj of graph.projects) {
    for (const exp of proj.exports ?? []) {
      const existing = exportMap.get(exp.file) ?? [];
      existing.push({ project: proj.name, api: exp.api });
      exportMap.set(exp.file, existing);
    }
  }

  // Find which exports are affected by changed files
  const affectedApis: Array<{ project: string; api: string }> = [];
  for (const changed of changedFiles) {
    const exports = exportMap.get(changed);
    if (exports) {
      affectedApis.push(...exports);
    }
  }

  if (affectedApis.length === 0) {
    return [];
  }

  // Find projects that import these affected APIs
  const dependents = new Set<string>();
  for (const proj of graph.projects) {
    for (const imp of proj.imports ?? []) {
      for (const affected of affectedApis) {
        if (
          imp.api === affected.api &&
          imp.from_project === affected.project
        ) {
          dependents.add(proj.name);
        }
      }
    }
  }

  return [...dependents];
}

/**
 * Find projects that import from the given API file.
 */
export async function findDependents(
  workspaceRoot: string,
  apiFile: string,
): Promise<string[]> {
  const graphPath = join(
    workspaceRoot,
    WORKSPACE_DIR,
    DEPENDENCY_GRAPH_FILE,
  );

  if (!(await pathExists(graphPath))) {
    return [];
  }

  const raw = await readFile(graphPath, "utf-8");
  const graph = YAML.parse(raw) as {
    projects: Array<{
      name: string;
      exports: Array<{ api: string; file: string }>;
      imports: Array<{ api: string; from_project: string }>;
    }>;
  };

  if (!graph?.projects) {
    return [];
  }

  // Find which project + api corresponds to the given file
  const matchedApis: Array<{ project: string; api: string }> = [];
  for (const proj of graph.projects) {
    for (const exp of proj.exports ?? []) {
      if (exp.file === apiFile) {
        matchedApis.push({ project: proj.name, api: exp.api });
      }
    }
  }

  if (matchedApis.length === 0) {
    return [];
  }

  // Find projects that import these APIs
  const dependents = new Set<string>();
  for (const proj of graph.projects) {
    for (const imp of proj.imports ?? []) {
      for (const match of matchedApis) {
        if (imp.api === match.api && imp.from_project === match.project) {
          dependents.add(proj.name);
        }
      }
    }
  }

  return [...dependents];
}
