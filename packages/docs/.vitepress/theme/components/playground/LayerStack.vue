<script setup lang="ts">
import { layerColors } from '../../colors'
import type { PersonaItem } from './usePlaygroundData'

const LAYERS = ['process', 'technical', 'cognitive', 'domain'] as const

const props = defineProps<{
  selections: Record<string, PersonaItem | null>
}>()

function getLabel(layer: string): string {
  return layer.charAt(0).toUpperCase() + layer.slice(1)
}
</script>

<template>
  <div class="layer-stack">
    <h3 class="stack-title">Persona Stack</h3>
    <TransitionGroup name="stack" tag="div" class="stack-bars">
      <div
        v-for="layer in LAYERS"
        :key="layer"
        class="stack-bar"
        :class="{ filled: selections[layer], empty: !selections[layer] }"
        :style="{
          '--layer-color': layerColors[layer] ?? '#6b7280',
          borderColor: selections[layer]
            ? (layerColors[layer] ?? '#6b7280')
            : 'var(--vp-c-divider)',
        }"
      >
        <span class="bar-label">{{ getLabel(layer) }}</span>
        <span v-if="selections[layer]" class="bar-value">{{ selections[layer]!.name }}</span>
        <span v-else class="bar-placeholder">Select a {{ layer }} persona</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.layer-stack {
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  background: var(--vp-c-bg-soft);
}

.stack-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.stack-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stack-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--sniper-radius-sm);
  border: 2px solid var(--vp-c-divider);
  transition: all 0.25s ease;
}

.stack-bar.filled {
  background: color-mix(in srgb, var(--layer-color) 8%, transparent);
}

.stack-bar.empty {
  border-style: dashed;
}

.bar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--layer-color);
  min-width: 72px;
  text-transform: capitalize;
}

.bar-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.bar-placeholder {
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.stack-enter-active,
.stack-leave-active {
  transition: all 0.25s ease;
}

.stack-enter-from,
.stack-leave-to {
  opacity: 0.5;
  transform: scaleY(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .stack-bar,
  .stack-enter-active,
  .stack-leave-active {
    transition: none;
  }
}
</style>
