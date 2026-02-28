import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { sniperConfigExists } from "../config.js";
import { HeadlessRunner, ExitCode } from "../headless.js";
import type { HeadlessOptions } from "../headless.js";

export const runCommand = defineCommand({
  meta: {
    name: "run",
    description: "Run a SNIPER protocol in headless mode (for CI/CD)",
  },
  args: {
    protocol: {
      type: "string",
      description:
        "Protocol to run (full, feature, patch, ingest, explore, refactor, hotfix)",
      required: true,
    },
    ci: {
      type: "boolean",
      description:
        "CI mode: sets auto-approve, json output, warn-level logging",
      default: false,
    },
    "auto-approve": {
      type: "boolean",
      description: "Auto-approve all gates",
      default: false,
    },
    output: {
      type: "string",
      description: "Output format: json, yaml, text",
      default: "text",
    },
    timeout: {
      type: "string",
      description: "Timeout in minutes",
      default: "60",
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    // Check SNIPER is initialized
    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(ExitCode.ConfigError);
    }

    // Validate output format
    const validFormats = ["json", "yaml", "text"];
    const outputFormat = args.ci ? "json" : (args.output ?? "text");
    if (!validFormats.includes(outputFormat)) {
      p.log.error(
        `Invalid output format: "${outputFormat}". Use: ${validFormats.join(", ")}`,
      );
      process.exit(ExitCode.ConfigError);
    }

    // Build headless options
    const options: HeadlessOptions = {
      protocol: args.protocol as string,
      autoApproveGates: args.ci || args["auto-approve"] || false,
      outputFormat: outputFormat as "json" | "yaml" | "text",
      logLevel: args.ci ? "warn" : "info",
      timeoutMinutes: parseInt(args.timeout as string, 10) || 60,
      failOnGateFailure: true,
    };

    // Run headless execution
    const runner = new HeadlessRunner(cwd, options);
    const result = await runner.run();

    // Output result in requested format
    const output = runner.formatOutput(result);
    if (result.exitCode === ExitCode.Success) {
      process.stdout.write(output + "\n");
    } else {
      // Errors go to stderr, structured result to stdout
      if (result.errors.length > 0) {
        for (const err of result.errors) {
          process.stderr.write(`error: ${err}\n`);
        }
      }
      process.stdout.write(output + "\n");
    }

    process.exit(result.exitCode);
  },
});
