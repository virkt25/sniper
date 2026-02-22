import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const LAYER_ORDER = ['process', 'cognitive', 'technical', 'domain'];

/**
 * Generate reference pages for SNIPER personas.
 * Source: packages/core/framework/personas/{layer}/*.md
 * Output: packages/docs/generated/personas/{layer}/*.md
 */
export async function generatePersonas(frameworkDir, outputDir) {
  const personasDir = join(frameworkDir, 'personas');
  const outDir = join(outputDir, 'personas');
  await mkdir(outDir, { recursive: true });

  const sidebarItems = [];

  for (const layer of LAYER_ORDER) {
    const layerDir = join(personasDir, layer);
    let files;
    try {
      files = (await readdir(layerDir)).filter((f) => f.endsWith('.md'));
    } catch {
      // Layer directory may not exist or be empty
      continue;
    }

    if (files.length === 0) continue;

    const layerOutDir = join(outDir, layer);
    await mkdir(layerOutDir, { recursive: true });

    const layerLabel = layer.charAt(0).toUpperCase() + layer.slice(1);
    const layerItems = [];

    for (const file of files) {
      const content = await readFile(join(layerDir, file), 'utf-8');
      const slug = file.replace(/\.md$/, '');

      // Parse first line: # {Name} ({Layer} Layer)
      const firstLine = content.split('\n')[0] || '';
      const match = firstLine.match(/^#\s+(.+?)\s*(\(.+\))?\s*$/);
      const personaName = match ? match[1].trim() : slug;

      const page = [
        '---',
        `title: "${personaName}"`,
        '---',
        '',
        '<div v-pre>',
        '',
        content,
        '',
        '</div>',
      ].join('\n');

      await writeFile(join(layerOutDir, `${slug}.md`), page, 'utf-8');

      layerItems.push({
        text: personaName,
        link: `/reference/personas/${layer}/${slug}`,
      });
    }

    // Sort personas within each layer
    layerItems.sort((a, b) => a.text.localeCompare(b.text));

    sidebarItems.push({
      text: `${layerLabel} Layer`,
      collapsed: true,
      items: layerItems,
    });
  }

  return sidebarItems;
}
