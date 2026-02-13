import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import { removePack } from "../pack-manager.js";

export const removePackCommand = defineCommand({
  meta: {
    name: "remove-pack",
    description: "Remove a domain pack from the current project",
  },
  args: {
    name: {
      type: "positional",
      description: "Pack name to remove (e.g., sales-dialer)",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error(
        'SNIPER is not initialized in this directory. Run "sniper init" first.',
      );
      process.exit(1);
    }

    const confirm = await p.confirm({
      message: `Remove pack "${args.name}" and all its files?`,
    });
    if (p.isCancel(confirm) || !confirm) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const s = p.spinner();
    s.start(`Removing ${args.name}...`);

    try {
      await removePack(args.name, cwd);
      s.stop("Done!");
      p.log.success(`Removed pack "${args.name}"`);
      p.log.success("Updated config.yaml");
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`${err}`);
      process.exit(1);
    }
  },
});
