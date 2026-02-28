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
  token_usage?: {
    phase_tokens?: number;
    cumulative_tokens?: number;
    budget_remaining?: number;
  };
}

interface GateResult {
  gate: string;
  timestamp: string;
  result: "pass" | "fail";
  blocking_failures: number;
  total_checks: number;
  protocol?: string;
}

interface VelocityExecution {
  protocol: string;
  completed_at: string;
  wall_clock_seconds?: number;
  tokens_used: number;
  tokens_per_phase?: Record<string, number>;
}

interface Velocity {
  executions?: VelocityExecution[];
  calibrated_budgets?: Record<string, number>;
  rolling_averages?: Record<string, number>;
}

interface DashboardData {
  cost_breakdown: {
    by_protocol: Record<string, { phase_tokens: number; cumulative_tokens: number; phases: string[] }>;
    by_agent: Record<string, { tokens: number; tasks_completed: number; tasks_total: number }>;
  };
  performance_trends: {
    executions: VelocityExecution[];
    calibrated_budgets: Record<string, number>;
    rolling_averages: Record<string, number>;
  };
  gate_pass_rates: Record<string, { pass: number; fail: number; total_checks: number }>;
  agent_efficiency: Record<string, { tokens_per_task: number; total_tokens: number; total_tasks: number }>;
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

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── Data aggregation ──

function aggregateData(
  checkpoints: Checkpoint[],
  gates: GateResult[],
  velocity: Velocity | null,
  protocolFilter?: string,
): DashboardData {
  const filtered = protocolFilter
    ? checkpoints.filter((c) => c.protocol === protocolFilter)
    : checkpoints;

  // Cost breakdown by protocol
  const byProtocol: DashboardData["cost_breakdown"]["by_protocol"] = {};
  for (const cp of filtered) {
    if (!byProtocol[cp.protocol]) {
      byProtocol[cp.protocol] = { phase_tokens: 0, cumulative_tokens: 0, phases: [] };
    }
    const entry = byProtocol[cp.protocol];
    entry.phase_tokens += cp.token_usage?.phase_tokens ?? 0;
    if (cp.token_usage?.cumulative_tokens && cp.token_usage.cumulative_tokens > entry.cumulative_tokens) {
      entry.cumulative_tokens = cp.token_usage.cumulative_tokens;
    }
    if (!entry.phases.includes(cp.phase)) {
      entry.phases.push(cp.phase);
    }
  }

  // Cost breakdown by agent
  const byAgent: DashboardData["cost_breakdown"]["by_agent"] = {};
  for (const cp of filtered) {
    const agentCount = cp.agents?.length ?? 1;
    const tokensPerAgent = agentCount > 0 ? (cp.token_usage?.phase_tokens ?? 0) / agentCount : 0;
    for (const agent of cp.agents ?? []) {
      if (!byAgent[agent.name]) {
        byAgent[agent.name] = { tokens: 0, tasks_completed: 0, tasks_total: 0 };
      }
      byAgent[agent.name].tokens += tokensPerAgent;
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

  // Agent efficiency (tokens per task)
  const agentEfficiency: DashboardData["agent_efficiency"] = {};
  for (const [name, data] of Object.entries(byAgent)) {
    const totalTasks = data.tasks_completed || 1;
    agentEfficiency[name] = {
      tokens_per_task: Math.round(data.tokens / totalTasks),
      total_tokens: Math.round(data.tokens),
      total_tasks: data.tasks_completed,
    };
  }

  // Performance trends
  const executions = velocity?.executions ?? [];
  const filteredExecs = protocolFilter
    ? executions.filter((e) => e.protocol === protocolFilter)
    : executions;

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
    cost_breakdown: { by_protocol: byProtocol, by_agent: byAgent },
    performance_trends: {
      executions: filteredExecs,
      calibrated_budgets: velocity?.calibrated_budgets ?? {},
      rolling_averages: velocity?.rolling_averages ?? {},
    },
    gate_pass_rates: gateRates,
    agent_efficiency: agentEfficiency,
    timeline: timeline.slice(0, 20),
  };
}

// ── Formatted output ──

function renderDashboard(data: DashboardData, config: Awaited<ReturnType<typeof readConfig>>): void {
  // 1. Cost Breakdown
  p.log.step("Cost Breakdown");
  const protocols = Object.entries(data.cost_breakdown.by_protocol);
  if (protocols.length === 0) {
    console.log("  No checkpoint data found.");
  } else {
    for (const [protocol, info] of protocols) {
      const budget = config.routing.budgets[protocol];
      const budgetStr = budget ? ` / ${formatTokens(budget)} budget` : "";
      console.log(`  ${protocol}: ${formatTokens(info.cumulative_tokens)} cumulative${budgetStr}`);
      console.log(`    Phase tokens: ${formatTokens(info.phase_tokens)} across ${info.phases.length} phase(s)`);
    }
  }

  const agents = Object.entries(data.cost_breakdown.by_agent);
  if (agents.length > 0) {
    console.log("");
    console.log("  By Agent:");
    for (const [name, info] of agents) {
      console.log(`    ${name.padEnd(24)} ${formatTokens(info.tokens).padStart(8)} tokens  (${info.tasks_completed}/${info.tasks_total} tasks)`);
    }
  }

  // 2. Performance Trends
  p.log.step("Performance Trends");
  const execs = data.performance_trends.executions;
  if (execs.length === 0) {
    console.log("  No execution history found.");
  } else {
    const byProto: Record<string, VelocityExecution[]> = {};
    for (const e of execs) {
      if (!byProto[e.protocol]) byProto[e.protocol] = [];
      byProto[e.protocol].push(e);
    }
    for (const [proto, runs] of Object.entries(byProto)) {
      const avg = Math.round(runs.reduce((s, r) => s + r.tokens_used, 0) / runs.length);
      const calibrated = data.performance_trends.calibrated_budgets[proto];
      const rolling = data.performance_trends.rolling_averages[proto];
      console.log(`  ${proto}: ${runs.length} execution(s), avg ${formatTokens(avg)} tokens`);
      if (rolling) console.log(`    Rolling average: ${formatTokens(rolling)}`);
      if (calibrated) console.log(`    Calibrated budget (p75): ${formatTokens(calibrated)}`);
    }
  }

  // 3. Gate Pass Rates
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
      console.log(`  ${name.padEnd(24)} ${formatTokens(info.tokens_per_task).padStart(8)} tokens/task  (${info.total_tasks} tasks, ${formatTokens(info.total_tokens)} total)`);
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
    description: "Show observability dashboard with cost, performance, gates, and agent metrics",
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

    const config = await readConfig(cwd);

    // Read data sources
    const sniperDir = join(cwd, ".sniper");
    const checkpoints = await readYamlDir<Checkpoint>(join(sniperDir, "checkpoints"));
    const gates = await readYamlDir<GateResult>(join(sniperDir, "gates"));

    let velocity: Velocity | null = null;
    const velocityPath = join(sniperDir, "memory", "velocity.yaml");
    if (await pathExists(velocityPath)) {
      try {
        const raw = await readFile(velocityPath, "utf-8");
        velocity = YAML.parse(raw) as Velocity;
      } catch {
        // Skip if unparseable
      }
    }

    const protocolFilter = args.protocol || undefined;
    const data = aggregateData(checkpoints, gates, velocity, protocolFilter);

    if (args.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const title = protocolFilter
      ? `SNIPER Dashboard — ${protocolFilter}`
      : "SNIPER Dashboard";
    p.intro(title);

    if (checkpoints.length === 0 && gates.length === 0 && !velocity) {
      p.log.info("No observability data found yet. Run a protocol to generate metrics.");
      p.outro("");
      return;
    }

    renderDashboard(data, config);

    p.outro("");
  },
});
