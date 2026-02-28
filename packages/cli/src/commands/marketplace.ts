import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import {
  searchPackages,
  getPackageInfo,
  validatePublishable,
} from "../marketplace-client.js";
import { installPlugin } from "../plugin-manager.js";

const searchSubcommand = defineCommand({
  meta: {
    name: "search",
    description: "Search the SNIPER marketplace for packages",
  },
  args: {
    query: {
      type: "positional",
      description: "Search query",
      required: true,
    },
  },
  run: async ({ args }) => {
    const s = p.spinner();
    s.start("Searching marketplace...");

    try {
      const result = await searchPackages(args.query);
      s.stop("Done!");

      if (result.packages.length === 0) {
        p.log.info("No packages found.");
        return;
      }

      p.log.step(`Found ${result.total} result(s):`);
      console.log(
        `  ${"Name".padEnd(35)} ${"Version".padEnd(10)} ${"Type".padEnd(8)} Description`,
      );
      console.log(`  ${"─".repeat(35)} ${"─".repeat(10)} ${"─".repeat(8)} ${"─".repeat(30)}`);
      for (const pkg of result.packages) {
        const desc =
          pkg.description.length > 40
            ? pkg.description.slice(0, 37) + "..."
            : pkg.description;
        console.log(
          `  ${pkg.name.padEnd(35)} ${pkg.version.padEnd(10)} ${pkg.sniperType.padEnd(8)} ${desc}`,
        );
      }
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Search failed: ${err}`);
      process.exit(1);
    }
  },
});

const installSubcommand = defineCommand({
  meta: {
    name: "install",
    description: "Install a package from the SNIPER marketplace",
  },
  args: {
    package: {
      type: "positional",
      description: "Package name to install",
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
    s.start(`Checking ${args.package}...`);

    try {
      const info = await getPackageInfo(args.package);
      if (!info) {
        s.stop("Failed!");
        p.log.error(
          `${args.package} is not a valid SNIPER package (not found or missing sniper metadata).`,
        );
        process.exit(1);
      }

      s.message(`Installing ${args.package}...`);
      const result = await installPlugin(args.package, cwd);
      s.stop("Done!");
      p.log.success(
        `Installed ${info.sniperType}: ${result.name} v${result.version}`,
      );
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Installation failed: ${err}`);
      process.exit(1);
    }
  },
});

const infoSubcommand = defineCommand({
  meta: {
    name: "info",
    description: "Show details about a SNIPER marketplace package",
  },
  args: {
    package: {
      type: "positional",
      description: "Package name to inspect",
      required: true,
    },
  },
  run: async ({ args }) => {
    const s = p.spinner();
    s.start(`Fetching info for ${args.package}...`);

    try {
      const info = await getPackageInfo(args.package);
      s.stop("Done!");

      if (!info) {
        p.log.error(
          `${args.package} not found or is not a SNIPER package.`,
        );
        process.exit(1);
      }

      p.log.step(`Package: ${info.name}`);
      console.log(`  Version:     ${info.version}`);
      console.log(`  Type:        ${info.sniperType}`);
      console.log(`  Description: ${info.description || "(none)"}`);
      console.log(`  Tags:        ${info.tags.length > 0 ? info.tags.join(", ") : "(none)"}`);
      console.log(`  Author:      ${info.author || "(unknown)"}`);
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Fetch failed: ${err}`);
      process.exit(1);
    }
  },
});

const publishSubcommand = defineCommand({
  meta: {
    name: "publish",
    description: "Validate and guide publishing a SNIPER package",
  },
  run: async () => {
    const cwd = process.cwd();
    const s = p.spinner();
    s.start("Validating package...");

    try {
      const result = await validatePublishable(cwd);
      s.stop("Done!");

      if (!result.valid) {
        p.log.error("Package is not publishable:");
        for (const err of result.errors) {
          console.log(`  - ${err}`);
        }
        process.exit(1);
      }

      p.log.success("Package is valid and ready to publish.");
      p.log.info('Run "npm publish" to publish your package to the marketplace.');
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Validation failed: ${err}`);
      process.exit(1);
    }
  },
});

export const marketplaceCommand = defineCommand({
  meta: {
    name: "marketplace",
    description: "Browse and manage SNIPER marketplace packages",
  },
  subCommands: {
    search: searchSubcommand,
    install: installSubcommand,
    info: infoSubcommand,
    publish: publishSubcommand,
  },
});
