import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER checklists.
 * Source: packages/core/framework/checklists/*.md
 * Output: packages/docs/generated/checklists/*.md
 */
export async function generateChecklists(frameworkDir, outputDir) {
  const checklistsDir = join(frameworkDir, 'checklists');
  const outDir = join(outputDir, 'checklists');
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(checklistsDir)).filter((f) => f.endsWith('.md'));
  const sidebarItems = [];

  for (const file of files) {
    const content = await readFile(join(checklistsDir, file), 'utf-8');
    const slug = file.replace(/\.md$/, '');

    // Parse title from first line: # {Name}
    const firstLine = content.split('\n')[0] || '';
    const titleMatch = firstLine.match(/^#\s+(.+)$/);
    const title = titleMatch ? titleMatch[1].trim() : slug;

    // Extract gate mode: Gate mode: **{MODE}**
    const modeMatch = content.match(/Gate mode:\s*\*\*(\w+)\*\*/i);
    const gateMode = modeMatch ? modeMatch[1] : null;

    // Build the page with a badge for gate mode
    const lines = [
      '---',
      `title: "${title}"`,
      '---',
      '',
    ];

    // Wrap in v-pre to prevent Vue from parsing curly braces
    // But keep the Badge component outside v-pre since it's a Vue component
    if (gateMode) {
      lines.push(
        `<Badge type="${gateMode.toLowerCase() === 'strict' ? 'danger' : 'tip'}" text="${gateMode}" />`,
        '',
        '<div v-pre>',
        '',
        content,
        '',
        '</div>'
      );
    } else {
      lines.push('<div v-pre>', '', content, '', '</div>');
    }

    await writeFile(join(outDir, `${slug}.md`), lines.join('\n'), 'utf-8');

    sidebarItems.push({
      text: title,
      link: `/reference/checklists/${slug}`,
    });
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
