import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists, readConfig, writeConfig } from "../config.js";
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
      // Re-scaffold, which overwrites framework files
      await scaffoldProject(cwd, currentConfig);

      // Restore the original config (scaffolding wrote a fresh one from the template,
      // but we want to keep the user's customizations)
      await writeConfig(cwd, currentConfig);

      s.stop("Done!");
      p.log.success("Framework files updated");
      p.log.success("Config preserved");
      p.outro("SNIPER updated successfully.");
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Update failed: ${err}`);
      process.exit(1);
    }
  },
});
