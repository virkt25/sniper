import { defineCommand, runMain } from "citty";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { addPackCommand } from "./commands/add-pack.js";
import { removePackCommand } from "./commands/remove-pack.js";
import { listPacksCommand } from "./commands/list-packs.js";
import { updateCommand } from "./commands/update.js";

const main = defineCommand({
  meta: {
    name: "sniper",
    version: "0.1.0",
    description: "SNIPER — Spawn, Navigate, Implement, Parallelize, Evaluate, Release",
  },
  subCommands: {
    init: initCommand,
    status: statusCommand,
    "add-pack": addPackCommand,
    "remove-pack": removePackCommand,
    "list-packs": listPacksCommand,
    update: updateCommand,
  },
});

runMain(main);
