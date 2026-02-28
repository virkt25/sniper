import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate /llms.txt — a structured index of all documentation for AI consumption.
 * Reads guide markdown files and generated reference pages, extracts titles/descriptions,
 * and produces a text file following the llms.txt convention.
 *
 * Should be called after all other generators complete.
 */
export async function generateLlmsTxt(docsDir, outputDir, generatedDir) {
  const lines = [];

  lines.push('# SNIPER Documentation');
  lines.push('> AI-Powered Project Lifecycle Framework for Claude Code');
  lines.push('');

  // Guide pages (manual ordering)
  const guideOrder = [
    'why-sniper',
    'what-is-sniper',
    'getting-started',
    'core-concepts',
    'architecture',
    'configuration',
    'full-lifecycle',
    'review-gates',
    'headless-ci',
    'custom-protocols',
    'personas',
    'teams',
    'domain-packs',
    'workspace-mode',
    'memory',
    'signals-and-learning',
    'advanced-features',
    'plugin-development',
    'migration-from-v2',
    'troubleshooting',
    'glossary',
    'cheatsheet-commands',
    'cheatsheet-teams',
    'cheatsheet-personas',
  ];

  lines.push('## Guide');
  const guideDir = join(docsDir, 'guide');
  for (const slug of guideOrder) {
    const info = await extractFrontmatter(join(guideDir, `${slug}.md`));
    if (info) {
      const desc = info.description ? `: ${info.description}` : '';
      lines.push(`- [${info.title}](/guide/${slug})${desc}`);
    }
  }
  lines.push('');

  // Reference sections in priority order
  const refSections = [
    { name: 'Commands', dir: 'commands', urlPrefix: '/reference/commands' },
    { name: 'Personas', dir: 'personas', urlPrefix: '/reference/personas' },
    { name: 'Teams', dir: 'teams', urlPrefix: '/reference/teams' },
    { name: 'Checklists', dir: 'checklists', urlPrefix: '/reference/checklists' },
    { name: 'Templates', dir: 'templates', urlPrefix: '/reference/templates' },
    { name: 'Workflows', dir: 'workflows', urlPrefix: '/reference/workflows' },
  ];

  for (const section of refSections) {
    const sectionDir = join(generatedDir, section.dir);
    let files;
    try {
      files = (await readdir(sectionDir, { recursive: true }))
        .filter((f) => f.endsWith('.md'));
    } catch {
      continue;
    }

    if (files.length === 0) continue;

    lines.push(`## ${section.name}`);

    const items = [];
    for (const file of files) {
      const info = await extractFrontmatter(join(sectionDir, file));
      if (info) {
        const slug = file.replace(/\.md$/, '');
        const desc = info.description ? `: ${info.description}` : '';
        items.push({ title: info.title, slug, desc });
      }
    }

    items.sort((a, b) => a.title.localeCompare(b.title));

    for (const item of items) {
      lines.push(`- [${item.title}](${section.urlPrefix}/${item.slug})${item.desc}`);
    }
    lines.push('');
  }

  const content = lines.join('\n');
  const outPath = join(docsDir, 'public', 'llms.txt');
  await writeFile(outPath, content, 'utf-8');

  return outPath;
}

async function extractFrontmatter(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Parse YAML frontmatter
    if (content.startsWith('---')) {
      const end = content.indexOf('---', 3);
      if (end !== -1) {
        const fm = content.slice(3, end);
        const title = extractYamlValue(fm, 'title');
        const description = extractYamlValue(fm, 'description');
        if (title) return { title, description };
      }
    }

    // Fallback: first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return { title: headingMatch[1].trim(), description: '' };
    }

    return null;
  } catch {
    return null;
  }
}

function extractYamlValue(yaml, key) {
  const match = yaml.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'));
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
}
