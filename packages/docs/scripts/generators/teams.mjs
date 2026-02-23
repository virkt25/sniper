import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';

/**
 * Generate reference pages for SNIPER teams.
 * Source: packages/core/framework/teams/*.yaml
 * Output: packages/docs/generated/teams/*.md
 */
export async function generateTeams(frameworkDir, outputDir) {
  const teamsDir = join(frameworkDir, 'teams');
  const outDir = join(outputDir, 'teams');
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(teamsDir)).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  const sidebarItems = [];

  for (const file of files) {
    try {
      const raw = await readFile(join(teamsDir, file), 'utf-8');
      const data = YAML.parse(raw);
      const slug = file.replace(/\.(yaml|yml)$/, '');

      const teamName = data.team_name || slug;
      const phase = data.phase || '';
      const teammates = data.teammates || [];
      const reviewGate = data.review_gate;

      // Escape pipe characters for markdown table cells
      const esc = (v) => (v || '--').replace(/\|/g, '\\|');

      // Build markdown page
      const lines = [
        '---',
        `title: "${teamName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
        '---',
        '',
        `# ${teamName}`,
        '',
      ];

      if (phase) {
        lines.push(`**Phase:** ${phase}`, '');
      }

      // Team composition table
      lines.push('## Team Composition', '');
      lines.push('| Member | Process | Technical | Cognitive | Domain |');
      lines.push('|--------|---------|-----------|-----------|--------|');

      for (const member of teammates) {
        const compose = member.compose || {};
        const row = [
          `**${esc(member.name)}**`,
          esc(compose.process),
          esc(compose.technical),
          esc(compose.cognitive),
          esc(compose.domain),
        ];
        lines.push(`| ${row.join(' | ')} |`);
      }

      lines.push('');

      // Tasks per member
      lines.push('## Tasks', '');
      for (const member of teammates) {
        const tasks = member.tasks || [];
        if (tasks.length === 0) continue;

        lines.push(`### ${member.name}`, '');
        for (const task of tasks) {
          lines.push(`#### ${task.name || task.id}`, '');
          if (task.id) lines.push(`- **ID:** \`${task.id}\``);
          if (task.output) lines.push(`- **Output:** \`${task.output}\``);
          if (task.template) lines.push(`- **Template:** \`${task.template}\``);
          if (task.depends_on) {
            const deps = Array.isArray(task.depends_on) ? task.depends_on : [task.depends_on];
            lines.push(`- **Depends on:** ${deps.map((d) => `\`${d}\``).join(', ')}`);
          }
          if (task.plan_approval) lines.push('- **Requires plan approval:** Yes');
          if (task.description) {
            lines.push('', task.description.trim());
          }
          lines.push('');
        }
      }

      // Review gate
      if (reviewGate) {
        lines.push('## Review Gate', '');
        if (reviewGate.checklist) lines.push(`- **Checklist:** \`${reviewGate.checklist}\``);
        if (reviewGate.mode) lines.push(`- **Mode:** ${reviewGate.mode}`);
        lines.push('');
      }

      const page = lines.join('\n');
      await writeFile(join(outDir, `${slug}.md`), page, 'utf-8');

      sidebarItems.push({
        text: teamName,
        link: `/reference/teams/${slug}`,
      });
    } catch (err) {
      console.error(`  Error processing team ${file}: ${err.message}`);
    }
  }

  sidebarItems.sort((a, b) => a.text.localeCompare(b.text));

  return sidebarItems;
}
