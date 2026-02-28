import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER commands.
 * Source: packages/core/skills/{name}/SKILL.md
 * Output: packages/docs/generated/commands/{name}.md
 */
export async function generateCommands(frameworkDir, outputDir) {
  const skillsDir = join(frameworkDir, 'skills');
  const outDir = join(outputDir, 'commands');
  await mkdir(outDir, { recursive: true });

  let skillDirs;
  try {
    skillDirs = await readdir(skillsDir);
  } catch {
    console.warn('  ⚠ skills/ directory not found, skipping commands generation');
    return [];
  }

  const sidebarItems = [];

  for (const dir of skillDirs) {
    const skillFile = join(skillsDir, dir, 'SKILL.md');
    try {
      const content = await readFile(skillFile, 'utf-8');
      const slug = dir;

      // Strip YAML frontmatter to get the body
      let body = content;
      let commandName = `/${slug}`;
      let description = '';

      if (content.startsWith('---')) {
        const fmEnd = content.indexOf('---', 3);
        if (fmEnd !== -1) {
          const frontmatter = content.slice(3, fmEnd);
          body = content.slice(fmEnd + 3).trim();

          // Extract name and description from frontmatter
          const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
          const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
          if (nameMatch) commandName = `/${nameMatch[1].trim()}`;
          if (descMatch) description = descMatch[1].trim();
        }
      }

      // Also try parsing first heading: # /sniper-{name}
      const firstLine = body.split('\n')[0] || '';
      const headingMatch = firstLine.match(/^#\s+(\/\S+)(?:\s+--\s+(.+))?$/);
      if (headingMatch) {
        commandName = headingMatch[1];
        if (headingMatch[2]) description = headingMatch[2].trim();
      }

      // Build the generated page — wrap in v-pre to prevent Vue from
      // parsing curly braces and HTML comments in command source
      const page = [
        '---',
        `title: "${commandName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
        'pageLayout: reference',
        'pageType: command',
        ...(description ? [`description: "${description.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`] : []),
        '---',
        '',
        '<div v-pre>',
        '',
        body,
        '',
        '</div>',
      ].join('\n');

      await writeFile(join(outDir, `${slug}.md`), page, 'utf-8');

      sidebarItems.push({
        text: commandName,
        link: `/reference/commands/${slug}`,
        description,
      });
    } catch {
      // SKILL.md not found in this directory, skip
      continue;
    }
  }

  // Sort alphabetically by command name
  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
