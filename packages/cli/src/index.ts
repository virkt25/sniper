import { createRequire } from "node:module";
import { defineCommand, runMain } from "citty";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { migrateCommand } from "./commands/migrate.js";
import { pluginCommand } from "./commands/plugin.js";
import { protocolCommand } from "./commands/protocol.js";
import { dashboardCommand } from "./commands/dashboard.js";
import { workspaceCommand } from "./commands/workspace.js";
import { revertCommand } from "./commands/revert.js";
import { runCommand } from "./commands/run.js";
import { marketplaceCommand } from "./commands/marketplace.js";
import { signalCommand } from "./commands/signal.js";
import { knowledgeCommand } from "./commands/knowledge.js";
import { sphereCommand } from "./commands/sphere.js";

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
    protocol: protocolCommand,
    dashboard: dashboardCommand,
    workspace: workspaceCommand,
    revert: revertCommand,
    run: runCommand,
    marketplace: marketplaceCommand,
    signal: signalCommand,
    knowledge: knowledgeCommand,
    sphere: sphereCommand,
  },
});

runMain(main);
