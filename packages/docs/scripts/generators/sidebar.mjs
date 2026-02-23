import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Write the sidebar data JSON file used by VitePress config.
 * Output: packages/docs/generated/sidebar-data.json
 */
export async function generateSidebar(outputDir, sidebarData) {
  const outPath = join(outputDir, 'sidebar-data.json');
  await writeFile(outPath, JSON.stringify(sidebarData, null, 2) + '\n', 'utf-8');
  return outPath;
}
