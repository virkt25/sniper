import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER commands.
 * Source: packages/core/framework/commands/*.md
 * Output: packages/docs/generated/commands/*.md
 */
export async function generateCommands(frameworkDir, outputDir) {
  const commandsDir = join(frameworkDir, 'commands');
  const outDir = join(outputDir, 'commands');
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(commandsDir)).filter((f) => f.endsWith('.md'));
  const sidebarItems = [];

  for (const file of files) {
    try {
      const content = await readFile(join(commandsDir, file), 'utf-8');
      const slug = file.replace(/\.md$/, '');

      // Parse first line: # /sniper-{name} -- {description}
      const firstLine = content.split('\n')[0] || '';
      const match = firstLine.match(/^#\s+(\/\S+)\s+--\s+(.+)$/);
      const commandName = match ? match[1] : `/${slug}`;
      const description = match ? match[2].trim() : '';

      // Build the generated page — wrap in v-pre to prevent Vue from
      // parsing curly braces and HTML comments in command source
      const page = [
        '---',
        `title: "${commandName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
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
        text: commandName,
        link: `/reference/commands/${slug}`,
        description,
      });
    } catch (err) {
      console.error(`  Error processing command ${file}: ${err.message}`);
    }
  }

  // Sort alphabetically by command name
  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
