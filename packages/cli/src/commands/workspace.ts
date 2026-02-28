import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import {
  findWorkspaceRoot,
  readWorkspaceConfig,
  initWorkspace,
  addProject,
  syncConventions,
} from "../workspace-manager.js";

const initSubcommand = defineCommand({
  meta: {
    name: "init",
    description: "Initialize a SNIPER workspace for multi-project orchestration",
  },
  args: {
    name: {
      type: "string",
      description: "Workspace name",
      required: false,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    p.intro("SNIPER Workspace — Initialization");

    const existing = await findWorkspaceRoot(cwd);
    if (existing) {
      p.log.warning(`Workspace already exists at ${existing}`);
      const overwrite = await p.confirm({
        message: "Reinitialize workspace?",
        initialValue: false,
      });
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel("Aborted.");
        process.exit(0);
      }
    }

    let name = args.name;
    if (!name) {
      const input = await p.text({
        message: "Workspace name:",
        placeholder: "my-workspace",
        validate: (v) => (v.length === 0 ? "Name is required" : undefined),
      });
      if (p.isCancel(input)) { p.cancel("Aborted."); process.exit(0); }
      name = input as string;
    }

    const s = p.spinner();
    s.start("Creating workspace...");

    try {
      const wsDir = await initWorkspace(cwd, name);
      s.stop("Done!");
      p.log.success(`Workspace "${name}" created at ${wsDir}`);
      p.log.info("Created: config.yaml, memory/, locks/");
      p.outro('Add projects with "sniper workspace add <name> --path <dir>"');
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Workspace init failed: ${err}`);
      process.exit(1);
    }
  },
});

const addSubcommand = defineCommand({
  meta: {
    name: "add",
    description: "Add a project to the workspace",
  },
  args: {
    name: {
      type: "positional",
      description: "Project name",
      required: true,
    },
    path: {
      type: "string",
      description: "Relative path to the project directory",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();
    const wsRoot = await findWorkspaceRoot(cwd);

    if (!wsRoot) {
      p.log.error('No workspace found. Run "sniper workspace init" first.');
      process.exit(1);
    }

    try {
      await addProject(wsRoot, args.name, args.path);
      p.log.success(`Added project "${args.name}" (${args.path}) to workspace.`);
    } catch (err) {
      p.log.error(`Failed to add project: ${err}`);
      process.exit(1);
    }
  },
});

const statusSubcommand = defineCommand({
  meta: {
    name: "status",
    description: "Show workspace status",
  },
  run: async () => {
    const cwd = process.cwd();
    const wsRoot = await findWorkspaceRoot(cwd);

    if (!wsRoot) {
      p.log.error('No workspace found. Run "sniper workspace init" first.');
      process.exit(1);
    }

    const config = await readWorkspaceConfig(wsRoot);

    p.intro(`Workspace: ${config.name}`);

    // Projects
    p.log.step("Projects:");
    if (config.projects.length === 0) {
      console.log("  (none)");
    } else {
      for (const proj of config.projects) {
        const typeLabel = proj.type ? ` (${proj.type})` : "";
        console.log(`  - ${proj.name}: ${proj.path}${typeLabel}`);
      }
    }

    // Shared conventions
    const conventions = config.shared?.conventions ?? [];
    p.log.info(`Shared conventions: ${conventions.length}`);

    // Anti-patterns
    const antiPatterns = config.shared?.anti_patterns ?? [];
    p.log.info(`Anti-patterns: ${antiPatterns.length}`);

    // ADRs
    const adrs = config.shared?.architectural_decisions ?? [];
    p.log.info(`Architectural decisions: ${adrs.length}`);

    // Memory
    const memDir = config.memory?.directory;
    p.log.info(`Memory: ${memDir ? memDir : "not configured"}`);

    p.outro("");
  },
});

const syncSubcommand = defineCommand({
  meta: {
    name: "sync",
    description: "Sync shared conventions to workspace projects",
  },
  run: async () => {
    const cwd = process.cwd();
    const wsRoot = await findWorkspaceRoot(cwd);

    if (!wsRoot) {
      p.log.error('No workspace found. Run "sniper workspace init" first.');
      process.exit(1);
    }

    const s = p.spinner();
    s.start("Syncing conventions...");

    try {
      const synced = await syncConventions(wsRoot);
      s.stop("Done!");
      if (synced.length === 0) {
        p.log.info("No projects with .sniper/config.yaml found to sync.");
      } else {
        for (const name of synced) {
          p.log.success(`Checked: ${name}`);
        }
      }
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Sync failed: ${err}`);
      process.exit(1);
    }
  },
});

export const workspaceCommand = defineCommand({
  meta: {
    name: "workspace",
    description: "Manage SNIPER workspaces for multi-project orchestration",
  },
  subCommands: {
    init: initSubcommand,
    add: addSubcommand,
    status: statusSubcommand,
    sync: syncSubcommand,
  },
});
