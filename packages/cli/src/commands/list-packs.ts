import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import { listInstalledPacks, searchRegistryPacks } from "../pack-manager.js";

export const listPacksCommand = defineCommand({
  meta: {
    name: "list-packs",
    description: "List available and installed domain packs",
  },
  run: async () => {
    const cwd = process.cwd();

    p.intro("SNIPER Domain Packs");

    // Show available packs from registry
    const s = p.spinner();
    s.start("Searching npm registry for @sniper.ai/pack-*...");
    const available = await searchRegistryPacks();
    s.stop(
      available.length > 0
        ? `Found ${available.length} pack(s) on npm`
        : "No packs found on npm registry (packages may not be published yet)",
    );

    if (available.length > 0) {
      p.log.step("Available packs:");
      for (const pkg of available) {
        console.log(
          `  ${pkg.name.padEnd(40)} v${pkg.version.padEnd(10)} ${pkg.description}`,
        );
      }
    }

    // Show installed packs (if SNIPER is initialized)
    if (await sniperConfigExists(cwd)) {
      const installed = await listInstalledPacks(cwd);
      if (installed.length > 0) {
        p.log.step("\nInstalled:");
        for (const pack of installed) {
          console.log(`  ${pack.name.padEnd(20)} v${pack.version}`);
        }
      } else {
        p.log.info("\nNo packs installed.");
      }
    }

    p.outro("");
  },
});
