import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import {
  createLock,
  releaseLock,
  readLocks,
  checkConflicts,
} from "../conflict-detector.js";
import { findWorkspaceRoot } from "../workspace-manager.js";
import { execFileSync } from "node:child_process";
import { basename } from "node:path";

const WORKSPACE_ERROR =
  "No workspace found. Sphere 7 requires a workspace. Run `sniper workspace init` first.";

const statusSubcommand = defineCommand({
  meta: {
    name: "status",
    description: "Show active file locks and dependency graph summary",
  },
  run: async () => {
    const cwd = process.cwd();
    const wsRoot = await findWorkspaceRoot(cwd);

    if (!wsRoot) {
      p.log.error(WORKSPACE_ERROR);
      process.exit(1);
    }

    p.intro("Sphere 7 — Workspace Status");

    // Active locks
    const locks = await readLocks(wsRoot);

    p.log.step(`Active locks: ${locks.length}`);
    if (locks.length === 0) {
      console.log("  (none)");
    } else {
      for (const lock of locks) {
        const age = timeSince(lock.since);
        const reason = lock.reason ? ` — ${lock.reason}` : "";
        console.log(
          `  ${lock.file}  locked by ${lock.locked_by.project}/${lock.locked_by.agent} (${age})${reason}`,
        );
      }
    }

    p.outro("");
  },
});

const lockSubcommand = defineCommand({
  meta: {
    name: "lock",
    description: "Acquire an advisory lock on a file",
  },
  args: {
    file: {
      type: "positional",
      description: "File path to lock",
      required: true,
    },
    reason: {
      type: "string",
      description: "Reason for acquiring the lock",
      required: false,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();
    const wsRoot = await findWorkspaceRoot(cwd);

    if (!wsRoot) {
      p.log.error(WORKSPACE_ERROR);
      process.exit(1);
    }

    const project = basename(cwd);

    try {
      await createLock(
        wsRoot,
        args.file,
        project,
        "cli",
        "manual",
        args.reason,
      );
      p.log.success(`Locked: ${args.file}`);
    } catch (err) {
      p.log.error(`Failed to acquire lock: ${err}`);
      process.exit(1);
    }
  },
});

const unlockSubcommand = defineCommand({
  meta: {
    name: "unlock",
    description: "Release an advisory lock on a file",
  },
  args: {
    file: {
      type: "positional",
      description: "File path to unlock",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();
    const wsRoot = await findWorkspaceRoot(cwd);

    if (!wsRoot) {
      p.log.error(WORKSPACE_ERROR);
      process.exit(1);
    }

    const released = await releaseLock(wsRoot, args.file);

    if (released) {
      p.log.success(`Unlocked: ${args.file}`);
    } else {
      p.log.warning(`No lock found for: ${args.file}`);
    }
  },
});

const conflictsSubcommand = defineCommand({
  meta: {
    name: "conflicts",
    description: "Detect file lock conflicts with current changes",
  },
  run: async () => {
    const cwd = process.cwd();
    const wsRoot = await findWorkspaceRoot(cwd);

    if (!wsRoot) {
      p.log.error(WORKSPACE_ERROR);
      process.exit(1);
    }

    p.intro("Sphere 7 — Conflict Detection");

    // Get changed files from git
    let changedFiles: string[];
    try {
      const output = execFileSync("git", ["diff", "--name-only"], {
        cwd,
        encoding: "utf-8",
      });
      changedFiles = output
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
    } catch {
      p.log.error("Failed to get changed files from git.");
      process.exit(1);
    }

    if (changedFiles.length === 0) {
      p.log.info("No changed files detected.");
      p.outro("");
      return;
    }

    p.log.step(`Changed files: ${changedFiles.length}`);

    const project = basename(cwd);
    const conflicts = await checkConflicts(wsRoot, changedFiles, project);

    if (conflicts.length === 0) {
      p.log.success("No conflicts detected.");
    } else {
      p.log.warning(`${conflicts.length} conflict(s) detected:`);
      for (const conflict of conflicts) {
        console.log(
          `  ${conflict.file}  held by ${conflict.held_by.project}/${conflict.held_by.agent} (protocol: ${conflict.held_by.protocol})`,
        );
      }
    }

    p.outro("");
  },
});

export const sphereCommand = defineCommand({
  meta: {
    name: "sphere",
    description: "Sphere 7 — Cross-human workspace coordination",
  },
  subCommands: {
    status: statusSubcommand,
    lock: lockSubcommand,
    unlock: unlockSubcommand,
    conflicts: conflictsSubcommand,
  },
});

// ── Helpers ──

function timeSince(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(ms / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
