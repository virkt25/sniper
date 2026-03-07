/**
 * Auto-generates a changeset file from a conventional commit PR title.
 *
 * Parses the PR title (e.g. "feat(cli): add init command") to determine:
 * - Semver bump type (feat → minor, fix → patch, feat! / BREAKING CHANGE → major)
 * - Scoped packages (from the optional scope in parentheses)
 * - If no scope, detects changed packages from the git diff against main
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PR_TITLE = process.env.PR_TITLE;
const PR_NUMBER = process.env.PR_NUMBER;

if (!PR_TITLE) {
  console.log("No PR title found, skipping changeset generation.");
  process.exit(0);
}

// Parse conventional commit from PR title
const CONVENTIONAL_RE = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
const match = PR_TITLE.match(CONVENTIONAL_RE);

if (!match) {
  console.log(`PR title "${PR_TITLE}" is not a conventional commit. Skipping.`);
  process.exit(0);
}

const [, type, scope, breaking, description] = match;

// Skip types that don't need a release
const SKIP_TYPES = ["chore", "ci", "docs", "style", "test"];
if (SKIP_TYPES.includes(type) && !breaking) {
  console.log(`Type "${type}" does not trigger a release. Skipping.`);
  process.exit(0);
}

// Determine bump level
let bump = "patch";
if (breaking) {
  bump = "major";
} else if (type === "feat") {
  bump = "minor";
}

// Map of shorthand scopes to package names
const SCOPE_TO_PACKAGES = {
  cli: ["@sniper.ai/cli"],
  core: ["@sniper.ai/core"],
  ts: ["@sniper.ai/plugin-typescript"],
  typescript: ["@sniper.ai/plugin-typescript"],
  py: ["@sniper.ai/plugin-python"],
  python: ["@sniper.ai/plugin-python"],
  go: ["@sniper.ai/plugin-go"],
  "sales-dialer": ["@sniper.ai/pack-sales-dialer"],
  "mcp-knowledge": ["@sniper.ai/mcp-knowledge"],
};

/**
 * Discover all publishable packages in the monorepo dynamically
 * by reading pnpm-workspace.yaml glob patterns.
 */
function getAllPackages() {
  const workspaceFile = readFileSync("pnpm-workspace.yaml", "utf-8");
  const patterns = [...workspaceFile.matchAll(/- ["']?([^"'\n]+)["']?/g)].map((m) => m[1]);

  const packages = [];
  for (const pattern of patterns) {
    // Resolve glob: replace trailing /* with actual directory listing
    const baseDir = pattern.replace(/\/\*$/, "");
    if (!existsSync(baseDir)) continue;

    if (pattern.endsWith("/*")) {
      // Wildcard — enumerate subdirectories
      const entries = readdirSync(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const dir = join(baseDir, entry.name);
        const pkgPath = join(dir, "package.json");
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
          if (!pkg.private) {
            packages.push({ name: pkg.name, path: dir });
          }
        }
      }
    } else {
      // Exact path
      const pkgPath = join(baseDir, "package.json");
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (!pkg.private) {
          packages.push({ name: pkg.name, path: baseDir });
        }
      }
    }
  }
  return packages;
}

/**
 * Detect which packages have changes compared to main.
 */
function getChangedPackages() {
  const allPackages = getAllPackages();
  const diff = execSync("git diff --name-only origin/main...HEAD", {
    encoding: "utf-8",
  }).trim();

  if (!diff) return [];

  const changedFiles = diff.split("\n");
  const changed = new Set();

  for (const pkg of allPackages) {
    if (changedFiles.some((f) => f.startsWith(pkg.path + "/"))) {
      changed.add(pkg.name);
    }
  }
  return [...changed];
}

// Resolve target packages
let packages;
if (scope && SCOPE_TO_PACKAGES[scope]) {
  packages = SCOPE_TO_PACKAGES[scope];
} else if (scope) {
  // Try matching scope as a package directory name
  const allPkgs = getAllPackages();
  const matched = allPkgs.filter(
    (p) => p.path.endsWith(scope) || p.name === `@sniper.ai/${scope}`
  );
  packages = matched.length > 0 ? matched.map((p) => p.name) : getChangedPackages();
} else {
  packages = getChangedPackages();
}

if (packages.length === 0) {
  console.log("No publishable packages changed. Skipping.");
  process.exit(0);
}

// Check if a changeset already exists for this PR (avoid duplicates)
const changesetDir = ".changeset";
const prefix = `pr-${PR_NUMBER}`;
const existingFiles = existsSync(changesetDir) ? readdirSync(changesetDir) : [];
const existing = existingFiles.find((f) => f.startsWith(prefix) && f.endsWith(".md"));

if (existing) {
  console.log(`Changeset ${existing} already exists for PR #${PR_NUMBER}. Overwriting.`);
}

// Generate changeset file
const filename = `${prefix}.md`;
const frontmatter = packages.map((pkg) => `"${pkg}": ${bump}`).join("\n");
const content = `---\n${frontmatter}\n---\n\n${description}\n`;

if (!existsSync(changesetDir)) {
  mkdirSync(changesetDir, { recursive: true });
}

writeFileSync(join(changesetDir, filename), content);
console.log(`Generated changeset: ${filename}`);
console.log(`  Packages: ${packages.join(", ")}`);
console.log(`  Bump: ${bump}`);
console.log(`  Summary: ${description}`);
