import { createRequire } from "node:module";
import { defineCommand, runMain } from "citty";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { migrateCommand } from "./commands/migrate.js";
import { pluginCommand } from "./commands/plugin.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const main = defineCommand({
  meta: {
    name: "sniper",
    version,
    description: "SNIPER v3 — AI-Powered Project Lifecycle Framework",
  },
  subCommands: {
    init: initCommand,
    status: statusCommand,
    migrate: migrateCommand,
    plugin: pluginCommand,
  },
});

runMain(main);
