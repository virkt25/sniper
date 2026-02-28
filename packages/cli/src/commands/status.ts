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

        // Cost
        if (liveStatus.cost && typeof liveStatus.cost.percent === "number" && typeof liveStatus.cost.tokens_used === "number" && typeof liveStatus.cost.budget === "number") {
          const pct = Math.round(liveStatus.cost.percent * 100);
          const bar = "=".repeat(Math.floor(pct / 5)) + "-".repeat(20 - Math.floor(pct / 5));
          console.log(`\n  Cost: ${(liveStatus.cost.tokens_used / 1000).toFixed(0)}K / ${(liveStatus.cost.budget / 1000).toFixed(0)}K tokens (${pct}%)`);
          console.log(`  [${bar}] ${pct}%`);
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
    console.log(`  Budgets: full=${(config.routing.budgets.full / 1000000).toFixed(1)}M, feature=${(config.routing.budgets.feature / 1000).toFixed(0)}K, patch=${(config.routing.budgets.patch / 1000).toFixed(0)}K`);

    // Velocity data
    const velocityPath = join(cwd, ".sniper", "memory", "velocity.yaml");
    if (await pathExists(velocityPath)) {
      const velRaw = await readFile(velocityPath, "utf-8");
      const velocity = YAML.parse(velRaw);

      if (velocity && velocity.calibrated_budgets && Object.keys(velocity.calibrated_budgets).length > 0) {
        p.log.step("Velocity (calibrated budgets):");
        for (const [protocol, budget] of Object.entries(velocity.calibrated_budgets)) {
          const configured = config.routing.budgets[protocol];
          const calibrated = budget as number;
          const avg = velocity.rolling_averages?.[protocol] as number | undefined;
          const avgStr = avg ? `${(avg / 1000).toFixed(0)}K avg` : "";
          const trend = configured && calibrated < configured * 0.9 ? "↓" : calibrated > configured * 1.1 ? "↑" : "→";
          console.log(`  ${protocol}: ${avgStr} (calibrated: ${(calibrated / 1000).toFixed(0)}K, configured: ${configured ? (configured / 1000).toFixed(0) + "K" : "N/A"}) ${trend}`);
        }
      }
    }

    p.outro("");
  },
});
