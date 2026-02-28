import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER hook definitions.
 * Source: packages/core/hooks/*.json
 * Output: packages/docs/generated/hooks/*.md
 */
export async function generateHooks(frameworkDir, outputDir) {
  const hooksDir = join(frameworkDir, 'hooks');
  const outDir = join(outputDir, 'hooks');
  await mkdir(outDir, { recursive: true });

  let files;
  try {
    files = (await readdir(hooksDir)).filter((f) => f.endsWith('.json'));
  } catch {
    console.warn('  ⚠ hooks/ directory not found, skipping hooks generation');
    return [];
  }

  const sidebarItems = [];

  for (const file of files) {
    try {
      const content = await readFile(join(hooksDir, file), 'utf-8');
      const slug = file.replace(/\.json$/, '');
      const data = JSON.parse(content);

      // Derive a human-readable title
      const title = slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const hooks = data.hooks || {};

      // Build the page
      const lines = [
        '---',
        `title: "${title}"`,
        'pageLayout: reference',
        'pageType: hooks',
        `sourceFile: "${file}"`,
        '---',
        '',
        `# ${title}`,
        '',
        `> Source: \`${file}\``,
        '',
      ];

      for (const [event, hookList] of Object.entries(hooks)) {
        lines.push(`## ${event}`, '');

        if (!Array.isArray(hookList)) continue;

        for (const hook of hookList) {
          const hookTitle = hook.description || hook.matcher || 'Hook';
          lines.push(`### ${hookTitle}`, '');

          if (hook.matcher) lines.push(`- **Matcher:** \`${hook.matcher}\``);
          if (hook.agent) lines.push(`- **Agent:** \`${hook.agent}\``);
          if (hook.description) lines.push(`- **Description:** ${hook.description}`);
          lines.push('');

          if (hook.command) {
            lines.push('**Command:**', '');
            lines.push('```bash', hook.command, '```', '');
          }
        }
      }

      lines.push('## Raw Definition', '');
      lines.push('```json', JSON.stringify(data, null, 2), '```');

      await writeFile(join(outDir, `${slug}.md`), lines.join('\n'), 'utf-8');

      sidebarItems.push({
        text: title,
        link: `/reference/hooks/${slug}`,
      });
    } catch (err) {
      console.error(`  Error processing hooks ${file}: ${err.message}`);
    }
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
