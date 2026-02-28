import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import {
  installPlugin,
  removePlugin,
  listPlugins,
} from "../plugin-manager.js";

const installSubcommand = defineCommand({
  meta: {
    name: "install",
    description: "Install a SNIPER plugin",
  },
  args: {
    package: {
      type: "positional",
      description: "Plugin package name (e.g. @sniper.ai/plugin-typescript)",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const s = p.spinner();
    s.start(`Installing ${args.package}...`);

    try {
      const result = await installPlugin(args.package, cwd);
      s.stop("Done!");
      p.log.success(`Installed plugin: ${result.name} v${result.version}`);
      p.log.info("Plugin mixins and hooks have been merged into your project.");
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Installation failed: ${err}`);
      process.exit(1);
    }
  },
});

const removeSubcommand = defineCommand({
  meta: {
    name: "remove",
    description: "Remove a SNIPER plugin",
  },
  args: {
    name: {
      type: "positional",
      description: "Plugin name to remove",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const s = p.spinner();
    s.start(`Removing ${args.name}...`);

    try {
      await removePlugin(args.name, cwd);
      s.stop("Done!");
      p.log.success(`Removed plugin: ${args.name}`);
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Removal failed: ${err}`);
      process.exit(1);
    }
  },
});

const listSubcommand = defineCommand({
  meta: {
    name: "list",
    description: "List installed SNIPER plugins",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const plugins = await listPlugins(cwd);

    if (plugins.length === 0) {
      p.log.info("No plugins installed.");
      return;
    }

    p.log.step("Installed plugins:");
    for (const plugin of plugins) {
      console.log(`  - ${plugin.name} (${plugin.package})`);
    }
  },
});

export const pluginCommand = defineCommand({
  meta: {
    name: "plugin",
    description: "Manage SNIPER plugins",
  },
  subCommands: {
    install: installSubcommand,
    remove: removeSubcommand,
    list: listSubcommand,
  },
});
