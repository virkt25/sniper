import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { readConfig, sniperConfigExists } from "../config.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { pathExists } from "../fs-utils.js";

export const statusCommand = defineCommand({
  meta: {
    name: "status",
    description: "Show SNIPER v3 status and protocol progress",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error(
        'SNIPER is not initialized. Run "sniper init" first.',
      );
      process.exit(1);
    }

    const config = await readConfig(cwd);

    p.intro("SNIPER v3 Status");

    // Project info
    p.log.info(
      `Project: ${config.project.name || "(unnamed)"} (${config.project.type})`,
    );

    // Stack summary
    const stackParts = [
      config.stack.language,
      config.stack.frontend,
      config.stack.backend,
      config.stack.database,
      config.stack.infrastructure,
    ].filter(Boolean);
    p.log.info(`Stack: ${stackParts.join(", ")}`);

    // Agents
    p.log.info(`Agents: ${config.agents.base.length} configured, max ${config.agents.max_teammates} concurrent`);

    // Plugins
    if (config.plugins.length > 0) {
      const pluginNames = config.plugins.map((pk) => pk.name).join(", ");
      p.log.info(`Plugins: ${pluginNames}`);
    }

    // Protocol status (from live-status.yaml)
    const statusPath = join(cwd, ".sniper", "live-status.yaml");
    if (await pathExists(statusPath)) {
      const raw = await readFile(statusPath, "utf-8");
      const liveStatus = YAML.parse(raw);

      if (liveStatus && liveStatus.protocol) {
        p.log.step("Active Protocol:");
        console.log(`  Protocol: ${liveStatus.protocol}`);
        console.log(`  Status:   ${liveStatus.status}`);
        if (liveStatus.current_phase) {
          console.log(`  Phase:    ${liveStatus.current_phase}`);
        }

        // Phase progress
        if (Array.isArray(liveStatus.phases)) {
          for (const phase of liveStatus.phases) {
            const icon =
              phase.status === "completed" ? "\u2713" :
              phase.status === "in_progress" ? "\u25B6" :
              phase.status === "failed" ? "\u2717" : "\u25CB";
            console.log(`  ${icon} ${phase.name.padEnd(16)} ${phase.status}`);
          }
        }

        if (liveStatus.next_action) {
          console.log(`\n  Next: ${liveStatus.next_action}`);
        }
      }
    } else {
      p.log.info("No active protocol. Run /sniper-flow to start.");
    }

    // Routing config
    p.log.step("Protocol Routing:");
    console.log(`  Default: ${config.routing.default}`);

    p.outro("");
  },
});
