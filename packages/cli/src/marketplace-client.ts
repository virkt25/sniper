import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface MarketplacePackage {
  name: string;
  version: string;
  description: string;
  sniperType: "plugin" | "agent" | "mixin" | "pack";
  tags: string[];
  author?: string;
  downloads?: number;
}

export interface SearchResult {
  packages: MarketplacePackage[];
  total: number;
}

interface NpmSearchObject {
  package: {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    author?: { name?: string };
    links?: { npm?: string };
  };
  score?: { detail?: { popularity?: number } };
}

interface NpmSearchResponse {
  objects: NpmSearchObject[];
  total: number;
}

interface NpmPackageResponse {
  name: string;
  "dist-tags"?: { latest?: string };
  versions?: Record<
    string,
    {
      description?: string;
      keywords?: string[];
      author?: { name?: string };
      sniper?: { type?: string };
    }
  >;
}

function inferSniperType(
  sniper?: { type?: string },
): "plugin" | "agent" | "mixin" | "pack" | null {
  if (!sniper?.type) return null;
  const t = sniper.type;
  if (t === "plugin" || t === "agent" || t === "mixin" || t === "pack") {
    return t;
  }
  return null;
}

export async function searchPackages(
  query: string,
  limit?: number,
): Promise<SearchResult> {
  const size = limit || 20;
  const url = `https://registry.npmjs.org/-/v1/search?text=sniper-+${encodeURIComponent(query)}&size=${size}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`npm registry search failed: ${resp.status}`);
  }

  const data = (await resp.json()) as NpmSearchResponse;

  // Fetch full metadata in parallel instead of sequentially
  const results = await Promise.all(
    data.objects.map((obj) => getPackageInfo(obj.package.name)),
  );
  const packages = results.filter(
    (info): info is MarketplacePackage => info !== null,
  );

  return { packages, total: packages.length };
}

export async function getPackageInfo(
  name: string,
): Promise<MarketplacePackage | null> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(`npm registry fetch failed: ${resp.status}`);
  }

  const data = (await resp.json()) as NpmPackageResponse;
  const latest = data["dist-tags"]?.latest;
  if (!latest || !data.versions?.[latest]) return null;

  const version = data.versions[latest];
  const sniperType = inferSniperType(version.sniper);
  if (!sniperType) return null;

  return {
    name: data.name,
    version: latest,
    description: version.description || "",
    sniperType,
    tags: version.keywords || [],
    author: version.author?.name,
  };
}

export async function validatePublishable(
  cwd: string,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  let pkgJson: { name?: string; sniper?: { type?: string } };
  try {
    const raw = await readFile(join(cwd, "package.json"), "utf-8");
    pkgJson = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ["No package.json found in current directory"] };
  }

  if (!pkgJson.name) {
    errors.push("package.json is missing a 'name' field");
  } else if (
    !pkgJson.name.startsWith("@sniper.ai/") &&
    !pkgJson.name.startsWith("sniper-")
  ) {
    errors.push(
      `Package name "${pkgJson.name}" must start with @sniper.ai/ or sniper-`,
    );
  }

  if (!pkgJson.sniper?.type) {
    errors.push("package.json is missing 'sniper.type' field");
  }

  if (pkgJson.sniper?.type === "plugin") {
    try {
      await readFile(join(cwd, "plugin.yaml"), "utf-8");
    } catch {
      errors.push("Plugins require a plugin.yaml file in the package root");
    }
  }

  return { valid: errors.length === 0, errors };
}
