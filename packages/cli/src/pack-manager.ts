import {
  cp,
  rm,
  readdir,
  readFile,
  stat,
  access,
  mkdir,
} from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";
import { readConfig, writeConfig } from "./config.js";

interface PackMetadata {
  name: string;
  version: string;
  sniper?: {
    type: string;
    packDir: string;
  };
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(p: string): Promise<T> {
  const raw = await readFile(p, "utf-8");
  return JSON.parse(raw) as T;
}

function getPackDir(pkgName: string, cwd: string): string {
  const nmPath = join(cwd, "node_modules", ...pkgName.split("/"));
  return nmPath;
}

export async function installPack(
  packageName: string,
  cwd: string,
): Promise<{
  name: string;
  package: string;
  version: string;
  contextCount: number;
}> {
  // Install the npm package
  execFileSync("pnpm", ["add", "-D", packageName], { cwd, stdio: "pipe" });

  // Read the installed package.json
  const pkgDir = getPackDir(packageName, cwd);
  const pkgJson = await readJson<PackMetadata>(join(pkgDir, "package.json"));

  if (!pkgJson.sniper || pkgJson.sniper.type !== "domain-pack") {
    execFileSync("pnpm", ["remove", packageName], { cwd, stdio: "pipe" });
    throw new Error(
      `${packageName} is not a valid SNIPER domain pack (missing sniper.type: "domain-pack")`,
    );
  }

  // Determine pack name from npm package name
  const shortName = packageName.replace(/^@[^/]+\/pack-/, "");
  const packSrc = join(pkgDir, pkgJson.sniper.packDir);
  const packDest = join(cwd, ".sniper", "domain-packs", shortName);

  await mkdir(packDest, { recursive: true });
  await cp(packSrc, packDest, { recursive: true, force: true });

  // Count context files
  const contextDir = join(packDest, "context");
  let contextCount = 0;
  if (await pathExists(contextDir)) {
    const files = await readdir(contextDir);
    contextCount = files.filter((f) => f.endsWith(".md")).length;
  }

  // Update config.yaml — append to domain_packs (avoid duplicates)
  const config = await readConfig(cwd);
  if (!config.domain_packs) config.domain_packs = [];
  if (!config.domain_packs.some((p) => p.name === shortName)) {
    config.domain_packs.push({ name: shortName, package: packageName });
  }
  await writeConfig(cwd, config);

  return {
    name: shortName,
    package: packageName,
    version: pkgJson.version,
    contextCount,
  };
}

export async function removePack(
  packName: string,
  cwd: string,
): Promise<void> {
  // Read config to find the full package name for this pack
  const config = await readConfig(cwd);
  const packEntry = (config.domain_packs || []).find(
    (p) => p.name === packName,
  );
  const packageName = packEntry?.package || `@sniperai/pack-${packName}`;

  const packDir = join(cwd, ".sniper", "domain-packs", packName);
  if (await pathExists(packDir)) {
    await rm(packDir, { recursive: true, force: true });
  }

  try {
    execFileSync("pnpm", ["remove", packageName], { cwd, stdio: "pipe" });
  } catch {
    // Package may not be installed via npm
  }

  config.domain_packs = (config.domain_packs || []).filter(
    (p) => p.name !== packName,
  );
  await writeConfig(cwd, config);
}

export async function listInstalledPacks(
  cwd: string,
): Promise<Array<{ name: string; version: string }>> {
  const packsDir = join(cwd, ".sniper", "domain-packs");
  if (!(await pathExists(packsDir))) return [];

  const entries = await readdir(packsDir);
  const packs: Array<{ name: string; version: string }> = [];

  for (const entry of entries) {
    const entryPath = join(packsDir, entry);
    const s = await stat(entryPath);
    if (!s.isDirectory()) continue;

    const packYaml = join(entryPath, "pack.yaml");
    if (await pathExists(packYaml)) {
      const raw = await readFile(packYaml, "utf-8");
      const parsed = YAML.parse(raw);
      packs.push({ name: entry, version: parsed.version || "unknown" });
    } else {
      packs.push({ name: entry, version: "unknown" });
    }
  }
  return packs;
}

export async function searchRegistryPacks(): Promise<
  Array<{ name: string; version: string; description: string }>
> {
  try {
    const result = execFileSync(
      "npm",
      ["search", "@sniperai/pack-", "--json"],
      { encoding: "utf-8", timeout: 10000, stdio: ["pipe", "pipe", "pipe"] },
    ).toString();
    const packages = JSON.parse(result);
    return packages.map(
      (pkg: { name: string; version: string; description: string }) => ({
        name: pkg.name,
        version: pkg.version,
        description: pkg.description || "",
      }),
    );
  } catch {
    return [];
  }
}
