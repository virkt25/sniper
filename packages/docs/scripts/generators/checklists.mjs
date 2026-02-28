import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER checklists.
 * Source: packages/core/checklists/*.yaml and *.md
 * Output: packages/docs/generated/checklists/*.md
 */
export async function generateChecklists(frameworkDir, outputDir) {
  const checklistsDir = join(frameworkDir, 'checklists');
  const outDir = join(outputDir, 'checklists');
  await mkdir(outDir, { recursive: true });

  let allFiles;
  try {
    allFiles = await readdir(checklistsDir);
  } catch {
    console.warn('  ⚠ checklists/ directory not found, skipping checklists generation');
    return [];
  }

  const files = allFiles.filter((f) => f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.yml'));
  const sidebarItems = [];

  for (const file of files) {
    try {
      const content = await readFile(join(checklistsDir, file), 'utf-8');
      const slug = file.replace(/\.(md|yaml|yml)$/, '');
      const isYaml = file.endsWith('.yaml') || file.endsWith('.yml');

      let title;
      let gateMode = null;
      let pageContent;

      if (isYaml) {
        // Parse YAML checklist: extract name, description, checks
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const descMatch = content.match(/^description:\s*(.+)$/m);
        title = nameMatch ? nameMatch[1].trim() : slug;
        const description = descMatch ? descMatch[1].trim() : '';

        // Extract checks for display
        const checks = [];
        const checkRegex = /- id:\s*(\S+)\s*\n\s*description:\s*(.+)\n\s*check:\s*(.+)\n\s*blocking:\s*(true|false)/g;
        let match;
        while ((match = checkRegex.exec(content)) !== null) {
          checks.push({
            id: match[1],
            description: match[2].trim(),
            check: match[3].trim(),
            blocking: match[4] === 'true',
          });
        }

        // Build markdown representation
        const bodyLines = [];
        bodyLines.push(`# ${title}`);
        bodyLines.push('');
        if (description) bodyLines.push(`> ${description}`, '');

        if (checks.length > 0) {
          bodyLines.push('## Checks', '');
          bodyLines.push('| Check | Description | Type | Blocking |');
          bodyLines.push('|-------|-------------|------|----------|');
          for (const check of checks) {
            const type = check.check.startsWith('file:') ? 'File exists'
              : check.check.startsWith('grep:') ? 'Pattern match'
              : check.check.startsWith('!grep:') ? 'Pattern absent'
              : check.check.startsWith('command:') ? 'Command'
              : check.check.startsWith('wc:') ? 'Size check'
              : 'Custom';
            bodyLines.push(`| \`${check.id}\` | ${check.description} | ${type} | ${check.blocking ? 'Yes' : 'No'} |`);
          }
          bodyLines.push('');
        }

        bodyLines.push('## Raw Definition', '');
        bodyLines.push('```yaml', content.trimEnd(), '```');

        pageContent = bodyLines.join('\n');
      } else {
        // Markdown checklist (original behavior)
        const firstLine = content.split('\n')[0] || '';
        const titleMatch = firstLine.match(/^#\s+(.+)$/);
        title = titleMatch ? titleMatch[1].trim() : slug;

        const modeMatch = content.match(/Gate mode:\s*\*\*(\w+)\*\*/i);
        gateMode = modeMatch ? modeMatch[1] : null;

        pageContent = content;
      }

      // Build the page
      const lines = [
        '---',
        `title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
        'pageLayout: reference',
        'pageType: checklist',
        ...(gateMode ? [`gateMode: ${gateMode.toLowerCase()}`] : []),
        '---',
        '',
      ];

      if (gateMode) {
        const badgeClass = gateMode.toLowerCase() === 'strict' ? 'danger' : 'tip';
        lines.push(
          '<div v-pre>',
          '',
          `<span class="VPBadge ${badgeClass}">${gateMode.toUpperCase()}</span>`,
          '',
          pageContent,
          '',
          '</div>'
        );
      } else {
        lines.push('<div v-pre>', '', pageContent, '', '</div>');
      }

      await writeFile(join(outDir, `${slug}.md`), lines.join('\n'), 'utf-8');

      sidebarItems.push({
        text: title,
        link: `/reference/checklists/${slug}`,
      });
    } catch (err) {
      console.error(`  Error processing checklist ${file}: ${err.message}`);
    }
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
