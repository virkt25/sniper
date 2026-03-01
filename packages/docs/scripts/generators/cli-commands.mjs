import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Generate reference pages for SNIPER CLI subcommands.
 * Source: packages/cli/src/commands/*.ts
 * Output: packages/docs/generated/cli/*.md
 */
export async function generateCliCommands(cliDir, outputDir) {
  const commandsDir = join(cliDir, 'src', 'commands');
  const outDir = join(outputDir, 'cli');
  await mkdir(outDir, { recursive: true });

  let files;
  try {
    files = (await readdir(commandsDir)).filter((f) => f.endsWith('.ts'));
  } catch {
    console.warn('  ⚠ CLI commands directory not found, skipping CLI generation');
    return [];
  }

  const sidebarItems = [];

  for (const file of files) {
    try {
      const content = await readFile(join(commandsDir, file), 'utf-8');
      const slug = file.replace(/\.ts$/, '');

      // Extract command metadata from citty defineCommand call
      const descMatch = content.match(/description:\s*["'`]([^"'`]+)["'`]/);
      const description = descMatch ? descMatch[1].trim() : '';

      // Extract args
      const args = [];
      const argsRegex = /(\w+):\s*\{\s*(?:type:\s*["'](\w+)["'][,\s]*)?description:\s*["'`]([^"'`]+)["'`]/g;
      let match;
      while ((match = argsRegex.exec(content)) !== null) {
        args.push({
          name: match[1],
          type: match[2] || 'string',
          description: match[3],
        });
      }

      // Extract subcommands if any
      const subCommands = [];
      const subCmdRegex = /subCommands:\s*\{([^}]+)\}/s;
      const subCmdMatch = content.match(subCmdRegex);
      if (subCmdMatch) {
        const subCmdBlock = subCmdMatch[1];
        const subNames = [...subCmdBlock.matchAll(/(\w+):/g)].map((m) => m[1]);
        subCommands.push(...subNames);
      }

      // Build the page
      const lines = [
        '---',
        `title: "sniper ${slug}"`,
        'pageLayout: reference',
        'pageType: cli-command',
        ...(description ? [`description: "${description.replace(/"/g, '\\"')}"`] : []),
        '---',
        '',
        `# sniper ${slug}`,
        '',
      ];

      if (description) {
        lines.push(description, '');
      }

      lines.push('## Usage', '', '```bash', `sniper ${slug}${args.length > 0 ? ' [options]' : ''}`, '```', '');

      if (args.length > 0) {
        lines.push('## Options', '');
        lines.push('| Option | Type | Description |');
        lines.push('|--------|------|-------------|');
        for (const arg of args) {
          lines.push(`| \`--${arg.name}\` | ${arg.type} | ${arg.description} |`);
        }
        lines.push('');
      }

      if (subCommands.length > 0) {
        lines.push('## Subcommands', '');
        for (const sub of subCommands) {
          lines.push(`- \`sniper ${slug} ${sub}\``);
        }
        lines.push('');
      }

      await writeFile(join(outDir, `${slug}.md`), lines.join('\n'), 'utf-8');

      sidebarItems.push({
        text: `sniper ${slug}`,
        link: `/reference/cli/${slug}`,
        description,
      });
    } catch (err) {
      console.error(`  Error processing CLI command ${file}: ${err.message}`);
    }
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
