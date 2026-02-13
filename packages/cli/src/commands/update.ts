import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists, readConfig } from "../config.js";
import { scaffoldProject } from "../scaffolder.js";

export const updateCommand = defineCommand({
  meta: {
    name: "update",
    description: "Update SNIPER core and installed packs",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error(
        'SNIPER is not initialized in this directory. Run "sniper init" first.',
      );
      process.exit(1);
    }

    p.intro("SNIPER Update");

    // Preserve user's current config (especially state + config customizations)
    const currentConfig = await readConfig(cwd);

    const confirm = await p.confirm({
      message:
        "This will update framework files (personas, teams, templates, etc.) while preserving your config.yaml customizations. Continue?",
    });
    if (p.isCancel(confirm) || !confirm) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const s = p.spinner();
    s.start("Updating framework files...");

    try {
      // Re-scaffold in update mode: overwrites framework files but preserves
      // user-customizable files (CLAUDE.md, settings.json, config.yaml)
      const log = await scaffoldProject(cwd, currentConfig, { update: true });

      s.stop("Done!");
      for (const entry of log) {
        p.log.success(entry);
      }
      p.outro("SNIPER updated successfully.");
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Update failed: ${err}`);
      process.exit(1);
    }
  },
});
