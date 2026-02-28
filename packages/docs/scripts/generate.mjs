#!/usr/bin/env node

/**
 * SNIPER Documentation Auto-Generator
 *
 * Reads framework files from packages/core/framework/ and generates
 * markdown reference pages in packages/docs/generated/.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';

import { generateCommands } from './generators/commands.mjs';
import { generatePersonas } from './generators/personas.mjs';
import { generateTeams } from './generators/teams.mjs';
import { generateChecklists } from './generators/checklists.mjs';
import { generateTemplates } from './generators/templates.mjs';
import { generateWorkflows } from './generators/workflows.mjs';
import { generateSidebar } from './generators/sidebar.mjs';
import { generateLlmsTxt } from './generators/llmstxt.mjs';
import { generatePlayground } from './generators/playground.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkDir = resolve(__dirname, '../../core/framework');
const outputDir = resolve(__dirname, '../generated');
const docsDir = resolve(__dirname, '..');

async function main() {
  console.log('Generating SNIPER documentation...');
  console.log(`  Framework: ${frameworkDir}`);
  console.log(`  Output:    ${outputDir}`);

  // Clean and recreate output directory
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  // Run all generators
  const [commands, personas, teams, checklists, templates, workflows] = await Promise.all([
    generateCommands(frameworkDir, outputDir),
    generatePersonas(frameworkDir, outputDir),
    generateTeams(frameworkDir, outputDir),
    generateChecklists(frameworkDir, outputDir),
    generateTemplates(frameworkDir, outputDir),
    generateWorkflows(frameworkDir, outputDir),
  ]);

  // Generate playground data
  const playgroundPath = await generatePlayground(frameworkDir, outputDir);

  // Write sidebar data
  const sidebarPath = await generateSidebar(outputDir, {
    commands,
    personas,
    teams,
    checklists,
    templates,
    workflows,
  });

  // Generate llms.txt (needs generated output)
  const llmsPath = await generateLlmsTxt(docsDir, outputDir, outputDir);

  // Summary
  const commandCount = commands.length;
  const personaCount = personas.reduce((sum, layer) => sum + (layer.items?.length || 0), 0);
  const teamCount = teams.length;
  const checklistCount = checklists.length;
  const templateCount = templates.length;
  const workflowCount = workflows.length;
  const total = commandCount + personaCount + teamCount + checklistCount + templateCount + workflowCount;

  console.log('');
  console.log(`Generated ${total} reference pages:`);
  console.log(`  Commands:   ${commandCount}`);
  console.log(`  Personas:   ${personaCount}`);
  console.log(`  Teams:      ${teamCount}`);
  console.log(`  Checklists: ${checklistCount}`);
  console.log(`  Templates:  ${templateCount}`);
  console.log(`  Workflows:  ${workflowCount}`);
  console.log(`  Sidebar:    ${sidebarPath}`);
  console.log(`  Playground: ${playgroundPath}`);
  console.log(`  llms.txt:   ${llmsPath}`);
  console.log('');
  console.log('Done.');
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
