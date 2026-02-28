import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists, readRawConfig, isV2Config, DEFAULT_BUDGETS } from "../config.js";
import type { SniperConfigV3 } from "../config.js";
import { scaffoldProject } from "../scaffolder.js";
import { pathExists } from "../fs-utils.js";
import { readdir } from "node:fs/promises";
import { join, basename } from "node:path";

async function detectLanguage(cwd: string): Promise<string | null> {
  const checks: Array<[string[], string]> = [
    [["tsconfig.json"], "typescript"],
    [["pyproject.toml", "requirements.txt"], "python"],
    [["go.mod"], "go"],
    [["Cargo.toml"], "rust"],
    [["pom.xml", "build.gradle"], "java"],
    [["package.json"], "javascript"],
  ];

  for (const [files, lang] of checks) {
    for (const file of files) {
      if (await pathExists(join(cwd, file))) return lang;
    }
  }
  return null;
}

async function detectPackageManager(cwd: string): Promise<string> {
  const checks: Array<[string, string]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
    ["uv.lock", "uv"],
    ["poetry.lock", "poetry"],
  ];

  for (const [file, pm] of checks) {
    if (await pathExists(join(cwd, file))) return pm;
  }
  return "npm";
}

async function detectTestRunner(cwd: string): Promise<string | null> {
  const checks: Array<[string[], string]> = [
    [["vitest.config.ts", "vitest.config.js", "vitest.config.mts"], "vitest"],
    [["jest.config.ts", "jest.config.js", "jest.config.mjs"], "jest"],
    [["pytest.ini", "conftest.py", "pyproject.toml"], "pytest"],
  ];

  for (const [files, runner] of checks) {
    for (const file of files) {
      if (await pathExists(join(cwd, file))) return runner;
    }
  }
  return null;
}

export const initCommand = defineCommand({
  meta: {
    name: "init",
    description: "Initialize SNIPER v3 in a project",
  },
  run: async () => {
    const cwd = process.cwd();

    p.intro("SNIPER v3 — Project Initialization");

    // Check for existing config
    if (await sniperConfigExists(cwd)) {
      const raw = await readRawConfig(cwd);
      if (isV2Config(raw)) {
        p.log.warning(
          'Detected SNIPER v2 config. Run "sniper migrate" to upgrade, or reinitialize.',
        );
      }

      const overwrite = await p.confirm({
        message: "SNIPER is already initialized. Reinitialize?",
        initialValue: false,
      });
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel("Aborted.");
        process.exit(0);
      }
    }

    // Auto-detect
    const detectedLang = await detectLanguage(cwd);
    const detectedPM = await detectPackageManager(cwd);
    const detectedTestRunner = await detectTestRunner(cwd);
    const dirName = basename(cwd);

    // Gather user input
    const projectName = await p.text({
      message: "Project name:",
      placeholder: dirName,
      initialValue: dirName,
      validate: (v) => (v.length === 0 ? "Project name is required" : undefined),
    });
    if (p.isCancel(projectName)) { p.cancel("Aborted."); process.exit(0); }

    const projectType = await p.select({
      message: "Project type:",
      options: [
        { value: "saas", label: "SaaS" },
        { value: "api", label: "API" },
        { value: "mobile", label: "Mobile" },
        { value: "cli", label: "CLI" },
        { value: "library", label: "Library" },
        { value: "monorepo", label: "Monorepo" },
      ],
    });
    if (p.isCancel(projectType)) { p.cancel("Aborted."); process.exit(0); }

    const description = await p.text({
      message: "One-line description:",
      placeholder: "A brief description",
    });
    if (p.isCancel(description)) { p.cancel("Aborted."); process.exit(0); }

    const language = await p.select({
      message: `Primary language${detectedLang ? ` (detected: ${detectedLang})` : ""}:`,
      initialValue: detectedLang || "typescript",
      options: [
        { value: "typescript", label: "TypeScript" },
        { value: "javascript", label: "JavaScript" },
        { value: "python", label: "Python" },
        { value: "go", label: "Go" },
        { value: "rust", label: "Rust" },
        { value: "java", label: "Java" },
      ],
    });
    if (p.isCancel(language)) { p.cancel("Aborted."); process.exit(0); }

    const maxTeammates = await p.text({
      message: "Max concurrent agent teammates:",
      placeholder: "5",
      initialValue: "5",
      validate: (v) => {
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 1 || n > 10) return "Must be 1-10";
        return undefined;
      },
    });
    if (p.isCancel(maxTeammates)) { p.cancel("Aborted."); process.exit(0); }

    // Build v3 config
    const config: SniperConfigV3 = {
      project: {
        name: projectName as string,
        type: projectType as string,
        description: (description as string) || "",
      },
      agents: {
        default_model: "sonnet",
        planning_model: "opus",
        max_teammates: parseInt(maxTeammates as string, 10),
        plan_approval: true,
        coordination_timeout: 30,
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
      ownership: {
        backend: ["src/backend/", "src/api/", "src/services/", "src/db/"],
        frontend: ["src/frontend/", "src/components/", "src/hooks/", "src/styles/", "src/pages/"],
        infrastructure: ["docker/", ".github/", "infra/", "scripts/"],
        tests: ["tests/", "__tests__/", "*.test.*", "*.spec.*"],
        docs: ["docs/"],
      },
      stack: {
        language: language as string,
        frontend: null,
        backend: null,
        database: null,
        infrastructure: null,
        test_runner: detectedTestRunner,
        package_manager: detectedPM,
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

    // Scaffold
    const s = p.spinner();
    s.start("Scaffolding SNIPER v3 project...");

    try {
      const log = await scaffoldProject(cwd, config);
      s.stop("Done!");

      for (const entry of log) {
        p.log.success(entry);
      }

      p.outro(
        'SNIPER v3 initialized. Run "/sniper-flow" to start your first protocol.',
      );
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Scaffolding failed: ${err}`);
      process.exit(1);
    }
  },
});
