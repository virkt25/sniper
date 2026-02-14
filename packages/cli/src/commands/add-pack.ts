import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import { installPack } from "../pack-manager.js";

export const addPackCommand = defineCommand({
  meta: {
    name: "add-pack",
    description: "Add a domain pack to the current project",
  },
  args: {
    name: {
      type: "positional",
      description:
        "Pack name or full npm package name (e.g., sales-dialer or @sniperai/pack-sales-dialer)",
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

    // Resolve package name
    let packageName = args.name;
    if (!packageName.startsWith("@") && !packageName.includes("/")) {
      packageName = `@sniperai/pack-${packageName}`;
    }

    const s = p.spinner();
    s.start(`Installing ${packageName}...`);

    try {
      const result = await installPack(packageName, cwd);
      s.stop("Done!");

      p.log.success(`Installed ${result.package}@${result.version}`);
      p.log.success(
        `Copied pack to .sniper/domain-packs/${result.name}/`,
      );
      p.log.success("Updated config.yaml with pack reference");
      p.log.info(
        `\nPack "${result.name}" added. ${result.contextCount} context files available.`,
      );
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`${err}`);
      process.exit(1);
    }
  },
});
