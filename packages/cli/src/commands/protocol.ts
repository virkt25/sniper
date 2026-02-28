import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import { readdir, readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { sniperConfigExists, getCorePath } from "../config.js";

const CUSTOM_PROTOCOLS_DIR = ".sniper/protocols";

// ── Validation helpers ──

interface ValidationError {
  path: string;
  message: string;
}

function validateProtocol(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    errors.push({ path: "(root)", message: "Expected a YAML object" });
    return errors;
  }

  const proto = data as Record<string, unknown>;

  // Required top-level fields
  if (typeof proto.name !== "string" || proto.name.length === 0) {
    errors.push({ path: "name", message: "Required string field" });
  }
  if (typeof proto.description !== "string" || proto.description.length === 0) {
    errors.push({ path: "description", message: "Required string field" });
  }
  if (typeof proto.budget !== "number" || !Number.isInteger(proto.budget) || proto.budget < 1) {
    errors.push({ path: "budget", message: "Required positive integer" });
  }

  // Optional boolean
  if (proto.auto_retro !== undefined && typeof proto.auto_retro !== "boolean") {
    errors.push({ path: "auto_retro", message: "Must be a boolean" });
  }

  // Phases
  if (!Array.isArray(proto.phases) || proto.phases.length === 0) {
    errors.push({ path: "phases", message: "Required non-empty array" });
    return errors;
  }

  for (let i = 0; i < proto.phases.length; i++) {
    const phase = proto.phases[i] as Record<string, unknown>;
    const prefix = `phases[${i}]`;

    if (!phase || typeof phase !== "object") {
      errors.push({ path: prefix, message: "Must be an object" });
      continue;
    }

    if (typeof phase.name !== "string" || phase.name.length === 0) {
      errors.push({ path: `${prefix}.name`, message: "Required string field" });
    }
    if (typeof phase.description !== "string" || phase.description.length === 0) {
      errors.push({ path: `${prefix}.description`, message: "Required string field" });
    }
    if (!Array.isArray(phase.agents) || phase.agents.length === 0) {
      errors.push({ path: `${prefix}.agents`, message: "Required non-empty array of strings" });
    } else {
      for (let j = 0; j < phase.agents.length; j++) {
        if (typeof phase.agents[j] !== "string") {
          errors.push({ path: `${prefix}.agents[${j}]`, message: "Must be a string" });
        }
      }
    }
    if (phase.spawn_strategy !== "single" && phase.spawn_strategy !== "team") {
      errors.push({ path: `${prefix}.spawn_strategy`, message: 'Must be "single" or "team"' });
    }

    // Optional gate
    if (phase.gate !== undefined) {
      if (!phase.gate || typeof phase.gate !== "object") {
        errors.push({ path: `${prefix}.gate`, message: "Must be an object" });
      } else {
        const gate = phase.gate as Record<string, unknown>;
        if (typeof gate.checklist !== "string") {
          errors.push({ path: `${prefix}.gate.checklist`, message: "Required string field" });
        }
        if (typeof gate.human_approval !== "boolean") {
          errors.push({ path: `${prefix}.gate.human_approval`, message: "Required boolean field" });
        }
      }
    }

    // Optional fields
    if (phase.plan_approval !== undefined && typeof phase.plan_approval !== "boolean") {
      errors.push({ path: `${prefix}.plan_approval`, message: "Must be a boolean" });
    }
    if (phase.outputs !== undefined) {
      if (!Array.isArray(phase.outputs)) {
        errors.push({ path: `${prefix}.outputs`, message: "Must be an array of strings" });
      }
    }
    if (phase.coordination !== undefined) {
      if (!Array.isArray(phase.coordination)) {
        errors.push({ path: `${prefix}.coordination`, message: "Must be an array" });
      }
    }
  }

  return errors;
}

// ── Subcommands ──

