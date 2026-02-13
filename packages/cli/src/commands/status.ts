import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { readConfig, sniperConfigExists } from "../config.js";

const ARTIFACT_ICONS: Record<string, string> = {
  approved: "\u2713",
  draft: "\u25D0",
};

export const statusCommand = defineCommand({
  meta: {
    name: "status",
    description: "Show SNIPER lifecycle status and artifact state",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error(
        'SNIPER is not initialized in this directory. Run "sniper init" first.',
      );
      process.exit(1);
    }

    const config = await readConfig(cwd);

    p.intro("SNIPER Status");

    // Project info
    p.log.info(
      `Project: ${config.project.name || "(unnamed)"} (${config.project.type})`,
    );
    p.log.info(
      `Phase: ${config.state.current_phase || "not started"}`,
    );
    if (config.state.current_sprint > 0) {
      p.log.info(`Sprint: ${config.state.current_sprint}`);
    }

    // Artifacts
    p.log.step("Artifacts:");
    const artifacts = config.state.artifacts;
    for (const [name, status] of Object.entries(artifacts)) {
      const icon = status ? (ARTIFACT_ICONS[status] || "?") : "\u25CB";
      const label = status || "\u2014";
      console.log(`  ${icon} ${name.padEnd(16)} ${label}`);
    }

    // Domain pack
    if (config.domain_pack) {
      p.log.info(`\nPack: ${config.domain_pack}`);
    }

    // Stack summary
    const stack = config.stack;
    const stackParts = [
      stack.language,
      stack.frontend,
      stack.backend,
      stack.database,
      stack.infrastructure,
    ].filter(Boolean);
    p.log.info(`Stack: ${stackParts.join(", ")}`);

    p.outro("");
  },
});
