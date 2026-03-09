import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { readConfig, sniperConfigExists } from "../config.js";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { pathExists } from "../fs-utils.js";

// ── Types for parsed YAML data ──

interface CheckpointAgent {
  name: string;
  status: string;
  tasks_completed: number;
  tasks_total: number;
}

interface Checkpoint {
  protocol: string;
  phase: string;
  timestamp: string;
  status: string;
  agents?: CheckpointAgent[];
}

interface GateResult {
  gate: string;
  timestamp: string;
  result: "pass" | "fail";
  blocking_failures: number;
  total_checks: number;
  protocol?: string;
}

interface DashboardData {
  agent_summary: {
    by_protocol: Record<string, { phases: string[] }>;
    by_agent: Record<string, { tasks_completed: number; tasks_total: number }>;
  };
  gate_pass_rates: Record<string, { pass: number; fail: number; total_checks: number }>;
  agent_efficiency: Record<string, { total_tasks: number }>;
  timeline: Array<{ timestamp: string; type: string; protocol: string; phase?: string; status: string }>;
}

// ── Helpers ──

async function readYamlDir<T>(dirPath: string): Promise<T[]> {
  if (!(await pathExists(dirPath))) return [];
  const files = await readdir(dirPath);
  const yamlFiles = files.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  const results: T[] = [];
  for (const file of yamlFiles) {
    try {
      const raw = await readFile(join(dirPath, file), "utf-8");
      const parsed = YAML.parse(raw);
      if (parsed) results.push(parsed as T);
    } catch {
      // Skip unparseable files
    }
  }
  return results;
}

// ── Data aggregation ──

function aggregateData(
  checkpoints: Checkpoint[],
  gates: GateResult[],
  protocolFilter?: string,
): DashboardData {
  const filtered = protocolFilter
    ? checkpoints.filter((c) => c.protocol === protocolFilter)
    : checkpoints;

  // Summary by protocol
  const byProtocol: DashboardData["agent_summary"]["by_protocol"] = {};
  for (const cp of filtered) {
    if (!byProtocol[cp.protocol]) {
      byProtocol[cp.protocol] = { phases: [] };
    }
    const entry = byProtocol[cp.protocol];
    if (!entry.phases.includes(cp.phase)) {
      entry.phases.push(cp.phase);
    }
  }

  // Summary by agent
  const byAgent: DashboardData["agent_summary"]["by_agent"] = {};
  for (const cp of filtered) {
    for (const agent of cp.agents ?? []) {
      if (!byAgent[agent.name]) {
        byAgent[agent.name] = { tasks_completed: 0, tasks_total: 0 };
      }
      byAgent[agent.name].tasks_completed += agent.tasks_completed;
      byAgent[agent.name].tasks_total += agent.tasks_total;
    }
  }

  // Gate pass rates
  const filteredGates = protocolFilter
    ? gates.filter((g) => g.protocol === protocolFilter)
    : gates;
  const gateRates: DashboardData["gate_pass_rates"] = {};
  for (const g of filteredGates) {
    const key = g.protocol ? `${g.protocol}/${g.gate}` : g.gate;
    if (!gateRates[key]) {
      gateRates[key] = { pass: 0, fail: 0, total_checks: 0 };
    }
    if (g.result === "pass") gateRates[key].pass++;
    else gateRates[key].fail++;
    gateRates[key].total_checks += g.total_checks;
  }

  // Agent efficiency
  const agentEfficiency: DashboardData["agent_efficiency"] = {};
  for (const [name, data] of Object.entries(byAgent)) {
    agentEfficiency[name] = {
      total_tasks: data.tasks_completed,
    };
  }

  // Timeline (merge checkpoints and gates, sorted by timestamp)
  const timeline: DashboardData["timeline"] = [];
  for (const cp of filtered) {
    timeline.push({
      timestamp: cp.timestamp,
      type: "checkpoint",
      protocol: cp.protocol,
      phase: cp.phase,
      status: cp.status,
    });
  }
  for (const g of filteredGates) {
    timeline.push({
      timestamp: g.timestamp,
      type: "gate",
      protocol: g.protocol ?? "unknown",
      phase: g.gate,
      status: g.result,
    });
  }
  timeline.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    agent_summary: { by_protocol: byProtocol, by_agent: byAgent },
    gate_pass_rates: gateRates,
    agent_efficiency: agentEfficiency,
    timeline: timeline.slice(0, 20),
  };
}

