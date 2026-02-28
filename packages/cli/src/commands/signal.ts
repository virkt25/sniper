import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import {
  ingestSignal,
  ingestFromPR,
  listSignals,
  clearSignals,
  getSignalDir,
  type Signal,
} from "../signal-collector.js";
import { ensureDir } from "../fs-utils.js";

const SIGNAL_TYPES = [
  { value: "ci_failure", label: "CI Failure" },
  { value: "pr_review_comment", label: "PR Review Comment" },
  { value: "production_error", label: "Production Error" },
  { value: "manual", label: "Manual" },
] as const;

const ingestSubcommand = defineCommand({
  meta: {
    name: "ingest",
    description: "Interactively create a new signal record",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const type = await p.select({
      message: "Signal type:",
      options: SIGNAL_TYPES.map((t) => ({ value: t.value, label: t.label })),
    });

    if (p.isCancel(type)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const source = await p.text({
      message: "Source (e.g., github-actions, pr-42, datadog):",
      validate: (v) => (v.length === 0 ? "Source is required" : undefined),
    });

    if (p.isCancel(source)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const summary = await p.text({
      message: "Summary (one-line description):",
      validate: (v) => (v.length === 0 ? "Summary is required" : undefined),
    });

    if (p.isCancel(summary)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const details = await p.text({
      message: "Details (optional — full error message or context):",
    });

    if (p.isCancel(details)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const filesInput = await p.text({
      message: "Affected files (optional — comma-separated paths):",
    });

    if (p.isCancel(filesInput)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const signal: Signal = {
      type: type as Signal["type"],
      source: source as string,
      timestamp: new Date().toISOString(),
      summary: summary as string,
    };

    if (details && (details as string).length > 0) {
      signal.details = details as string;
    }

    if (filesInput && (filesInput as string).length > 0) {
      signal.affected_files = (filesInput as string)
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);
    }

    await ensureDir(getSignalDir(cwd));
    const filename = await ingestSignal(cwd, signal);

    p.log.success(`Signal captured: ${filename}`);
  },
});

const ingestPrSubcommand = defineCommand({
  meta: {
    name: "ingest-pr",
    description: "Ingest signals from a GitHub PR's reviews and comments",
  },
  args: {
    "pr-number": {
      type: "positional",
      description: "Pull request number",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const prNumber = parseInt(args["pr-number"] as string, 10);

    if (isNaN(prNumber)) {
      p.log.error("Invalid PR number.");
      process.exit(1);
    }

    const s = p.spinner();
    s.start(`Ingesting signals from PR #${prNumber}...`);

    try {
      const signals = await ingestFromPR(cwd, prNumber);
      s.stop("Done!");
      p.log.success(`Captured ${signals.length} signal(s) from PR #${prNumber}`);

      for (const signal of signals) {
        p.log.info(`  - ${signal.summary}`);
      }
    } catch (err) {
      s.stop("Failed!");
      p.log.error(`Failed to ingest PR signals: ${err}`);
      process.exit(1);
    }
  },
});

const listSubcommand = defineCommand({
  meta: {
    name: "list",
    description: "List captured signals",
  },
  args: {
    type: {
      type: "string",
      description: "Filter by signal type",
      required: false,
    },
    limit: {
      type: "string",
      description: "Maximum number of signals to display",
      required: false,
      default: "20",
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const limit = parseInt(args.limit as string, 10) || 20;
    const signals = await listSignals(cwd, {
      type: args.type as string | undefined,
      limit,
    });

    if (signals.length === 0) {
      p.log.info("No signals found.");
      return;
    }

    p.log.step(`Signals (${signals.length}):`);
    console.log();
    console.log(
      "  " +
        "Type".padEnd(22) +
        "Source".padEnd(20) +
        "Timestamp".padEnd(22) +
        "Summary",
    );
    console.log("  " + "-".repeat(90));

    for (const signal of signals) {
      const ts = new Date(signal.timestamp).toISOString().slice(0, 19).replace("T", " ");
      console.log(
        "  " +
          signal.type.padEnd(22) +
          signal.source.padEnd(20) +
          ts.padEnd(22) +
          signal.summary.slice(0, 50),
      );
    }
  },
});

const clearSubcommand = defineCommand({
  meta: {
    name: "clear",
    description: "Delete all captured signals",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const confirm = await p.confirm({
      message: "Delete all captured signals? This cannot be undone.",
    });

    if (p.isCancel(confirm) || !confirm) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const count = await clearSignals(cwd);
    p.log.success(`Cleared ${count} signal(s).`);
  },
});

export const signalCommand = defineCommand({
  meta: {
    name: "signal",
    description: "Manage external signal learning",
  },
  subCommands: {
    ingest: ingestSubcommand,
    "ingest-pr": ingestPrSubcommand,
    list: listSubcommand,
    clear: clearSubcommand,
  },
});
