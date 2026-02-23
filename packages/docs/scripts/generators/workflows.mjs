import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER workflows.
 * Source: packages/core/framework/workflows/*.md
 * Output: packages/docs/generated/workflows/*.md
 */
export async function generateWorkflows(frameworkDir, outputDir) {
  const workflowsDir = join(frameworkDir, 'workflows');
  const outDir = join(outputDir, 'workflows');
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(workflowsDir)).filter((f) => f.endsWith('.md'));
  const sidebarItems = [];

  for (const file of files) {
    try {
      const content = await readFile(join(workflowsDir, file), 'utf-8');
      const slug = file.replace(/\.md$/, '');

      // Parse title from first heading
      const firstLine = content.split('\n')[0] || '';
      const match = firstLine.match(/^#\s+(.+)$/);
      const title = match ? match[1].trim() : slug;

      const page = [
        '---',
        `title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
        'layout: reference',
        'pageType: workflow',
        '---',
        '',
        '<div v-pre>',
        '',
        content,
        '',
        '</div>',
      ].join('\n');

      await writeFile(join(outDir, `${slug}.md`), page, 'utf-8');

      sidebarItems.push({
        text: title,
        link: `/reference/workflows/${slug}`,
      });
    } catch (err) {
      console.error(`  Error processing workflow ${file}: ${err.message}`);
    }
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
