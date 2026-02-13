import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  cp,
  stat,
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

export async function scaffoldProject(
  cwd: string,
  config: SniperConfig,
): Promise<string[]> {
  const corePath = getCorePath();
  const sniperDir = join(cwd, ".sniper");
  const log: string[] = [];

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

  // Generate config.yaml
  const configContent = YAML.stringify(config, { lineWidth: 0 });
  await writeFile(join(sniperDir, "config.yaml"), configContent, "utf-8");
  log.push("Created config.yaml");

  // Generate CLAUDE.md from template
  const claudeTemplate = await readFile(
    join(corePath, "claude-md.template"),
    "utf-8",
  );
  await writeFile(join(cwd, "CLAUDE.md"), claudeTemplate, "utf-8");
  log.push("Created CLAUDE.md");

  // Generate .claude/settings.json from template
  const settingsDir = join(cwd, ".claude");
  await ensureDir(settingsDir);
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

  // Copy skills/commands into .claude/commands/
  const commandsSrc = join(corePath, "commands");
  const commandsDest = join(settingsDir, "commands");
  await cp(commandsSrc, commandsDest, { recursive: true, force: true });
  log.push("Copied skills to .claude/commands/");

  // Create docs/ directory structure
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

  return log;
}
