<script setup lang="ts">
import { layerColors } from '../../colors'
import type { PersonaItem } from './usePlaygroundData'

const props = defineProps<{
  layer: string
  items: PersonaItem[]
  selected: PersonaItem | null
}>()

const emit = defineEmits<{
  select: [item: PersonaItem | null]
}>()

const color = layerColors[props.layer] ?? '#6b7280'
const layerLabel = props.layer.charAt(0).toUpperCase() + props.layer.slice(1)

function toggle(item: PersonaItem) {
  if (props.selected?.slug === item.slug) {
    emit('select', null)
  } else {
    emit('select', item)
  }
}
</script>

<template>
  <div class="layer-picker">
    <div class="picker-header" :style="{ borderColor: color }">
      <span class="picker-dot" :style="{ backgroundColor: color }" />
      <h3 class="picker-title">{{ layerLabel }}</h3>
      <span class="picker-count">{{ items.length }}</span>
    </div>
    <ul class="picker-list" role="listbox" :aria-label="`${layerLabel} layer personas`">
      <li
        v-for="item in items"
        :key="item.slug"
        class="picker-item"
        :class="{ selected: selected?.slug === item.slug }"
        :style="{ '--layer-color': color }"
        role="option"
        :aria-selected="selected?.slug === item.slug"
        tabindex="0"
        @click="toggle(item)"
        @keydown.enter="toggle(item)"
        @keydown.space.prevent="toggle(item)"
      >
        <div class="item-name">{{ item.name }}</div>
        <div class="item-summary">{{ item.summary }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.layer-picker {
  flex: 1;
  min-width: 200px;
}

.picker-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 2px solid var(--vp-c-divider);
}

.picker-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.picker-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.picker-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.picker-list {
  list-style: none;
  padding: 6px;
  margin: 0;
  max-height: 280px;
  overflow-y: auto;
}

.picker-item {
  padding: 8px 10px;
  border-radius: var(--sniper-radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 2px;
  transition: all 0.15s ease;
}

.picker-item:hover {
  background: var(--vp-c-bg-soft);
}

.picker-item:focus-visible {
  outline: 2px solid var(--layer-color);
  outline-offset: -2px;
}

.picker-item.selected {
  background: color-mix(in srgb, var(--layer-color) 12%, transparent);
  border-color: color-mix(in srgb, var(--layer-color) 40%, transparent);
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 2px;
}

.item-summary {
  font-size: 12px;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

@media (prefers-reduced-motion: reduce) {
  .picker-item { transition: none; }
}
</style>
