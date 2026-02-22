import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  access,
  cp,
} from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { getCorePath } from "./config.js";
import type { SniperConfig } from "./config.js";

const FRAMEWORK_DIRS = [
  "personas",
  "teams",
  "templates",
  "checklists",
  "workflows",
  "spawn-prompts",
];

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export interface ScaffoldOptions {
  /** When true, skips overwriting user-customizable files (CLAUDE.md, settings.json, commands) */
  update?: boolean;
}

export async function scaffoldProject(
  cwd: string,
  config: SniperConfig,
  options: ScaffoldOptions = {},
): Promise<string[]> {
  const corePath = getCorePath();
  const sniperDir = join(cwd, ".sniper");
  const log: string[] = [];
  const isUpdate = options.update === true;

  // Create .sniper/ directory
  await ensureDir(sniperDir);

  // Copy framework directories
  for (const dir of FRAMEWORK_DIRS) {
    const src = join(corePath, dir);
    const dest = join(sniperDir, dir);
    await cp(src, dest, { recursive: true, force: true });
    log.push(`Copied ${dir}/`);
  }

  // Create domain-packs directory
  await ensureDir(join(sniperDir, "domain-packs"));

  // Create memory directory with starter files
  const memoryDir = join(sniperDir, "memory");
  await ensureDir(memoryDir);
  await ensureDir(join(memoryDir, "retros"));
  const memoryFiles: Record<string, string> = {
    "conventions.yaml": "conventions: []\n",
    "anti-patterns.yaml": "anti_patterns: []\n",
    "decisions.yaml": "decisions: []\n",
    "estimates.yaml":
      "calibration:\n  velocity_factor: 1.0\n  common_underestimates: []\n  last_updated: null\n  sprints_analyzed: 0\n",
  };
  for (const [filename, content] of Object.entries(memoryFiles)) {
    const filePath = join(memoryDir, filename);
    if (!isUpdate || !(await fileExists(filePath))) {
      await writeFile(filePath, content, "utf-8");
    }
  }
  log.push("Created memory/ directory");

  // Generate config.yaml (skipped during update — caller preserves config separately)
  if (!isUpdate) {
    const configContent = YAML.stringify(config, { lineWidth: 0 });
    await writeFile(join(sniperDir, "config.yaml"), configContent, "utf-8");
    log.push("Created config.yaml");
  }

  // Generate CLAUDE.md from template (skip during update if user has customized it)
  if (!isUpdate || !(await fileExists(join(cwd, "CLAUDE.md")))) {
    const claudeTemplate = await readFile(
      join(corePath, "claude-md.template"),
      "utf-8",
    );
    await writeFile(join(cwd, "CLAUDE.md"), claudeTemplate, "utf-8");
    log.push("Created CLAUDE.md");
  } else {
    log.push("Skipped CLAUDE.md (preserved user customizations)");
  }

  // Generate .claude/settings.json from template (skip during update if exists)
  const settingsDir = join(cwd, ".claude");
  await ensureDir(settingsDir);
  if (!isUpdate || !(await fileExists(join(settingsDir, "settings.json")))) {
    const settingsTemplate = await readFile(
      join(corePath, "settings.template.json"),
      "utf-8",
    );
    await writeFile(
      join(settingsDir, "settings.json"),
      settingsTemplate,
      "utf-8",
    );
    log.push("Created .claude/settings.json");
  } else {
    log.push("Skipped .claude/settings.json (preserved user customizations)");
  }

  // Copy skills/commands into .claude/commands/
  const commandsSrc = join(corePath, "commands");
  const commandsDest = join(settingsDir, "commands");
  await cp(commandsSrc, commandsDest, { recursive: true, force: true });
  log.push("Copied skills to .claude/commands/");

  // Create docs/ directory structure
  if (!isUpdate) {
    for (const sub of ["epics", "stories", "reviews"]) {
      const dir = join(cwd, "docs", sub);
      await ensureDir(dir);
      // Only write .gitkeep if directory is empty
      try {
        const entries = await readdir(dir);
        if (entries.length === 0) {
          await writeFile(join(dir, ".gitkeep"), "", "utf-8");
        }
      } catch {
        await writeFile(join(dir, ".gitkeep"), "", "utf-8");
      }
    }
    log.push("Created docs/ directory");
  }

  return log;
}
