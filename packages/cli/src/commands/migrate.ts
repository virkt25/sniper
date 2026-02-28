import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import {
  sniperConfigExists,
  readRawConfig,
  isV2Config,
  isV3Config,
  writeConfig,
  DEFAULT_BUDGETS,
} from "../config.js";
import type { SniperConfigV2, SniperConfigV3 } from "../config.js";
import { scaffoldProject } from "../scaffolder.js";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";

function migrateV2ToV3(v2: SniperConfigV2): SniperConfigV3 {
  return {
    project: {
      name: v2.project.name,
      type: v2.project.type,
      description: v2.project.description || "",
    },
    agents: {
      default_model: v2.agent_teams?.default_model || "sonnet",
      planning_model: v2.agent_teams?.planning_model || "opus",
      max_teammates: v2.agent_teams?.max_teammates || 5,
      plan_approval: v2.agent_teams?.plan_approval ?? true,
      coordination_timeout: v2.agent_teams?.coordination_timeout || 30,
      base: [
        "lead-orchestrator",
        "analyst",
        "architect",
        "product-manager",
        "backend-dev",
        "frontend-dev",
        "qa-engineer",
        "code-reviewer",
        "gate-reviewer",
        "retro-analyst",
      ],
      mixins: {},
    },
    routing: {
      auto_detect: {
        patch_max_files: 5,
        feature_max_files: 20,
      },
      default: "feature",
      budgets: { ...DEFAULT_BUDGETS },
    },
    cost: {
      warn_threshold: 0.7,
      soft_cap: 0.9,
      hard_cap: 1.0,
    },
    review: {
      multi_model: false,
      models: ['opus', 'sonnet'],
      require_consensus: true,
    },
    ownership: v2.ownership || {},
    stack: {
      language: v2.stack?.language || "",
      frontend: (v2.stack?.frontend as string) || null,
      backend: (v2.stack?.backend as string) || null,
      database: (v2.stack?.database as string) || null,
      infrastructure: (v2.stack?.infrastructure as string) || null,
      test_runner: (v2.stack?.test_runner as string) || null,
      package_manager: (v2.stack?.package_manager as string) || "npm",
      commands: {
        test: "",
        lint: "",
        typecheck: "",
        build: "",
      },
    },
    plugins: [],
    triggers: [],
    visibility: {
      live_status: true,
      checkpoints: true,
      cost_tracking: true,
      auto_retro: true,
    },
  };
}

export const migrateCommand = defineCommand({
  meta: {
    name: "migrate",
    description: "Migrate SNIPER v2 config to v3",
  },
  run: async () => {
    const cwd = process.cwd();

    p.intro("SNIPER v2 → v3 Migration");

    if (!(await sniperConfigExists(cwd))) {
      p.log.error(
        'No SNIPER config found. Run "sniper init" to initialize a new project.',
      );
      process.exit(1);
    }

    const raw = await readRawConfig(cwd);

    if (isV3Config(raw)) {
      p.log.info("This project already uses SNIPER v3 config. No migration needed.");
      p.outro("");
      return;
    }

    if (!isV2Config(raw)) {
      p.log.error("Unrecognized config format. Cannot migrate.");
      process.exit(1);
    }

    const v2Config = raw as SniperConfigV2;
    p.log.info(`Migrating project: ${v2Config.project.name}`);

    // Backup v2 config
    const backupPath = join(cwd, ".sniper", "config.v2.yaml");
    const backupContent = await readFile(join(cwd, ".sniper", "config.yaml"), "utf-8");
    await writeFile(backupPath, backupContent, "utf-8");
    p.log.success("Backed up v2 config to .sniper/config.v2.yaml");

    // Convert
    const v3Config = migrateV2ToV3(v2Config);

    // Show what changed
    p.log.step("Migration changes:");
    console.log("  - review_gates → protocol-based gates");
    console.log("  - agent_teams → agents (with base roster + mixins)");
    console.log("  - domain_packs → plugins");
    console.log("  - state tracking → checkpoint files");
    console.log("  + routing (auto protocol selection)");
    console.log("  + cost enforcement");
    console.log("  + visibility settings");

    const confirm = await p.confirm({
      message: "Apply migration and re-scaffold?",
      initialValue: true,
    });
    if (p.isCancel(confirm) || !confirm) {
      p.cancel("Aborted. v2 config preserved.");
      process.exit(0);
    }

    // Scaffold first, then write config — if scaffold fails, v2 config is preserved
    const s = p.spinner();
    s.start("Re-scaffolding with v3 structure...");

    try {
      const log = await scaffoldProject(cwd, v3Config, { update: true });
      // Scaffold succeeded — now safe to write v3 config
      await writeConfig(cwd, v3Config);
      s.stop("Done!");

      p.log.success("Wrote v3 config");
      for (const entry of log) {
        p.log.success(entry);
      }

      p.log.warning(
        "Review .sniper/config.yaml to configure stack commands (test, lint, build) and agent mixins.",
      );
      p.outro("Migration complete.");
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Migration failed: ${err}`);
      p.log.info("Your v2 config is preserved at .sniper/config.yaml (backup also at .sniper/config.v2.yaml)");
      process.exit(1);
    }
  },
});
