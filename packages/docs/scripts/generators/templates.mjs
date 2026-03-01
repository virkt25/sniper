import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER templates.
 * Source: packages/core/templates/*.md and *.yaml
 * Output: packages/docs/generated/templates/*.md
 */
export async function generateTemplates(frameworkDir, outputDir) {
  const templatesDir = join(frameworkDir, 'templates');
  const outDir = join(outputDir, 'templates');
  await mkdir(outDir, { recursive: true });

  let allFiles;
  try {
    allFiles = await readdir(templatesDir);
  } catch {
    console.warn('  ⚠ templates/ directory not found, skipping templates generation');
    return [];
  }
  const files = allFiles.filter(
    (f) => f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.yml')
  );
  const sidebarItems = [];

  for (const file of files) {
    try {
      const content = await readFile(join(templatesDir, file), 'utf-8');
      const slug = file.replace(/\.(md|yaml|yml)$/, '');
      const ext = file.split('.').pop();
      const isYaml = ext === 'yaml' || ext === 'yml';

      // Derive title
      let title;
      if (isYaml) {
        // YAML templates: use first meaningful comment line (skip decorative lines like ───)
        const commentLines = content.match(/^#\s+(.+)/gm) || [];
        const meaningful = commentLines
          .map((l) => l.replace(/^#\s+/, '').trim())
          .find((l) => l.length > 0 && !/^[─\-=*~]+$/.test(l));
        title = meaningful || slug;
      } else {
        // Markdown templates: parse first heading
        const headingMatch = content.match(/^#\s+(.+)/m);
        title = headingMatch ? headingMatch[1].trim() : slug;
      }

      // Clean up template placeholders in title
      title = title.replace(/\{[^}]+\}/g, (m) => `\`${m}\``);

      const lines = [
        '---',
        `title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
        'pageLayout: reference',
        'pageType: template',
        `sourceFile: "${file}"`,
        `format: ${isYaml ? 'yaml' : 'markdown'}`,
        '---',
        '',
      ];

      if (isYaml) {
        lines.push(`# ${title}`, '');
        lines.push(`> Source: \`${file}\``, '');
        lines.push('```yaml', content.trimEnd(), '```', '');
      } else {
        // Wrap markdown templates in a fenced code block to prevent
        // VitePress from parsing HTML comments and curly braces
        lines.push(`# ${title}`, '');
        lines.push(`> Source: \`${file}\``, '');
        lines.push('```markdown', content.trimEnd(), '```', '');
      }

      await writeFile(join(outDir, `${slug}.md`), lines.join('\n'), 'utf-8');

      sidebarItems.push({
        text: title,
        link: `/reference/templates/${slug}`,
      });
    } catch (err) {
      console.error(`  Error processing template ${file}: ${err.message}`);
    }
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
