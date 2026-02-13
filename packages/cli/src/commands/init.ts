import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists, type SniperConfig } from "../config.js";
import { scaffoldProject } from "../scaffolder.js";

export const initCommand = defineCommand({
  meta: {
    name: "init",
    description: "Initialize a new SNIPER-enabled project",
  },
  run: async () => {
    const cwd = process.cwd();

    p.intro("SNIPER — Project Initialization");

    // Check if already initialized
    if (await sniperConfigExists(cwd)) {
      const overwrite = await p.confirm({
        message:
          "SNIPER is already initialized in this directory. Reinitialize?",
        initialValue: false,
      });
      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel("Aborted.");
        process.exit(0);
      }
    }

    const projectName = await p.text({
      message: "Project name:",
      placeholder: "my-app",
      validate: (v) => (v.length === 0 ? "Project name is required" : undefined),
    });
    if (p.isCancel(projectName)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

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
    if (p.isCancel(projectType)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const description = await p.text({
      message: "One-line project description:",
      placeholder: "A brief description of your project",
    });
    if (p.isCancel(description)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const language = await p.select({
      message: "Primary language:",
      options: [
        { value: "typescript", label: "TypeScript" },
        { value: "python", label: "Python" },
        { value: "go", label: "Go" },
        { value: "rust", label: "Rust" },
        { value: "java", label: "Java" },
      ],
    });
    if (p.isCancel(language)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const frontend = await p.select({
      message: "Frontend framework:",
      options: [
        { value: "react", label: "React" },
        { value: "nextjs", label: "Next.js" },
        { value: "vue", label: "Vue" },
        { value: "svelte", label: "Svelte" },
        { value: "none", label: "None" },
      ],
    });
    if (p.isCancel(frontend)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const backend = await p.select({
      message: "Backend framework:",
      options: [
        { value: "node-express", label: "Node + Express" },
        { value: "node-fastify", label: "Node + Fastify" },
        { value: "django", label: "Django" },
        { value: "fastapi", label: "FastAPI" },
        { value: "gin", label: "Go Gin" },
        { value: "none", label: "None" },
      ],
    });
    if (p.isCancel(backend)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const database = await p.select({
      message: "Primary database:",
      options: [
        { value: "postgresql", label: "PostgreSQL" },
        { value: "mysql", label: "MySQL" },
        { value: "mongodb", label: "MongoDB" },
        { value: "sqlite", label: "SQLite" },
        { value: "none", label: "None" },
      ],
    });
    if (p.isCancel(database)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const infrastructure = await p.select({
      message: "Cloud infrastructure:",
      options: [
        { value: "aws", label: "AWS" },
        { value: "gcp", label: "Google Cloud" },
        { value: "azure", label: "Azure" },
        { value: "vercel", label: "Vercel" },
        { value: "none", label: "None / Self-hosted" },
      ],
    });
    if (p.isCancel(infrastructure)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

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
    if (p.isCancel(maxTeammates)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    // Build config
    const config: SniperConfig = {
      project: {
        name: projectName as string,
        type: projectType as string,
        description: (description as string) || "",
      },
      stack: {
        language: language as string,
        frontend: frontend === "none" ? null : (frontend as string),
        backend: backend === "none" ? null : (backend as string),
        database: database === "none" ? null : (database as string),
        cache: null,
        infrastructure:
          infrastructure === "none" ? null : (infrastructure as string),
        test_runner: null,
        package_manager: "pnpm",
      },
      review_gates: {
        after_discover: "flexible",
        after_plan: "strict",
        after_solve: "flexible",
        after_sprint: "strict",
      },
      agent_teams: {
        max_teammates: parseInt(maxTeammates as string, 10),
        default_model: "sonnet",
        planning_model: "opus",
        delegate_mode: true,
        plan_approval: true,
        coordination_timeout: 30,
      },
      domain_packs: [],
      ownership: {
        backend: [
          "src/backend/",
          "src/api/",
          "src/services/",
          "src/db/",
          "src/workers/",
        ],
        frontend: [
          "src/frontend/",
          "src/components/",
          "src/hooks/",
          "src/styles/",
          "src/pages/",
        ],
        infrastructure: [
          "docker/",
          ".github/",
          "infra/",
          "terraform/",
          "scripts/",
        ],
        tests: ["tests/", "__tests__/", "*.test.*", "*.spec.*"],
        ai: ["src/ai/", "src/ml/", "src/pipeline/"],
        docs: ["docs/"],
      },
      state: {
        current_phase: null,
        phase_history: [],
        current_sprint: 0,
        artifacts: {
          brief: null,
          prd: null,
          architecture: null,
          ux_spec: null,
          security: null,
          epics: null,
          stories: null,
        },
      },
    };

    // Scaffold
    const s = p.spinner();
    s.start("Scaffolding SNIPER project...");

    try {
      const log = await scaffoldProject(cwd, config);
      s.stop("Done!");

      for (const entry of log) {
        p.log.success(entry);
      }

      p.outro(
        'SNIPER initialized. Run "sniper add-pack <name>" to add domain packs.',
      );
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Scaffolding failed: ${err}`);
      process.exit(1);
    }
  },
});
