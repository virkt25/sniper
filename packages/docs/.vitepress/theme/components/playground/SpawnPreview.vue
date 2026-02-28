<script setup lang="ts">
import { computed } from 'vue'
import CopyButton from './CopyButton.vue'
import type { PersonaItem } from './usePlaygroundData'

const props = defineProps<{
  template: string
  selections: Record<string, PersonaItem | null>
}>()

const rendered = computed(() => {
  let output = props.template

  const replacements: Record<string, string> = {
    '{name}': composeName(),
    '{process_layer}': props.selections.process?.name ?? '(not selected)',
    '{technical_layer}': props.selections.technical?.name ?? 'No specific technical lens for this role.',
    '{cognitive_layer}': props.selections.cognitive?.name ?? '(not selected)',
    '{domain_layer}': props.selections.domain?.name ?? 'No domain pack configured.',
    '{memory_layer}': 'Project memory will be loaded at spawn time.',
    '{ownership}': '(configured per project)',
  }

  for (const [key, val] of Object.entries(replacements)) {
    output = output.replace(key, val)
  }

  return output
})

function composeName(): string {
  const parts: string[] = []
  if (props.selections.process) parts.push(props.selections.process.slug)
  if (props.selections.technical) parts.push(props.selections.technical.slug)
  return parts.length > 0 ? parts.join('-') : 'teammate'
}

const hasSelection = computed(() =>
  Object.values(props.selections).some((s) => s !== null)
)

// Syntax coloring: detect headers and placeholders
function colorize(text: string): string {
  return text
    .replace(/^(#{1,3}\s+.+)$/gm, '<span class="sp-heading">$1</span>')
    .replace(/(\{[^}]+\})/g, '<span class="sp-placeholder">$1</span>')
    .replace(/^(-\s+.+)$/gm, '<span class="sp-list">$1</span>')
}

const colorized = computed(() => colorize(rendered.value))
</script>

<template>
  <div class="spawn-preview">
    <div class="preview-header">
      <h3 class="preview-title">Spawn Prompt Preview</h3>
      <CopyButton v-if="hasSelection" :text="rendered" label="Copy" />
    </div>

    <div v-if="hasSelection" class="preview-body">
      <pre class="preview-code" v-html="colorized" />
    </div>
    <div v-else class="preview-empty">
      <p>Select at least one persona layer to preview the spawn prompt.</p>
    </div>
  </div>
</template>

<style scoped>
.spawn-preview {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  overflow: hidden;
  background: var(--vp-c-bg);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.preview-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.preview-body {
  max-height: 360px;
  overflow-y: auto;
}

.preview-code {
  margin: 0;
  padding: 16px 20px;
  font-family: var(--sniper-font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-code :deep(.sp-heading) {
  color: #58a6ff;
  font-weight: 700;
}

.preview-code :deep(.sp-placeholder) {
  color: #d2a8ff;
  font-style: italic;
}

.preview-code :deep(.sp-list) {
  color: var(--vp-c-text-1);
}

.preview-empty {
  padding: 40px 24px;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 14px;
}

.preview-empty p {
  margin: 0;
}
</style>
