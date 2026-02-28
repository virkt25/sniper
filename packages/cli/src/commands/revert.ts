import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";
import { pathExists } from "../fs-utils.js";

interface CheckpointCommit {
  sha: string;
  message: string;
  agent: string;
}

interface Checkpoint {
  protocol: string;
  phase: string;
  commits?: CheckpointCommit[];
}

export const revertCommand = defineCommand({
  meta: {
    name: "revert",
    description: "Logically revert a SNIPER protocol, phase, or checkpoint",
  },
  args: {
    protocol: {
      type: "string",
      description: "Protocol ID to revert",
    },
    phase: {
      type: "string",
      description: "Specific phase to revert",
    },
    checkpoint: {
      type: "string",
      description: "Specific checkpoint file to revert",
    },
    "dry-run": {
      type: "boolean",
      description: "Show what would be reverted without doing it",
      default: false,
    },
    yes: {
      type: "boolean",
      description: "Skip confirmation prompt",
      default: false,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error(
        'SNIPER is not initialized. Run "sniper init" first.',
      );
      process.exit(1);
    }

    p.intro("SNIPER v3 — Logical Revert");

    const checkpointsDir = join(cwd, ".sniper", "checkpoints");
    if (!(await pathExists(checkpointsDir))) {
      p.log.error("No checkpoints found. Nothing to revert.");
      process.exit(1);
    }

    // Read all checkpoint files
    const files = await readdir(checkpointsDir);
    const yamlFiles = files.filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml"),
    );

    if (yamlFiles.length === 0) {
      p.log.error("No checkpoint files found. Nothing to revert.");
      process.exit(1);
    }

    const checkpoints: Array<{ filename: string; data: Checkpoint }> = [];
    for (const file of yamlFiles) {
      const raw = await readFile(join(checkpointsDir, file), "utf-8");
      const data = YAML.parse(raw) as Checkpoint;
      if (data) {
        checkpoints.push({ filename: file, data });
      }
    }

    // Filter by --protocol, --phase, or --checkpoint
    let filtered = checkpoints;

    if (args.checkpoint) {
      filtered = filtered.filter((c) => c.filename === args.checkpoint);
    }
    if (args.protocol) {
      filtered = filtered.filter((c) => c.data.protocol === args.protocol);
    }
    if (args.phase) {
      filtered = filtered.filter((c) => c.data.phase === args.phase);
    }

    if (filtered.length === 0) {
      p.log.error("No matching checkpoints found for the given filters.");
      process.exit(1);
    }

    // Collect commits from matching checkpoints
    const commits: CheckpointCommit[] = [];
    for (const cp of filtered) {
      if (Array.isArray(cp.data.commits)) {
        for (const commit of cp.data.commits) {
          // Avoid duplicates by SHA
          if (!commits.some((c) => c.sha === commit.sha)) {
            commits.push(commit);
          }
        }
      }
    }

    if (commits.length === 0) {
      p.log.error(
        "No commits found in matching checkpoints. Nothing to revert.",
      );
      process.exit(1);
    }

    // Show what would be reverted
    const protocolLabel = args.protocol || filtered[0].data.protocol;
    const phaseLabel = args.phase || "(all phases)";

    p.log.step(
      `Revert plan: ${commits.length} commit(s) from protocol "${protocolLabel}" ${args.phase ? `phase "${phaseLabel}"` : ""}`,
    );

    for (const commit of commits) {
      console.log(`  ${commit.sha.substring(0, 8)} ${commit.message} (${commit.agent})`);
    }

    // Dry run stops here
    if (args["dry-run"]) {
      p.log.info("Dry run complete. No changes were made.");
      p.outro("");
      return;
    }

    // Confirm unless --yes
    if (!args.yes) {
      const confirmed = await p.confirm({
        message: `Revert ${commits.length} commit(s)? A backup branch will be created.`,
        initialValue: false,
      });
      if (p.isCancel(confirmed) || !confirmed) {
        p.cancel("Revert aborted.");
        process.exit(0);
      }
    }

    // Create backup branch
    const timestamp = Date.now();
    const backupBranch = `sniper-revert-backup-${timestamp}`;

    try {
      execFileSync("git", ["branch", backupBranch], { cwd });
      p.log.success(`Created backup branch: ${backupBranch}`);
    } catch (err) {
      p.log.error(`Failed to create backup branch: ${err}`);
      process.exit(1);
    }

    // Revert each commit in reverse chronological order (already ordered from checkpoints)
    const s = p.spinner();
    s.start("Reverting commits...");

    try {
      for (const commit of commits) {
        execFileSync("git", ["revert", "--no-commit", commit.sha], { cwd });
      }

      // Create single revert commit
      const revertMessage = `revert: undo ${commits.length} commit(s) from protocol "${protocolLabel}"${args.phase ? ` phase "${phaseLabel}"` : ""}\n\nReverted commits:\n${commits.map((c) => `  - ${c.sha.substring(0, 8)} ${c.message}`).join("\n")}\n\nBackup branch: ${backupBranch}`;

      execFileSync("git", ["commit", "-m", revertMessage], { cwd });

      s.stop("Revert complete!");

      p.log.success(
        `Successfully reverted ${commits.length} commit(s). Backup branch: ${backupBranch}`,
      );
      p.outro("");
    } catch (err) {
      s.stop("Revert failed!");
      p.log.error(`Revert failed: ${err}`);
      p.log.info(
        `Your backup branch "${backupBranch}" is intact. You can run "git revert --abort" to undo the partial revert.`,
      );
      process.exit(1);
    }
  },
});
