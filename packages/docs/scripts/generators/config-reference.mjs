import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate a reference page for the SNIPER configuration schema.
 * Source: packages/core/config.template.yaml
 * Output: packages/docs/generated/config/index.md
 */
export async function generateConfigReference(frameworkDir, outputDir) {
  const configPath = join(frameworkDir, 'config.template.yaml');
  const outDir = join(outputDir, 'config');
  await mkdir(outDir, { recursive: true });

  let content;
  try {
    content = await readFile(configPath, 'utf-8');
  } catch {
    console.warn('  ⚠ config.template.yaml not found, skipping config reference');
    return [];
  }

  // Extract top-level sections from the config template
  const sections = [];
  const sectionRegex = /^(\w[\w_]*):/gm;
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push(match[1]);
  }

  // Build the page
  const lines = [
    '---',
    'title: "Configuration Reference"',
    'pageLayout: reference',
    'pageType: config',
    'description: "Complete reference for .sniper/config.yaml"',
    '---',
    '',
    '# Configuration Reference',
    '',
    '> Complete reference for `.sniper/config.yaml`. Generated from the v3 config template.',
    '',
    '## Sections',
    '',
  ];

  for (const section of sections) {
    lines.push(`- [\`${section}\`](#${section})`);
  }
  lines.push('');

  // Extract each section's content with its comments
  const sectionBlocks = content.split(/\n(?=\w)/);
  for (const block of sectionBlocks) {
    const nameMatch = block.match(/^(\w[\w_]*):/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    lines.push(`## \`${name}\` {#${name}}`, '');

    // Extract preceding comments as description
    const commentLines = [];
    const blockLines = block.split('\n');
    for (const line of blockLines) {
      if (line.startsWith('#')) {
        commentLines.push(line.replace(/^#\s*/, ''));
      }
    }

    if (commentLines.length > 0) {
      lines.push(commentLines.join(' ').trim(), '');
    }

    lines.push('```yaml', block.trimEnd(), '```', '');
  }

  lines.push('---', '');
  lines.push('## Full Template', '');
  lines.push('```yaml', content.trimEnd(), '```');

  const outPath = join(outDir, 'index.md');
  await writeFile(outPath, lines.join('\n'), 'utf-8');

  return [
    {
      text: 'Configuration',
      link: '/reference/config/',
    },
  ];
}
