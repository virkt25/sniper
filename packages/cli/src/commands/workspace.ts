import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  access,
  stat,
  symlink,
} from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import YAML from "yaml";
import { sniperConfigExists, readConfig, writeConfig } from "../config.js";

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

interface WorkspaceRepo {
  name: string;
  path: string;
  role: string;
  language: string;
  sniper_enabled: boolean;
  exposes: Array<{ type: string; spec?: string; package?: string }>;
  consumes: Array<{ from: string; type: string; package?: string }>;
}

interface WorkspaceConfig {
  name: string;
  description: string;
  version: string;
  repositories: WorkspaceRepo[];
  dependency_graph: Record<string, string[]>;
  config: {
    contract_format: string;
    integration_validation: boolean;
    shared_domain_packs: string[];
    memory: {
      workspace_conventions: boolean;
      auto_promote: boolean;
    };
  };
  state: {
    feature_counter: number;
    features: Array<{
      id: string;
      title: string;
      phase: string;
      sprint_wave?: number;
      repos_affected: string[];
      created_at: string;
      completed_at?: string;
    }>;
  };
}

const initSubCommand = defineCommand({
  meta: {
    name: "init",
    description: "Initialize a SNIPER workspace",
  },
  run: async () => {
    const cwd = process.cwd();

    // Check if workspace already exists
    if (await pathExists(join(cwd, "workspace.yaml"))) {
      const raw = await readFile(join(cwd, "workspace.yaml"), "utf-8");
      const ws = YAML.parse(raw) as WorkspaceConfig;
      p.log.warn(
        `A workspace already exists: ${ws.name} (${ws.repositories.length} repos)`,
      );
      p.log.info("Use /sniper-workspace status to view details.");
      process.exit(0);
    }

    p.intro("Initialize SNIPER Workspace");

    // Gather workspace info
    const name = await p.text({
      message: "Workspace name:",
      placeholder: "my-saas-platform",
    });
    if (p.isCancel(name)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    const description = await p.text({
      message: "Description:",
      placeholder: "Multi-service SaaS platform",
    });
    if (p.isCancel(description)) {
      p.cancel("Aborted.");
      process.exit(0);
    }

    // Scan for SNIPER-enabled repos
    const s = p.spinner();
    s.start("Scanning for SNIPER-enabled repositories...");

    const parentDir = resolve(cwd, "..");
    const repos: WorkspaceRepo[] = [];

    try {
      const siblings = await readdir(parentDir);
      for (const entry of siblings) {
        const entryPath = join(parentDir, entry);
        const entryStat = await stat(entryPath);
        if (!entryStat.isDirectory()) continue;
        if (resolve(entryPath) === resolve(cwd)) continue;

        const configPath = join(entryPath, ".sniper", "config.yaml");
        if (await pathExists(configPath)) {
          try {
            const raw = await readFile(configPath, "utf-8");
            const config = YAML.parse(raw);
            repos.push({
              name: config.project?.name || entry,
              path: relative(cwd, entryPath),
              role: inferRole(config.project?.type),
              language: config.stack?.language || "unknown",
              sniper_enabled: true,
              exposes: [],
              consumes: [],
            });
          } catch {
            // Skip malformed configs
          }
        }
      }
    } catch {
      // Parent directory not readable
    }

    s.stop(`Found ${repos.length} SNIPER-enabled repositories`);

    if (repos.length === 0) {
      p.log.warn(
        "No SNIPER-enabled repositories found in sibling directories.",
      );
      p.log.info(
        'Initialize SNIPER in your repos first with "sniper init", or add repos manually later.',
      );
    } else {
      for (const repo of repos) {
        p.log.info(`  ${repo.name} (${repo.role}, ${repo.language}) ${repo.path}`);
      }
    }

    // Build dependency graph (empty by default — user configures)
    const depGraph: Record<string, string[]> = {};
    for (const repo of repos) {
      depGraph[repo.name] = [];
    }

    // Generate workspace.yaml
    const workspace: WorkspaceConfig = {
      name: name as string,
      description: description as string,
      version: "1.0",
      repositories: repos,
      dependency_graph: depGraph,
      config: {
        contract_format: "yaml",
        integration_validation: true,
        shared_domain_packs: [],
        memory: {
          workspace_conventions: true,
          auto_promote: false,
        },
      },
      state: {
        feature_counter: 1,
        features: [],
      },
    };

    await writeFile(
      join(cwd, "workspace.yaml"),
      YAML.stringify(workspace, { lineWidth: 0 }),
      "utf-8",
    );

    // Create workspace directories
    await ensureDir(join(cwd, "memory"));
    await writeFile(
      join(cwd, "memory", "conventions.yaml"),
      "conventions: []\n",
      "utf-8",
    );
    await writeFile(
      join(cwd, "memory", "anti-patterns.yaml"),
      "anti_patterns: []\n",
      "utf-8",
    );
    await writeFile(
      join(cwd, "memory", "decisions.yaml"),
      "decisions: []\n",
      "utf-8",
    );
    await ensureDir(join(cwd, "contracts"));
    await writeFile(join(cwd, "contracts", ".gitkeep"), "", "utf-8");
    await ensureDir(join(cwd, "features"));
    await writeFile(join(cwd, "features", ".gitkeep"), "", "utf-8");

    // Create symlinks
    if (repos.length > 0) {
      await ensureDir(join(cwd, "repositories"));
      for (const repo of repos) {
        const linkPath = join(cwd, "repositories", repo.name);
        const targetPath = resolve(cwd, repo.path);
        if (!(await pathExists(linkPath))) {
          try {
            await symlink(targetPath, linkPath);
          } catch {
            // Symlink creation may fail on some systems
          }
        }
      }
    }

    // Update per-repo configs
    for (const repo of repos) {
      const repoDir = resolve(cwd, repo.path);
      try {
        const config = await readConfig(repoDir);
        config.workspace = {
          enabled: true,
          workspace_path: relative(repoDir, cwd),
          repo_name: repo.name,
        };
        await writeConfig(repoDir, config);
      } catch {
        p.log.warn(`Could not update config for ${repo.name}`);
      }
    }

    p.log.success("Workspace initialized!");
    p.log.info(`  Location: ${cwd}`);
    p.log.info(`  Repos: ${repos.length}`);
    p.log.info("");
    p.log.info("Next steps:");
    p.log.info(
      '  /sniper-workspace feature "description"  — Plan a cross-repo feature',
    );
    p.log.info(
      "  /sniper-workspace status                 — View workspace status",
    );

    p.outro("");
  },
});

const statusSubCommand = defineCommand({
  meta: {
    name: "status",
    description: "Show workspace status",
  },
  run: async () => {
    const cwd = process.cwd();
    const wsPath = join(cwd, "workspace.yaml");

    if (!(await pathExists(wsPath))) {
      p.log.error(
        "No workspace found. Run /sniper-workspace init to create one.",
      );
      process.exit(1);
    }

    const raw = await readFile(wsPath, "utf-8");
    const ws = YAML.parse(raw) as WorkspaceConfig;

    p.intro(`Workspace: ${ws.name}`);
    p.log.info(ws.description);

    // Repositories
    p.log.step("Repositories:");
    for (const repo of ws.repositories) {
      const repoPath = resolve(cwd, repo.path);
      const accessible = await pathExists(repoPath);
      const icon = accessible ? "\u2713" : "\u2717";
      p.log.info(
        `  ${icon} ${repo.name.padEnd(20)} ${repo.role.padEnd(12)} ${repo.language}`,
      );
    }

    // Active features
    const activeFeatures = ws.state.features.filter(
      (f) => f.phase !== "complete",
    );
    if (activeFeatures.length > 0) {
      p.log.step("Active Features:");
      for (const f of activeFeatures) {
        p.log.info(
          `  ${f.id}  "${f.title}"  Phase: ${f.phase}${f.sprint_wave ? `  Wave: ${f.sprint_wave}` : ""}`,
        );
      }
    } else {
      p.log.step("No active workspace features.");
    }

    // Contracts
    const contractsDir = join(cwd, "contracts");
    if (await pathExists(contractsDir)) {
      const files = (await readdir(contractsDir)).filter((f) =>
        f.endsWith(".contract.yaml"),
      );
      if (files.length > 0) {
        p.log.step("Contracts:");
        for (const file of files) {
          try {
            const cRaw = await readFile(join(contractsDir, file), "utf-8");
            const contract = YAML.parse(cRaw);
            const name = contract.contract?.name || file;
            const version = contract.contract?.version || "?";
            const between = contract.contract?.between?.join(" \u2194 ") || "?";
            p.log.info(`  ${name}  v${version}  ${between}`);
          } catch {
            p.log.info(`  ${file}  (parse error)`);
          }
        }
      } else {
        p.log.step("No contracts defined.");
      }
    }

    // Workspace memory
    const memDir = join(cwd, "memory");
    if (await pathExists(memDir)) {
      const convFile = join(memDir, "conventions.yaml");
      const apFile = join(memDir, "anti-patterns.yaml");
      const decFile = join(memDir, "decisions.yaml");

      let convCount = 0;
      let apCount = 0;
      let decCount = 0;

      if (await pathExists(convFile)) {
        try {
          const parsed = YAML.parse(await readFile(convFile, "utf-8"));
          convCount = Array.isArray(parsed?.conventions)
            ? parsed.conventions.length
            : 0;
        } catch {
          /* empty */
        }
      }
      if (await pathExists(apFile)) {
        try {
          const parsed = YAML.parse(await readFile(apFile, "utf-8"));
          apCount = Array.isArray(parsed?.anti_patterns)
            ? parsed.anti_patterns.length
            : 0;
        } catch {
          /* empty */
        }
      }
      if (await pathExists(decFile)) {
        try {
          const parsed = YAML.parse(await readFile(decFile, "utf-8"));
          decCount = Array.isArray(parsed?.decisions)
            ? parsed.decisions.length
            : 0;
        } catch {
          /* empty */
        }
      }

      p.log.step("Workspace Memory:");
      p.log.info(`  Conventions:   ${convCount}`);
      p.log.info(`  Anti-Patterns: ${apCount}`);
      p.log.info(`  Decisions:     ${decCount}`);
    }

    p.outro("");
  },
});

const addRepoSubCommand = defineCommand({
  meta: {
    name: "add-repo",
    description: "Add a repository to the workspace",
  },
  args: {
    path: {
      type: "positional",
      description: "Path to the repository",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();
    const wsPath = join(cwd, "workspace.yaml");

    if (!(await pathExists(wsPath))) {
      p.log.error("No workspace found. Run /sniper-workspace init first.");
      process.exit(1);
    }

    const repoPath = resolve(cwd, args.path as string);

    if (!(await sniperConfigExists(repoPath))) {
      p.log.error(
        `${repoPath} is not a SNIPER-enabled project. Run "sniper init" in that directory first.`,
      );
      process.exit(1);
    }

    const repoConfig = await readConfig(repoPath);
    const raw = await readFile(wsPath, "utf-8");
    const ws = YAML.parse(raw) as WorkspaceConfig;

    const repoName = repoConfig.project.name;

    if (ws.repositories.some((r) => r.name === repoName)) {
      p.log.warn(`Repository "${repoName}" is already in the workspace.`);
      process.exit(0);
    }

    ws.repositories.push({
      name: repoName,
      path: relative(cwd, repoPath),
      role: inferRole(repoConfig.project.type),
      language: repoConfig.stack.language,
      sniper_enabled: true,
      exposes: [],
      consumes: [],
    });
    ws.dependency_graph[repoName] = [];

    await writeFile(wsPath, YAML.stringify(ws, { lineWidth: 0 }), "utf-8");

    // Update repo config
    repoConfig.workspace = {
      enabled: true,
      workspace_path: relative(repoPath, cwd),
      repo_name: repoName,
    };
    await writeConfig(repoPath, repoConfig);

    p.log.success(
      `Added ${repoName} (${repoConfig.project.type}, ${repoConfig.stack.language})`,
    );
  },
});

const removeRepoSubCommand = defineCommand({
  meta: {
    name: "remove-repo",
    description: "Remove a repository from the workspace",
  },
  args: {
    name: {
      type: "positional",
      description: "Repository name",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();
    const wsPath = join(cwd, "workspace.yaml");

    if (!(await pathExists(wsPath))) {
      p.log.error("No workspace found.");
      process.exit(1);
    }

    const raw = await readFile(wsPath, "utf-8");
    const ws = YAML.parse(raw) as WorkspaceConfig;
    const repoName = args.name as string;

    const idx = ws.repositories.findIndex((r) => r.name === repoName);
    if (idx < 0) {
      p.log.error(`Repository "${repoName}" not found in workspace.`);
      process.exit(1);
    }

    const repo = ws.repositories[idx];
    ws.repositories.splice(idx, 1);
    delete ws.dependency_graph[repoName];

    // Remove from other repos' dependencies
    for (const deps of Object.values(ws.dependency_graph)) {
      const depIdx = deps.indexOf(repoName);
      if (depIdx >= 0) deps.splice(depIdx, 1);
    }

    await writeFile(wsPath, YAML.stringify(ws, { lineWidth: 0 }), "utf-8");

    // Update repo config
    const repoPath = resolve(cwd, repo.path);
    try {
      const repoConfig = await readConfig(repoPath);
      repoConfig.workspace = {
        enabled: false,
        workspace_path: null,
        repo_name: null,
      };
      await writeConfig(repoPath, repoConfig);
    } catch {
      // Repo may not be accessible
    }

    p.log.success(`Removed ${repoName} from workspace.`);
  },
});

const validateSubCommand = defineCommand({
  meta: {
    name: "validate",
    description: "Validate interface contracts against implementations",
  },
  run: async () => {
    const cwd = process.cwd();
    const wsPath = join(cwd, "workspace.yaml");

    if (!(await pathExists(wsPath))) {
      p.log.error("No workspace found.");
      process.exit(1);
    }

    const contractsDir = join(cwd, "contracts");
    if (!(await pathExists(contractsDir))) {
      p.log.error("No contracts/ directory found.");
      process.exit(1);
    }

    const files = (await readdir(contractsDir)).filter((f) =>
      f.endsWith(".contract.yaml"),
    );

    if (files.length === 0) {
      p.log.info("No contracts found. Create them with /sniper-workspace feature.");
      process.exit(0);
    }

    p.intro("Contract Validation");

    for (const file of files) {
      try {
        const raw = await readFile(join(contractsDir, file), "utf-8");
        const contract = YAML.parse(raw);
        const name = contract.contract?.name || file;
        const version = contract.contract?.version || "?";
        const endpoints = contract.endpoints?.length || 0;
        const types = contract.shared_types?.length || 0;
        const events = contract.events?.length || 0;

        p.log.info(
          `${name} v${version}: ${endpoints} endpoints, ${types} types, ${events} events`,
        );
        p.log.info(
          "  (Structural validation requires running /sniper-workspace validate as a slash command)",
        );
      } catch {
        p.log.warn(`  ${file}: parse error`);
      }
    }

    p.log.info(
      "\nFull validation (endpoint/type/event checking) runs via the /sniper-workspace validate slash command.",
    );
    p.outro("");
  },
});

function inferRole(projectType: string | undefined): string {
  switch (projectType) {
    case "saas":
    case "web":
    case "mobile":
      return "frontend";
    case "api":
      return "backend";
    case "library":
      return "library";
    case "cli":
    case "monorepo":
      return "service";
    default:
      return "service";
  }
}

export const workspaceCommand = defineCommand({
  meta: {
    name: "workspace",
    description: "Manage SNIPER workspaces for multi-project orchestration",
  },
  subCommands: {
    init: initSubCommand,
    status: statusSubCommand,
    "add-repo": addRepoSubCommand,
    "remove-repo": removeRepoSubCommand,
    validate: validateSubCommand,
  },
});
