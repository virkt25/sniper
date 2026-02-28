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
import type { SniperConfigV3 } from "./config.js";

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
  /** When true, skips overwriting user-customizable files */
  update?: boolean;
}

/**
 * Concatenate a base agent definition with cognitive mixin files.
 * Returns the combined markdown content.
 */
export async function composeMixin(
  basePath: string,
  mixinPaths: string[],
): Promise<string> {
  let content = await readFile(basePath, "utf-8");

  for (const mixinPath of mixinPaths) {
    const mixin = await readFile(mixinPath, "utf-8");
    content += "\n\n---\n\n" + mixin;
  }

  return content;
}

/**
 * Merge hook definitions from core and plugins into a settings.json object.
 * Handles deduplication by description.
 */
export function mergeHooks(
  base: Record<string, unknown>,
  ...sources: Array<Record<string, unknown>>
): Record<string, unknown> {
  const result = { ...base };

  // Ensure hooks object exists
  if (!result.hooks || typeof result.hooks !== "object") {
    result.hooks = {};
  }
  const hooks = result.hooks as Record<string, unknown[]>;

  for (const source of sources) {
    const sourceHooks = (source.hooks || {}) as Record<string, unknown[]>;
    for (const [event, entries] of Object.entries(sourceHooks)) {
      if (!Array.isArray(entries)) continue;
      if (!hooks[event]) hooks[event] = [];

      for (const entry of entries) {
        const desc = (entry as Record<string, unknown>).description;
        // Deduplicate by description
        const existing = hooks[event].find(
          (h) => (h as Record<string, unknown>).description === desc,
        );
        if (!existing) {
          hooks[event].push(entry);
        }
      }
    }
  }

  return result;
}

export async function scaffoldProject(
  cwd: string,
  config: SniperConfigV3,
  options: ScaffoldOptions = {},
): Promise<string[]> {
  const corePath = getCorePath();
  const sniperDir = join(cwd, ".sniper");
  const claudeDir = join(cwd, ".claude");
  const log: string[] = [];
  const isUpdate = options.update === true;

  // Create .sniper/ directories
  await ensureDir(sniperDir);
  for (const sub of ["checkpoints", "gates", "retros", "self-reviews"]) {
    await ensureDir(join(sniperDir, sub));
  }

  // Copy checklists to .sniper/
  const checklistsSrc = join(corePath, "checklists");
  const checklistsDest = join(sniperDir, "checklists");
  await cp(checklistsSrc, checklistsDest, { recursive: true, force: true });
  log.push("Copied checklists/");

  // Generate config.yaml
  if (!isUpdate) {
    const configContent = YAML.stringify(config, { lineWidth: 0 });
    await writeFile(join(sniperDir, "config.yaml"), configContent, "utf-8");
    log.push("Created .sniper/config.yaml");
  }

  // Create .claude/ directories
  await ensureDir(claudeDir);
  await ensureDir(join(claudeDir, "agents"));

  // Copy and compose agent definitions
  const agentsSrc = join(corePath, "agents");
  for (const agentName of config.agents.base) {
    const srcFile = join(agentsSrc, `${agentName}.md`);
    if (!(await fileExists(srcFile))) continue;

    const mixinNames = config.agents.mixins[agentName] || [];
    if (mixinNames.length > 0) {
      // Compose agent with mixins
      const mixinPaths = mixinNames.map((m) =>
        join(corePath, "personas", "cognitive", `${m}.md`),
      );
      const composed = await composeMixin(srcFile, mixinPaths);
      await writeFile(join(claudeDir, "agents", `${agentName}.md`), composed, "utf-8");
    } else {
      // Copy base agent directly
      await cp(srcFile, join(claudeDir, "agents", `${agentName}.md`), { force: true });
    }
  }
  log.push("Scaffolded .claude/agents/");

  // Copy skills to .claude/commands/ (SKILL.md files become slash commands)
  const skillsSrc = join(corePath, "skills");
  const commandsDest = join(claudeDir, "commands");
  await ensureDir(commandsDest);

  if (await fileExists(skillsSrc)) {
    const skillDirs = await readdir(skillsSrc);
    for (const skillDir of skillDirs) {
      const skillFile = join(skillsSrc, skillDir, "SKILL.md");
      if (await fileExists(skillFile)) {
        await cp(skillFile, join(commandsDest, `${skillDir}.md`), { force: true });
      }
    }
  }
  log.push("Copied skills to .claude/commands/");

  // Generate .claude/settings.json with hooks
  const settingsPath = join(claudeDir, "settings.json");
  let settings: Record<string, unknown> = {};

  if (isUpdate && (await fileExists(settingsPath))) {
    const raw = await readFile(settingsPath, "utf-8");
    settings = JSON.parse(raw);
  }

  // Read core hooks
  const coreHooksPath = join(corePath, "hooks", "settings-hooks.json");
  if (await fileExists(coreHooksPath)) {
    const coreHooks = JSON.parse(await readFile(coreHooksPath, "utf-8"));
    settings = mergeHooks(settings, coreHooks);
  }

  // Ensure agent teams env is set
  if (!settings.env || typeof settings.env !== "object") {
    settings.env = {};
  }
  (settings.env as Record<string, unknown>).CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = 1;

  if (!isUpdate || !(await fileExists(settingsPath))) {
    await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    log.push("Created .claude/settings.json");
  } else {
    await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    log.push("Updated .claude/settings.json hooks");
  }

  // Generate CLAUDE.md from template
  if (!isUpdate || !(await fileExists(join(cwd, "CLAUDE.md")))) {
    const claudeTemplate = await readFile(
      join(corePath, "claude-md.template"),
      "utf-8",
    );
    const claudeMd = claudeTemplate
      .replace("{{PROJECT_NAME}}", config.project.name)
      .replace("{{CUSTOM_INSTRUCTIONS}}", "");
    await writeFile(join(cwd, "CLAUDE.md"), claudeMd, "utf-8");
    log.push("Created CLAUDE.md");
  } else {
    log.push("Skipped CLAUDE.md (preserved user customizations)");
  }

  // Create docs/ directory
  if (!isUpdate) {
    await ensureDir(join(cwd, "docs"));
    log.push("Created docs/");
  }

  return log;
}
