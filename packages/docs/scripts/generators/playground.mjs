import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';

const LAYER_ORDER = ['process', 'technical', 'cognitive', 'domain'];

const PHASE_MAP = {
  discover: 'S',
  plan: 'N',
  solve: 'I',
  sprint: 'P',
  review: 'E',
  release: 'R',
};

/**
 * Generate playground-data.json for interactive playground features.
 * Produces structured data for Command Playground, Persona Composer, and Team Builder.
 */
export async function generatePlayground(frameworkDir, outputDir) {
  const [commands, personas, teams, spawnTemplate] = await Promise.all([
    readCommands(frameworkDir),
    readPersonas(frameworkDir),
    readTeams(frameworkDir),
    readSpawnTemplate(frameworkDir),
  ]);

  const data = { commands, personas, teams, spawnTemplate };
  const outPath = join(outputDir, 'playground-data.json');
  await writeFile(outPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`  Playground: ${outPath}`);
  return outPath;
}

async function readCommands(frameworkDir) {
  const commandsDir = join(frameworkDir, 'commands');
  const files = (await readdir(commandsDir)).filter((f) => f.endsWith('.md'));
  const commands = [];

  for (const file of files) {
    const content = await readFile(join(commandsDir, file), 'utf-8');
    const slug = file.replace(/\.md$/, '');

    // Parse first line: # /sniper-{name} -- {description}
    const firstLine = content.split('\n')[0] || '';
    const match = firstLine.match(/^#\s+(\/\S+)\s+--\s+(.+)$/);
    const name = match ? match[1] : `/${slug}`;
    const description = match ? match[2].trim() : '';

    // Detect phase from slug or content
    const phase = detectCommandPhase(slug, content);

    // Generate simulated terminal output from the command description
    const terminalLines = generateTerminalLines(name, slug, content);

    // Extract metadata: files created, agents spawned
    const meta = extractCommandMeta(content);

    commands.push({ name, slug, description, phase, terminalLines, meta });
  }

  commands.sort((a, b) => a.name.localeCompare(b.name));
  return commands;
}

function detectCommandPhase(slug, content) {
  const phaseKeywords = {
    discover: 'discover',
    plan: 'plan',
    solve: 'solve',
    sprint: 'sprint',
    review: 'review',
    init: 'init',
    compose: 'compose',
    status: 'status',
    doc: 'doc',
    memory: 'memory',
    debug: 'debug',
    feature: 'feature',
    ingest: 'ingest',
    audit: 'audit',
  };

  for (const [key, val] of Object.entries(phaseKeywords)) {
    if (slug.includes(key)) return val;
  }
  return null;
}

function generateTerminalLines(name, slug, content) {
  const lines = [
    { type: 'prompt', text: `> ${name}`, delay: 0 },
  ];

  // Parse steps from the markdown
  const stepMatches = content.match(/^## Step \d+:?\s+(.+)$/gm) || [];
  const steps = stepMatches.map((s) => s.replace(/^## Step \d+:?\s+/, '').trim());

  if (steps.length === 0) {
    lines.push(
      { type: 'output', text: `Running ${name}...`, delay: 400 },
      { type: 'success', text: `${name} complete.`, delay: 600 },
    );
    return lines;
  }

  // Check if this spawns a team
  const spawnsTeam = content.includes('TeamCreate') || content.includes('spawn') || content.includes('Spawn');
  if (spawnsTeam) {
    const teamMatch = content.match(/team_name[:\s]+"?([^"\n]+)"?/);
    const teamName = teamMatch ? teamMatch[1] : slug;
    lines.push({ type: 'comment', text: `# Setting up ${teamName}...`, delay: 400 });
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isLast = i === steps.length - 1;

    if (step.toLowerCase().includes('pre-flight') || step.toLowerCase().includes('verify')) {
      lines.push({ type: 'output', text: `Checking ${step.toLowerCase()}...`, delay: 200 });
      lines.push({ type: 'output', text: `  All checks passed`, delay: 150 });
    } else if (step.toLowerCase().includes('spawn') || step.toLowerCase().includes('team')) {
      lines.push({ type: 'comment', text: `# ${step}`, delay: 300 });
      // Look for teammate names in the content
      const teammateMatches = content.match(/### Teammate:\s+(\S+)/g) || [];
      for (const tm of teammateMatches) {
        const tmName = tm.replace('### Teammate: ', '');
        lines.push({ type: 'output', text: `[${tmName}] Spawned and assigned tasks`, delay: 200 });
      }
    } else if (step.toLowerCase().includes('result') || step.toLowerCase().includes('summary') || step.toLowerCase().includes('next')) {
      // Skip — we'll add a success line at the end
    } else if (step.toLowerCase().includes('review') || step.toLowerCase().includes('gate')) {
      lines.push({ type: 'output', text: `Running review gate...`, delay: 300 });
      lines.push({ type: 'output', text: `  Checklist: 12/12 items passed`, delay: 200 });
    } else {
      lines.push({ type: 'output', text: `${step}...`, delay: 250 });
    }
  }

  lines.push({ type: 'success', text: `${name} complete.`, delay: 400 });
  return lines;
}

function extractCommandMeta(content) {
  const meta = {
    filesCreated: [],
    agentsSpawned: [],
    requiresReview: false,
  };

  // Extract output files
  const outputMatches = content.match(/\*\*Output(?:\s+File)?:\*\*\s+`([^`]+)`/g) || [];
  for (const m of outputMatches) {
    const file = m.match(/`([^`]+)`/)?.[1];
    if (file) meta.filesCreated.push(file);
  }

  // Extract teammate names
  const teammateMatches = content.match(/### Teammate:\s+(\S+)/g) || [];
  for (const tm of teammateMatches) {
    meta.agentsSpawned.push(tm.replace('### Teammate: ', ''));
  }

  // Check for review gate
  meta.requiresReview = content.includes('Review Gate') || content.includes('review_gate');

  return meta;
}

async function readPersonas(frameworkDir) {
  const personasDir = join(frameworkDir, 'personas');
  const result = {};

  for (const layer of LAYER_ORDER) {
    const layerDir = join(personasDir, layer);
    let files;
    try {
      files = (await readdir(layerDir)).filter((f) => f.endsWith('.md'));
    } catch {
      continue;
    }

    const items = [];
    for (const file of files) {
      const content = await readFile(join(layerDir, file), 'utf-8');
      const slug = file.replace(/\.md$/, '');

      // Parse name from first line: # {Name} ({Layer} Layer)
      const firstLine = content.split('\n')[0] || '';
      const match = firstLine.match(/^#\s+(.+?)\s*(\(.+\))?\s*$/);
      const name = match ? match[1].trim() : slug;

      // Extract summary: first non-empty paragraph after heading
      const paragraphs = content.split('\n\n').slice(1);
      let summary = '';
      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && !trimmed.startsWith('|')) {
          // Strip markdown formatting
          summary = trimmed
            .replace(/^##?\s+.+\n?/, '')
            .replace(/\*\*/g, '')
            .replace(/\n/g, ' ')
            .trim();
          if (summary.length > 0) break;
        }
      }

      // Truncate summary
      if (summary.length > 150) {
        summary = summary.slice(0, 147) + '...';
      }

      items.push({ slug, name, summary, link: `/reference/personas/${layer}/${slug}` });
    }

    items.sort((a, b) => a.name.localeCompare(b.name));
    result[layer] = items;
  }

  return result;
}

async function readTeams(frameworkDir) {
  const teamsDir = join(frameworkDir, 'teams');
  const files = (await readdir(teamsDir)).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  const teams = [];

  for (const file of files) {
    const raw = await readFile(join(teamsDir, file), 'utf-8');
    const data = YAML.parse(raw);
    const slug = file.replace(/\.(yaml|yml)$/, '');

    const teamName = data.team_name || slug;
    const phase = data.phase || '';
    const phaseCode = PHASE_MAP[phase] || null;

    // Normalize teammates (handle both 'teammates' and 'available_teammates')
    const rawMembers = data.teammates || data.available_teammates || [];
    const members = rawMembers.map((m) => ({
      name: m.name,
      compose: m.compose || {},
      layers: Object.entries(m.compose || {})
        .filter(([, v]) => v != null)
        .map(([k]) => k),
    }));

    // Extract tasks per member
    const tasks = [];
    for (const m of rawMembers) {
      for (const t of (m.tasks || [])) {
        tasks.push({
          id: t.id,
          name: t.name || t.id,
          member: m.name,
          output: t.output || null,
          dependsOn: t.depends_on || t.blocked_by || null,
          planApproval: t.plan_approval || false,
        });
      }
    }

    // Dependencies: from tasks + coordination
    const dependencies = [];
    for (const t of tasks) {
      const deps = t.dependsOn;
      if (deps) {
        const depList = Array.isArray(deps) ? deps : [deps];
        for (const d of depList) {
          // Find the member who owns the dependency task
          const depTask = tasks.find((tt) => tt.id === d);
          if (depTask) {
            dependencies.push({ from: depTask.member, to: t.member, label: `${d} → ${t.id}` });
          }
        }
      }
    }

    const coordination = (data.coordination || []).map((c) => ({
      between: c.between,
      topic: c.topic,
    }));

    const reviewGate = data.review_gate ? {
      mode: data.review_gate.mode,
      checklist: data.review_gate.checklist,
    } : null;

    teams.push({
      slug,
      name: teamName,
      phase,
      phaseCode,
      members,
      tasks,
      dependencies,
      coordination,
      reviewGate,
      link: `/reference/teams/${slug}`,
    });
  }

  teams.sort((a, b) => a.name.localeCompare(b.name));
  return teams;
}

async function readSpawnTemplate(frameworkDir) {
  try {
    const content = await readFile(join(frameworkDir, 'spawn-prompts', '_template.md'), 'utf-8');
    return content;
  } catch {
    return '# Teammate: {name}\n\n## Your Role\n{process_layer}\n\n## Technical Expertise\n{technical_layer}\n\n## How You Think\n{cognitive_layer}\n\n## Domain Context\n{domain_layer}';
  }
}