const createSubcommand = defineCommand({
  meta: {
    name: "create",
    description: "Create a new custom protocol",
  },
  args: {
    name: {
      type: "positional",
      description: "Protocol name (e.g. my-workflow)",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    // Sanitize protocol name — only allow lowercase, digits, hyphens
    const protocolName = args.name as string;
    if (!/^[a-z][a-z0-9-]*$/.test(protocolName)) {
      p.log.error('Protocol name must start with a letter and contain only lowercase letters, digits, and hyphens.');
      process.exit(1);
    }

    const protocolsDir = join(cwd, CUSTOM_PROTOCOLS_DIR);
    const targetPath = join(protocolsDir, `${protocolName}.yaml`);

    // Check if protocol already exists
    try {
      await access(targetPath);
      p.log.error(`Protocol "${args.name}" already exists at ${CUSTOM_PROTOCOLS_DIR}/${args.name}.yaml`);
      process.exit(1);
    } catch {
      // File doesn't exist — good
    }

    // Interactive prompts
    const description = await p.text({
      message: "Protocol description:",
      placeholder: "Describe the goal of your protocol",
      validate: (val) => {
        if (!val || val.trim().length === 0) return "Description is required";
      },
    });

    if (p.isCancel(description)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const budgetStr = await p.text({
      message: "Token budget:",
      placeholder: "500000",
      initialValue: "500000",
      validate: (val) => {
        const n = Number(val);
        if (!Number.isInteger(n) || n < 1) return "Must be a positive integer";
      },
    });

    if (p.isCancel(budgetStr)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    const budget = Number(budgetStr);

    // Read the template from core
    let templateContent: string;
    try {
      const corePath = getCorePath();
      templateContent = await readFile(
        join(corePath, "templates", "custom-protocol.yaml"),
        "utf-8",
      );
    } catch {
      p.log.warn("Could not read template from @sniper.ai/core. Using minimal template.");
      templateContent = YAML.stringify({
        name: args.name,
        description: description as string,
        budget,
        phases: [
          {
            name: "implement",
            description: "Implementation phase",
            agents: ["fullstack-dev"],
            spawn_strategy: "single",
            gate: { checklist: "implement", human_approval: false },
            outputs: ["source code changes"],
          },
        ],
        auto_retro: true,
      });
    }

    // Replace template values safely using YAML parse/stringify
    let content: string;
    try {
      const parsed = YAML.parse(templateContent) as Record<string, unknown>;
      parsed.name = protocolName;
      parsed.description = description as string;
      parsed.budget = budget;
      content = YAML.stringify(parsed, { lineWidth: 0 });
    } catch {
      // Fallback to regex substitution for non-standard templates
      content = templateContent
        .replace(/^name: .+$/m, `name: ${protocolName}`)
        .replace(/^description: .+$/m, `description: ${YAML.stringify(description as string).trim()}`)
        .replace(/^budget: .+$/m, `budget: ${budget}`);
    }

    // Ensure directory exists
    await mkdir(protocolsDir, { recursive: true });

    await writeFile(targetPath, content, "utf-8");

    p.log.success(`Created custom protocol: ${CUSTOM_PROTOCOLS_DIR}/${protocolName}.yaml`);
    p.log.info("Edit the file to customize phases, agents, and gates.");
    p.log.info(`Run "sniper protocol validate ${protocolName}" to check your protocol.`);
  },
});

const listSubcommand = defineCommand({
  meta: {
    name: "list",
    description: "List all available protocols (built-in and custom)",
  },
  run: async () => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    // Built-in protocols
    let builtInFiles: string[] = [];
    try {
      const corePath = getCorePath();
      const protocolsPath = join(corePath, "protocols");
      const files = await readdir(protocolsPath);
      builtInFiles = files.filter((f) => f.endsWith(".yaml"));
    } catch {
      p.log.warn("Could not read built-in protocols from @sniper.ai/core.");
    }

    // Custom protocols
    let customFiles: string[] = [];
    try {
      const customDir = join(cwd, CUSTOM_PROTOCOLS_DIR);
      const files = await readdir(customDir);
      customFiles = files.filter((f) => f.endsWith(".yaml"));
    } catch {
      // No custom protocols directory
    }

    if (builtInFiles.length === 0 && customFiles.length === 0) {
      p.log.info("No protocols found.");
      return;
    }

    if (builtInFiles.length > 0) {
      p.log.step("Built-in protocols:");
      for (const file of builtInFiles) {
        const name = file.replace(/\.yaml$/, "");
        try {
          const corePath = getCorePath();
          const raw = await readFile(join(corePath, "protocols", file), "utf-8");
          const data = YAML.parse(raw) as Record<string, unknown>;
          console.log(`  - ${name}: ${data.description || "(no description)"}`);
        } catch {
          console.log(`  - ${name}`);
        }
      }
    }

    if (customFiles.length > 0) {
      p.log.step("Custom protocols:");
      for (const file of customFiles) {
        const name = file.replace(/\.yaml$/, "");
        try {
          const raw = await readFile(join(cwd, CUSTOM_PROTOCOLS_DIR, file), "utf-8");
          const data = YAML.parse(raw) as Record<string, unknown>;
          console.log(`  - ${name}: ${data.description || "(no description)"}`);
        } catch {
          console.log(`  - ${name}`);
        }
      }
    }
  },
});

const validateSubcommand = defineCommand({
  meta: {
    name: "validate",
    description: "Validate a custom protocol against the schema",
  },
  args: {
    name: {
      type: "positional",
      description: "Protocol name to validate",
      required: true,
    },
  },
  run: async ({ args }) => {
    const cwd = process.cwd();

    if (!(await sniperConfigExists(cwd))) {
      p.log.error('SNIPER is not initialized. Run "sniper init" first.');
      process.exit(1);
    }

    const filePath = join(cwd, CUSTOM_PROTOCOLS_DIR, `${args.name}.yaml`);

    let raw: string;
    try {
      raw = await readFile(filePath, "utf-8");
    } catch {
      p.log.error(`Protocol not found: ${CUSTOM_PROTOCOLS_DIR}/${args.name}.yaml`);
      process.exit(1);
    }

    let data: unknown;
    try {
      data = YAML.parse(raw);
    } catch (err) {
      p.log.error(`Invalid YAML: ${err}`);
      process.exit(1);
    }

    const errors = validateProtocol(data);

    if (errors.length === 0) {
      p.log.success(`Protocol "${args.name}" is valid.`);
    } else {
      p.log.error(`Protocol "${args.name}" has ${errors.length} error(s):`);
      for (const err of errors) {
        console.log(`  ${err.path}: ${err.message}`);
      }
      process.exit(1);
    }
  },
});

export const protocolCommand = defineCommand({
  meta: {
    name: "protocol",
    description: "Manage SNIPER protocols",
  },
  subCommands: {
    create: createSubcommand,
    list: listSubcommand,
    validate: validateSubcommand,
  },
});
