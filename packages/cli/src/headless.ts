import { readConfig } from "./config.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";

// ── Exit Codes ──

export enum ExitCode {
  Success = 0,
  GateFail = 1,
  CostExceeded = 2,
  Timeout = 3,
  ConfigError = 4,
}

// ── Interfaces ──

export interface HeadlessOptions {
  protocol: string;
  autoApproveGates: boolean;
  outputFormat: "json" | "yaml" | "text";
  logLevel: "debug" | "info" | "warn" | "error";
  timeoutMinutes: number;
  failOnGateFailure: boolean;
}

export interface PhaseResult {
  name: string;
  status: "completed" | "failed" | "skipped";
  gate_result?: "passed" | "failed" | "auto_approved";
  tokens: number;
}

export interface HeadlessResult {
  exitCode: ExitCode;
  protocol: string;
  phases: PhaseResult[];
  totalTokens: number;
  duration: number;
  errors: string[];
}

// ── Valid Protocols ──

const BUILT_IN_PROTOCOLS = [
  "full",
  "feature",
  "patch",
  "ingest",
  "explore",
  "refactor",
  "hotfix",
];

// ── HeadlessRunner ──

export class HeadlessRunner {
  private cwd: string;
  private options: HeadlessOptions;

  constructor(cwd: string, options: HeadlessOptions) {
    this.cwd = cwd;
    this.options = options;
  }

  async run(): Promise<HeadlessResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Validate config exists and is readable
    let config;
    try {
      config = await readConfig(this.cwd);
    } catch (err) {
      return {
        exitCode: ExitCode.ConfigError,
        protocol: this.options.protocol,
        phases: [],
        totalTokens: 0,
        duration: Date.now() - startTime,
        errors: [
          `Config error: ${err instanceof Error ? err.message : String(err)}`,
        ],
      };
    }

    // Validate the protocol exists
    const isBuiltIn = BUILT_IN_PROTOCOLS.includes(this.options.protocol);
    let isCustom = false;

    if (!isBuiltIn) {
      try {
        const customPath = join(
          this.cwd,
          ".sniper",
          "protocols",
          `${this.options.protocol}.yaml`,
        );
        await readFile(customPath, "utf-8");
        isCustom = true;
      } catch {
        // Not a custom protocol either
      }
    }

    if (!isBuiltIn && !isCustom) {
      return {
        exitCode: ExitCode.ConfigError,
        protocol: this.options.protocol,
        phases: [],
        totalTokens: 0,
        duration: Date.now() - startTime,
        errors: [
          `Unknown protocol: "${this.options.protocol}". Available: ${BUILT_IN_PROTOCOLS.join(", ")} (or define a custom protocol in .sniper/protocols/)`,
        ],
      };
    }

    // Stub: headless execution is not yet implemented.
    // In production, this will spawn a Claude Code subprocess with
    // the sniper-flow-headless skill and capture structured output.
    return {
      exitCode: ExitCode.ConfigError,
      protocol: this.options.protocol,
      phases: [],
      totalTokens: 0,
      duration: Date.now() - startTime,
      errors: [
        "Headless mode is not yet implemented. Protocol validation passed, but no execution occurred. Use /sniper-flow interactively instead.",
      ],
    };
  }

  formatOutput(result: HeadlessResult): string {
    switch (this.options.outputFormat) {
      case "json":
        return JSON.stringify(
          {
            protocol: result.protocol,
            status: exitCodeToStatus(result.exitCode),
            phases: result.phases,
            total_tokens: result.totalTokens,
            duration_seconds: Math.round(result.duration / 1000),
            errors: result.errors,
          },
          null,
          2,
        );

      case "yaml":
        return YAML.stringify({
          protocol: result.protocol,
          status: exitCodeToStatus(result.exitCode),
          phases: result.phases,
          total_tokens: result.totalTokens,
          duration_seconds: Math.round(result.duration / 1000),
          errors: result.errors,
        });

      case "text":
        return formatTextTable(result);
    }
  }
}

// ── Helpers ──

function exitCodeToStatus(code: ExitCode): string {
  switch (code) {
    case ExitCode.Success:
      return "success";
    case ExitCode.GateFail:
      return "gate_fail";
    case ExitCode.CostExceeded:
      return "cost_exceeded";
    case ExitCode.Timeout:
      return "timeout";
    case ExitCode.ConfigError:
      return "config_error";
  }
}

function formatTextTable(result: HeadlessResult): string {
  const lines: string[] = [];
  const status = exitCodeToStatus(result.exitCode);

  lines.push(`Protocol: ${result.protocol}`);
  lines.push(`Status:   ${status}`);
  lines.push(`Duration: ${Math.round(result.duration / 1000)}s`);
  lines.push(`Tokens:   ${result.totalTokens}`);

  if (result.phases.length > 0) {
    lines.push("");
    lines.push("Phase            Status      Gate             Tokens");
    lines.push("---------------- ----------- ---------------- ------");
    for (const phase of result.phases) {
      const name = phase.name.padEnd(16);
      const phaseStatus = phase.status.padEnd(11);
      const gate = (phase.gate_result ?? "-").padEnd(16);
      lines.push(`${name} ${phaseStatus} ${gate} ${phase.tokens}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("Errors:");
    for (const err of result.errors) {
      lines.push(`  - ${err}`);
    }
  }

  return lines.join("\n");
}