// ── Formatted output ──

function renderDashboard(data: DashboardData): void {
  // 1. Agent Summary
  p.log.step("Agent Summary");
  const protocols = Object.entries(data.agent_summary.by_protocol);
  if (protocols.length === 0) {
    console.log("  No checkpoint data found.");
  } else {
    for (const [protocol, info] of protocols) {
      console.log(`  ${protocol}: ${info.phases.length} phase(s)`);
    }
  }

  const agents = Object.entries(data.agent_summary.by_agent);
  if (agents.length > 0) {
    console.log("");
    console.log("  By Agent:");
    for (const [name, info] of agents) {
      console.log(`    ${name.padEnd(24)} ${info.tasks_completed}/${info.tasks_total} tasks`);
    }
  }

  // 2. Gate Pass Rates
  p.log.step("Gate Pass Rates");
  const gateEntries = Object.entries(data.gate_pass_rates);
  if (gateEntries.length === 0) {
    console.log("  No gate results found.");
  } else {
    for (const [key, info] of gateEntries) {
      const total = info.pass + info.fail;
      const rate = total > 0 ? Math.round((info.pass / total) * 100) : 0;
      const icon = rate === 100 ? "\u2713" : rate >= 50 ? "~" : "\u2717";
      console.log(`  ${icon} ${key.padEnd(28)} ${rate}% pass (${info.pass}/${total}), ${info.total_checks} checks`);
    }
  }

  // 4. Agent Efficiency
  p.log.step("Agent Efficiency");
  const effEntries = Object.entries(data.agent_efficiency);
  if (effEntries.length === 0) {
    console.log("  No agent data found.");
  } else {
    for (const [name, info] of effEntries) {
      console.log(`  ${name.padEnd(24)} ${info.total_tasks} tasks`);
    }
  }

  // 5. Timeline
  p.log.step("Timeline (recent)");
  if (data.timeline.length === 0) {
    console.log("  No recent activity.");
  } else {
    for (const entry of data.timeline.slice(0, 10)) {
      const ts = entry.timestamp.replace("T", " ").substring(0, 19);
      const icon = entry.type === "gate" ? (entry.status === "pass" ? "\u2713" : "\u2717") : "\u25B6";
      const phaseStr = entry.phase ? `/${entry.phase}` : "";
      console.log(`  ${ts}  ${icon} ${entry.type.padEnd(12)} ${entry.protocol}${phaseStr} [${entry.status}]`);
    }
  }
}

// ── Command definition ──

export const dashboardCommand = defineCommand({
  meta: {
    name: "dashboard",
    description: "Show observability dashboard with performance, gates, and agent metrics",
  },
  args: {
    protocol: {
      type: "string",
      description: "Filter by protocol name",
      required: false,
    },
    json: {
      type: "boolean",
      description: "Output structured JSON instead of formatted text",
      required: false,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    await readConfig(cwd);

    // Read data sources
    const sniperDir = join(cwd, ".sniper");
    const checkpoints = await readYamlDir<Checkpoint>(join(sniperDir, "checkpoints"));
    const gates = await readYamlDir<GateResult>(join(sniperDir, "gates"));

    const protocolFilter = args.protocol || undefined;
    const data = aggregateData(checkpoints, gates, protocolFilter);

    if (args.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const title = protocolFilter
      ? `SNIPER Dashboard — ${protocolFilter}`
      : "SNIPER Dashboard";
    p.intro(title);

    if (checkpoints.length === 0 && gates.length === 0) {
      p.log.info("No observability data found yet. Run a protocol to generate metrics.");
      p.outro("");
      return;
    }

    renderDashboard(data);

    p.outro("");
  },
});
