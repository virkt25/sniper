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

function assertSafeName(name: string, kind: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Invalid ${kind} name "${name}": must start with a letter and contain only lowercase letters, digits, and hyphens`,
    );
  }
}

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
 * Uses the Claude Code hooks format where matcher is a regex string:
 *   { matcher: "ToolName", hooks: [{ type, command, description }] }
 * Deduplicates by matcher string and merges hooks arrays.
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
        const typedEntry = entry as Record<string, unknown>;
        // matcher is a regex string (or undefined for catch-all)
        const matcherKey = String(typedEntry.matcher ?? "");

        // Find existing entry with same matcher
        const existing = hooks[event].find(
          (h) => String((h as Record<string, unknown>).matcher ?? "") === matcherKey,
        );

        if (existing) {
          // Merge hooks arrays, dedup by description
          const existingHooks = ((existing as Record<string, unknown>).hooks || []) as Array<Record<string, unknown>>;
          const newHooks = (typedEntry.hooks || []) as Array<Record<string, unknown>>;
          for (const hook of newHooks) {
            const alreadyExists = existingHooks.some((h) => h.description === hook.description);
            if (!alreadyExists) {
              existingHooks.push(hook);
            }
          }
          (existing as Record<string, unknown>).hooks = existingHooks;
        } else {
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
  for (const sub of [
    "checkpoints",
    "gates",
    "retros",
    "self-reviews",
    "protocols",
    "knowledge",
    "memory/signals",
  ]) {
    await ensureDir(join(sniperDir, sub));
  }

  // Copy checklists to .sniper/
  const checklistsSrc = join(corePath, "checklists");
  const checklistsDest = join(sniperDir, "checklists");
  await cp(checklistsSrc, checklistsDest, { recursive: true, force: true });
  log.push("Copied checklists/");

  // Copy knowledge manifest template if it doesn't exist
  const manifestTemplate = join(corePath, "templates", "knowledge-manifest.yaml");
  const manifestDest = join(sniperDir, "knowledge", "manifest.yaml");
  if ((await fileExists(manifestTemplate)) && !(await fileExists(manifestDest))) {
    await cp(manifestTemplate, manifestDest);
    log.push("Created .sniper/knowledge/manifest.yaml");
  }

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
    assertSafeName(agentName, "agent");
    const srcFile = join(agentsSrc, `${agentName}.md`);
    if (!(await fileExists(srcFile))) continue;

    const mixinNames = config.agents.mixins[agentName] || [];
    if (mixinNames.length > 0) {
      // Compose agent with mixins
      const mixinPaths = mixinNames.map((m) => {
        assertSafeName(m, "mixin");
        return join(corePath, "personas", "cognitive", `${m}.md`);
      });
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
    try {
      settings = JSON.parse(raw);
    } catch {
      // If settings.json is corrupted, log warning and start fresh
      log.push("Warning: .claude/settings.json was invalid JSON; starting with empty settings");
      settings = {};
    }
  }

  // Read core hooks
  const coreHooksPath = join(corePath, "hooks", "settings-hooks.json");
  if (await fileExists(coreHooksPath)) {
    const coreHooks = JSON.parse(await readFile(coreHooksPath, "utf-8"));
    settings = mergeHooks(settings, coreHooks);
  }

  // Read signal hooks
  const signalHooksPath = join(corePath, "hooks", "signal-hooks.json");
  if (await fileExists(signalHooksPath)) {
    const signalHooks = JSON.parse(await readFile(signalHooksPath, "utf-8"));
    settings = mergeHooks(settings, signalHooks);
  }

  // Read and merge plugin hooks
  if (config.plugins) {
    for (const plugin of config.plugins) {
      const pluginName = plugin.name;
      const pluginYamlPath = join(corePath, "..", "plugins", `plugin-${pluginName}`, "plugin.yaml");
      if (!(await fileExists(pluginYamlPath))) {
        log.push(`Warning: plugin "${pluginName}" not found at ${pluginYamlPath}`);
        continue;
      }
      const pluginContent = YAML.parse(await readFile(pluginYamlPath, "utf-8"));
      if (pluginContent?.hooks) {
        const pluginHooksFormatted: Record<string, unknown[]> = {};
        for (const [event, entries] of Object.entries(pluginContent.hooks as Record<string, unknown[]>)) {
          if (!Array.isArray(entries)) continue;
          pluginHooksFormatted[event] = entries.map((entry: unknown) => {
            // Standard format: { matcher: "string", hooks: [...] }
            if (
              typeof entry === "object" &&
              entry !== null &&
              "hooks" in entry &&
              Array.isArray((entry as Record<string, unknown>).hooks)
            ) {
              const e = entry as Record<string, unknown>;
              // Convert legacy object matcher to string if needed
              if (typeof e.matcher === "object" && e.matcher !== null) {
                const tools = (e.matcher as Record<string, unknown>).tools;
                if (Array.isArray(tools)) {
                  e.matcher = tools.join("|");
                } else {
                  delete e.matcher;
                }
              }
              return e;
            }
            // Legacy format: plain string command
            const cmd = String(entry);
            return {
              hooks: [{
                type: "command" as const,
                description: `${pluginName} plugin: ${cmd.split(" ")[0]}`,
                command: cmd,
              }],
            };
          });
        }
        settings = mergeHooks(settings, { hooks: pluginHooksFormatted });
      }
    }
  }

  // Ensure agent teams env is set
  if (!settings.env || typeof settings.env !== "object") {
    settings.env = {};
  }
  (settings.env as Record<string, unknown>).CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1";

  const settingsExisted = isUpdate && (await fileExists(settingsPath));
  await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  log.push(settingsExisted ? "Updated .claude/settings.json hooks" : "Created .claude/settings.json");

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

  // Create artifacts directory and registry (on init or update if missing)
  const artifactsDir = join(sniperDir, "artifacts");
  await ensureDir(artifactsDir);
  const registryTemplate = join(corePath, "templates", "registry.md");
  const registryDest = join(artifactsDir, "registry.md");
  if ((await fileExists(registryTemplate)) && !(await fileExists(registryDest))) {
    await cp(registryTemplate, registryDest);
    log.push(isUpdate ? "Created missing .sniper/artifacts/registry.md" : "Created .sniper/artifacts/registry.md");
  }

  return log;
}
