import { readFile, writeFile, readdir, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import YAML from "yaml";
import { readConfig, sniperConfigExists } from "../config.js";

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

interface MemoryEntry {
  id: string;
  status?: string;
  [key: string]: unknown;
}

async function readYamlArray(
  filePath: string,
  key: string,
): Promise<MemoryEntry[]> {
  if (!(await pathExists(filePath))) return [];
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = YAML.parse(raw);
    return Array.isArray(parsed?.[key]) ? parsed[key] : [];
  } catch {
    return [];
  }
}

async function writeYamlArray(
  filePath: string,
  key: string,
  entries: MemoryEntry[],
): Promise<void> {
  const content = YAML.stringify({ [key]: entries }, { lineWidth: 0 });
  await writeFile(filePath, content, "utf-8");
}

function nextId(entries: MemoryEntry[], prefix: string): string {
  let max = 0;
  for (const entry of entries) {
    const match = entry.id?.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export const memoryCommand = defineCommand({
  meta: {
    name: "memory",
    description: "Manage agent memory (conventions, anti-patterns, decisions)",
  },
  args: {
    action: {
      type: "positional",
      description:
        "Action to perform: list, add, remove, promote, export, import",
      required: false,
    },
    type: {
      type: "positional",
      description:
        "Memory type: convention, anti-pattern, decision (for add/remove/promote)",
      required: false,
    },
    value: {
      type: "positional",
      description: "Value for the action (rule text, ID, or file path)",
      required: false,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error(
        'SNIPER is not initialized in this directory. Run "sniper init" first.',
      );
      process.exit(1);
    }

    const memoryDir = join(cwd, ".sniper", "memory");

    // Ensure memory directory exists
    if (!(await pathExists(memoryDir))) {
      await ensureDir(memoryDir);
      await ensureDir(join(memoryDir, "retros"));
      await writeFile(
        join(memoryDir, "conventions.yaml"),
        "conventions: []\n",
        "utf-8",
      );
      await writeFile(
        join(memoryDir, "anti-patterns.yaml"),
        "anti_patterns: []\n",
        "utf-8",
      );
      await writeFile(
        join(memoryDir, "decisions.yaml"),
        "decisions: []\n",
        "utf-8",
      );
      await writeFile(
        join(memoryDir, "estimates.yaml"),
        "calibration:\n  velocity_factor: 1.0\n  common_underestimates: []\n  last_updated: null\n  sprints_analyzed: 0\n",
        "utf-8",
      );
      p.log.info("Initialized .sniper/memory/ directory");
    }

    const conventions = await readYamlArray(
      join(memoryDir, "conventions.yaml"),
      "conventions",
    );
    const antiPatterns = await readYamlArray(
      join(memoryDir, "anti-patterns.yaml"),
      "anti_patterns",
    );
    const decisions = await readYamlArray(
      join(memoryDir, "decisions.yaml"),
      "decisions",
    );

    // Count retros
    let retroCount = 0;
    const retrosDir = join(memoryDir, "retros");
    if (await pathExists(retrosDir)) {
      const files = await readdir(retrosDir);
      retroCount = files.filter((f) => f.endsWith(".yaml")).length;
    }

    const action = args.action as string | undefined;

    if (!action || action === "list") {
      // Show summary
      p.intro("SNIPER Memory");

      const confirmedConv = conventions.filter(
        (c) => c.status !== "candidate",
      ).length;
      const candidateConv = conventions.filter(
        (c) => c.status === "candidate",
      ).length;
      const confirmedAp = antiPatterns.filter(
        (a) => a.status !== "candidate",
      ).length;
      const candidateAp = antiPatterns.filter(
        (a) => a.status === "candidate",
      ).length;
      const activeDecisions = decisions.filter(
        (d) => d.status === "active" || !d.status,
      ).length;
      const supersededDecisions = decisions.filter(
        (d) => d.status === "superseded",
      ).length;

      p.log.info(
        `Conventions:   ${confirmedConv} confirmed, ${candidateConv} candidates`,
      );
      p.log.info(
        `Anti-Patterns: ${confirmedAp} confirmed, ${candidateAp} candidates`,
      );
      p.log.info(
        `Decisions:     ${activeDecisions} active, ${supersededDecisions} superseded`,
      );
      p.log.info(`Retrospectives: ${retroCount}`);

      // Show workspace memory if configured
      const config = await readConfig(cwd);
      if (config.workspace?.enabled && config.workspace.workspace_path) {
        const wsMemory = join(
          cwd,
          config.workspace.workspace_path,
          "memory",
        );
        if (await pathExists(wsMemory)) {
          const wsConv = await readYamlArray(
            join(wsMemory, "conventions.yaml"),
            "conventions",
          );
          const wsAp = await readYamlArray(
            join(wsMemory, "anti-patterns.yaml"),
            "anti_patterns",
          );
          const wsDec = await readYamlArray(
            join(wsMemory, "decisions.yaml"),
            "decisions",
          );
          p.log.step("Workspace Memory:");
          p.log.info(`  Conventions:   ${wsConv.length}`);
          p.log.info(`  Anti-Patterns: ${wsAp.length}`);
          p.log.info(`  Decisions:     ${wsDec.length}`);
        }
      }

      p.outro("");
      return;
    }

    if (action === "add") {
      const type = args.type as string | undefined;
      const value = args.value as string | undefined;

      if (!type || !value) {
        p.log.error(
          'Usage: sniper memory add <convention|anti-pattern|decision> "<text>"',
        );
        process.exit(1);
      }

      const today = new Date().toISOString().split("T")[0];

      if (type === "convention") {
        const id = nextId(conventions, "conv");
        conventions.push({
          id,
          rule: value,
          rationale: "",
          source: { type: "manual", ref: "user-added", date: today },
          applies_to: [],
          enforcement: "both",
          scope: "project",
          status: "confirmed",
          examples: { positive: "", negative: "" },
        });
        await writeYamlArray(
          join(memoryDir, "conventions.yaml"),
          "conventions",
          conventions,
        );
        p.log.success(`Added convention ${id}: ${value}`);
      } else if (type === "anti-pattern") {
        const id = nextId(antiPatterns, "ap");
        antiPatterns.push({
          id,
          description: value,
          why_bad: "",
          fix_pattern: "",
          source: { type: "manual", ref: "user-added", date: today },
          detection_hint: "",
          applies_to: [],
          severity: "medium",
          status: "confirmed",
        });
        await writeYamlArray(
          join(memoryDir, "anti-patterns.yaml"),
          "anti_patterns",
          antiPatterns,
        );
        p.log.success(`Added anti-pattern ${id}: ${value}`);
      } else if (type === "decision") {
        const id = nextId(decisions, "dec");
        decisions.push({
          id,
          title: value,
          context: "",
          decision: value,
          alternatives_considered: [],
          source: { type: "manual", ref: "user-added", date: today },
          applies_to: [],
          status: "active",
          superseded_by: null,
        });
        await writeYamlArray(
          join(memoryDir, "decisions.yaml"),
          "decisions",
          decisions,
        );
        p.log.success(`Added decision ${id}: ${value}`);
      } else {
        p.log.error(
          `Unknown memory type "${type}". Use: convention, anti-pattern, decision`,
        );
        process.exit(1);
      }
      return;
    }

    if (action === "remove") {
      const id = args.type as string | undefined;
      if (!id) {
        p.log.error("Usage: sniper memory remove <id>");
        process.exit(1);
      }

      let found = false;
      if (id.startsWith("conv-")) {
        const idx = conventions.findIndex((c) => c.id === id);
        if (idx >= 0) {
          conventions.splice(idx, 1);
          await writeYamlArray(
            join(memoryDir, "conventions.yaml"),
            "conventions",
            conventions,
          );
          found = true;
        }
      } else if (id.startsWith("ap-")) {
        const idx = antiPatterns.findIndex((a) => a.id === id);
        if (idx >= 0) {
          antiPatterns.splice(idx, 1);
          await writeYamlArray(
            join(memoryDir, "anti-patterns.yaml"),
            "anti_patterns",
            antiPatterns,
          );
          found = true;
        }
      } else if (id.startsWith("dec-")) {
        const idx = decisions.findIndex((d) => d.id === id);
        if (idx >= 0) {
          decisions.splice(idx, 1);
          await writeYamlArray(
            join(memoryDir, "decisions.yaml"),
            "decisions",
            decisions,
          );
          found = true;
        }
      }

      if (found) {
        p.log.success(`Removed ${id}`);
      } else {
        p.log.error(`Entry ${id} not found in memory.`);
        process.exit(1);
      }
      return;
    }

    if (action === "promote") {
      const id = args.type as string | undefined;
      if (!id) {
        p.log.error("Usage: sniper memory promote <id>");
        process.exit(1);
      }

      let found = false;
      if (id.startsWith("conv-")) {
        const entry = conventions.find((c) => c.id === id);
        if (entry && entry.status === "candidate") {
          entry.status = "confirmed";
          await writeYamlArray(
            join(memoryDir, "conventions.yaml"),
            "conventions",
            conventions,
          );
          found = true;
        }
      } else if (id.startsWith("ap-")) {
        const entry = antiPatterns.find((a) => a.id === id);
        if (entry && entry.status === "candidate") {
          entry.status = "confirmed";
          await writeYamlArray(
            join(memoryDir, "anti-patterns.yaml"),
            "anti_patterns",
            antiPatterns,
          );
          found = true;
        }
      } else if (id.startsWith("dec-")) {
        const entry = decisions.find((d) => d.id === id);
        if (entry && entry.status === "candidate") {
          entry.status = "active";
          await writeYamlArray(
            join(memoryDir, "decisions.yaml"),
            "decisions",
            decisions,
          );
          found = true;
        }
      }

      if (found) {
        p.log.success(`Promoted ${id} to confirmed/active`);
      } else {
        p.log.error(
          `Entry ${id} not found or is not a candidate.`,
        );
        process.exit(1);
      }
      return;
    }

    if (action === "export") {
      const exportData = {
        exported_from: (await readConfig(cwd)).project.name,
        exported_at: new Date().toISOString(),
        version: "1.0",
        conventions: conventions.map(({ id: _id, source: _src, ...rest }) => rest),
        anti_patterns: antiPatterns.map(
          ({ id: _id, source: _src, ...rest }) => rest,
        ),
        decisions: [],
      };
      const exportPath = join(cwd, "sniper-memory-export.yaml");
      await writeFile(
        exportPath,
        YAML.stringify(exportData, { lineWidth: 0 }),
        "utf-8",
      );
      p.log.success(
        `Exported ${conventions.length} conventions, ${antiPatterns.length} anti-patterns to sniper-memory-export.yaml`,
      );
      return;
    }

    if (action === "import") {
      const filePath = args.type as string | undefined;
      if (!filePath) {
        p.log.error("Usage: sniper memory import <file>");
        process.exit(1);
      }

      const raw = await readFile(join(cwd, filePath), "utf-8");
      const imported = YAML.parse(raw);

      let addedConv = 0;
      let addedAp = 0;
      let skipped = 0;
      const today = new Date().toISOString().split("T")[0];

      if (Array.isArray(imported.conventions)) {
        for (const conv of imported.conventions) {
          const exists = conventions.some(
            (c) => (c as { rule?: string }).rule === conv.rule,
          );
          if (exists) {
            skipped++;
            continue;
          }
          conventions.push({
            ...conv,
            id: nextId(conventions, "conv"),
            source: { type: "imported", ref: filePath, date: today },
            status: "candidate",
          });
          addedConv++;
        }
        await writeYamlArray(
          join(memoryDir, "conventions.yaml"),
          "conventions",
          conventions,
        );
      }

      if (Array.isArray(imported.anti_patterns)) {
        for (const ap of imported.anti_patterns) {
          const exists = antiPatterns.some(
            (a) =>
              (a as { description?: string }).description === ap.description,
          );
          if (exists) {
            skipped++;
            continue;
          }
          antiPatterns.push({
            ...ap,
            id: nextId(antiPatterns, "ap"),
            source: { type: "imported", ref: filePath, date: today },
            status: "candidate",
          });
          addedAp++;
        }
        await writeYamlArray(
          join(memoryDir, "anti-patterns.yaml"),
          "anti_patterns",
          antiPatterns,
        );
      }

      p.log.success(
        `Imported ${addedConv} conventions, ${addedAp} anti-patterns (${skipped} skipped as duplicates)`,
      );
      return;
    }

    p.log.error(
      `Unknown action "${action}". Use: list, add, remove, promote, export, import`,
    );
    process.exit(1);
  },
});
