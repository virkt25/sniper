import {
  cp,
  rm,
  readdir,
  readFile,
  access,
  mkdir,
} from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";
import { readConfig, writeConfig } from "./config.js";

/**
 * Validates that a resolved path stays within the expected base directory.
 */
function assertSafePath(base: string, untrusted: string): string {
  const full = resolve(base, untrusted);
  const safeBase = resolve(base) + sep;
  if (!full.startsWith(safeBase) && full !== resolve(base)) {
    throw new Error(
      `Invalid name: path traversal detected in "${untrusted}"`,
    );
  }
  return full;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  commands?: Record<string, { run: string; description?: string }>;
  conventions?: string[];
  review_checks?: Array<{
    id: string;
    description: string;
    command: string;
    blocking: boolean;
  }>;
  agent_mixins?: Record<string, string[]>;
  hooks?: Record<string, unknown[]>;
}

interface PackageJson {
  name: string;
  version: string;
  sniper?: { type: string };
}

function getPackageDir(pkgName: string, cwd: string): string {
  return join(cwd, "node_modules", ...pkgName.split("/"));
}

export async function validatePluginYaml(
  pluginPath: string,
): Promise<PluginManifest> {
  const raw = await readFile(pluginPath, "utf-8");
  const manifest = YAML.parse(raw) as PluginManifest;

  if (!manifest.name || typeof manifest.name !== "string") {
    throw new Error("Plugin manifest missing required 'name' field");
  }
  if (!manifest.version || typeof manifest.version !== "string") {
    throw new Error("Plugin manifest missing required 'version' field");
  }

  return manifest;
}

export async function installPlugin(
  packageName: string,
  cwd: string,
): Promise<{
  name: string;
  package: string;
  version: string;
}> {
  // Install the npm package
  execFileSync("pnpm", ["add", "-D", packageName], { cwd, stdio: "pipe" });

  // Read the installed package.json
  const pkgDir = getPackageDir(packageName, cwd);
  const pkgJsonRaw = await readFile(join(pkgDir, "package.json"), "utf-8");
  const pkgJson = JSON.parse(pkgJsonRaw) as PackageJson;

  if (!pkgJson.sniper || pkgJson.sniper.type !== "plugin") {
    execFileSync("pnpm", ["remove", packageName], { cwd, stdio: "pipe" });
    throw new Error(
      `${packageName} is not a valid SNIPER plugin (missing sniper.type: "plugin")`,
    );
  }

  // Read and validate plugin.yaml
  const pluginYamlPath = join(pkgDir, "plugin.yaml");
  if (!(await pathExists(pluginYamlPath))) {
    execFileSync("pnpm", ["remove", packageName], { cwd, stdio: "pipe" });
    throw new Error(`${packageName} is missing plugin.yaml`);
  }
  const manifest = await validatePluginYaml(pluginYamlPath);

  // Copy plugin mixins to .claude/personas/cognitive/
  if (manifest.agent_mixins) {
    const mixinsDir = join(cwd, ".claude", "personas", "cognitive");
    await mkdir(mixinsDir, { recursive: true });

    for (const [, mixinPaths] of Object.entries(manifest.agent_mixins)) {
      for (const mixinPath of mixinPaths) {
        const src = assertSafePath(pkgDir, mixinPath);
        const filename = mixinPath.split("/").pop()!;
        const dest = join(mixinsDir, filename);
        await cp(src, dest, { force: true });
      }
    }
  }

  // Update config.yaml
  const config = await readConfig(cwd);
  if (!config.plugins.some((p) => p.name === manifest.name)) {
    config.plugins.push({ name: manifest.name, package: packageName });
  }
  await writeConfig(cwd, config);

  return {
    name: manifest.name,
    package: packageName,
    version: manifest.version,
  };
}

export async function removePlugin(
  pluginName: string,
  cwd: string,
): Promise<void> {
  const config = await readConfig(cwd);
  const entry = config.plugins.find((p) => p.name === pluginName);
  const packageName = entry?.package || `@sniper.ai/plugin-${pluginName}`;

  // Remove npm package
  try {
    execFileSync("pnpm", ["remove", packageName], { cwd, stdio: "pipe" });
  } catch {
    // Package may not be installed
  }

  // Update config
  config.plugins = config.plugins.filter((p) => p.name !== pluginName);
  await writeConfig(cwd, config);
}

export async function listPlugins(
  cwd: string,
): Promise<Array<{ name: string; package: string }>> {
  const config = await readConfig(cwd);
  return config.plugins;
}
