import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER YAML schemas.
 * Source: packages/core/schemas/*.schema.yaml
 * Output: packages/docs/generated/schemas/*.md
 */
export async function generateSchemas(frameworkDir, outputDir) {
  const schemasDir = join(frameworkDir, 'schemas');
  const outDir = join(outputDir, 'schemas');
  await mkdir(outDir, { recursive: true });

  let files;
  try {
    files = (await readdir(schemasDir)).filter(
      (f) => f.endsWith('.yaml') || f.endsWith('.yml')
    );
  } catch {
    console.warn('  ⚠ schemas/ directory not found, skipping schemas generation');
    return [];
  }

  const sidebarItems = [];

  for (const file of files) {
    try {
      const content = await readFile(join(schemasDir, file), 'utf-8');
      const slug = file.replace(/\.schema\.(yaml|yml)$/, '').replace(/\.(yaml|yml)$/, '');

      // Extract title and description from schema
      const titleMatch = content.match(/^title:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : slug;
      const description = descMatch ? descMatch[1].trim() : '';

      // Extract required fields
      const requiredMatch = content.match(/^required:\s*\n((?:\s+-\s+\S+\n?)+)/m);
      const required = requiredMatch
        ? [...requiredMatch[1].matchAll(/-\s+(\S+)/g)].map((m) => m[1])
        : [];

      // Extract top-level properties
      const properties = [];
      const propsRegex = /^  (\w[\w-]*):\s*\n\s+type:\s*(\S+)(?:\n\s+description:\s*(.+))?/gm;
      let match;
      while ((match = propsRegex.exec(content)) !== null) {
        properties.push({
          name: match[1],
          type: match[2],
          description: (match[3] || '').trim(),
          required: required.includes(match[1]),
        });
      }

      // Build the page
      const lines = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        'pageLayout: reference',
        'pageType: schema',
        ...(description ? [`description: "${description.replace(/"/g, '\\"')}"`] : []),
        `sourceFile: "${file}"`,
        '---',
        '',
        `# ${title}`,
        '',
      ];

      if (description) {
        lines.push(`> ${description}`, '');
      }

      if (properties.length > 0) {
        lines.push('## Properties', '');
        lines.push('| Property | Type | Required | Description |');
        lines.push('|----------|------|----------|-------------|');
        for (const prop of properties) {
          lines.push(
            `| \`${prop.name}\` | ${prop.type} | ${prop.required ? 'Yes' : 'No'} | ${prop.description} |`
          );
        }
        lines.push('');
      }

      lines.push('## Full Schema', '');
      lines.push('```yaml', content.trimEnd(), '```');

      await writeFile(join(outDir, `${slug}.md`), lines.join('\n'), 'utf-8');

      sidebarItems.push({
        text: title,
        link: `/reference/schemas/${slug}`,
        description,
      });
    } catch (err) {
      console.error(`  Error processing schema ${file}: ${err.message}`);
    }
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
