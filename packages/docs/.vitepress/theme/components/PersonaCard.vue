<script setup lang="ts">
import { ref } from 'vue'
import { layerColors } from '../colors'

const props = withDefaults(defineProps<{
  name: string
  layer: string
  description: string
  link?: string
  expandable?: boolean
}>(), {
  expandable: false,
})

const color = layerColors[props.layer] ?? '#6b7280'
const expanded = ref(false)

function toggle() {
  if (props.expandable) {
    expanded.value = !expanded.value
  }
}
</script>

<template>
  <div
    class="persona-card"
    :class="{ expandable, expanded }"
    :style="{ '--layer-color': color }"
    @click="toggle"
  >
    <div class="persona-header">
      <h3 class="persona-name">{{ name }}</h3>
      <span class="persona-layer">{{ layer }}</span>
      <a
        v-if="link"
        :href="link"
        class="persona-link"
        @click.stop
        aria-label="View details"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
    <p class="persona-description" :class="{ truncated: expandable && !expanded }">
      {{ description }}
    </p>
    <button
      v-if="expandable"
      class="expand-toggle"
      :aria-expanded="expanded"
      @click.stop="toggle"
    >
      {{ expanded ? 'Show less' : 'Show more' }}
      <svg
        class="expand-icon"
        :class="{ flipped: expanded }"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.persona-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  padding: 16px 20px;
  margin: 12px 0;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 70%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: box-shadow var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
}

.persona-card:hover {
  box-shadow: 0 0 24px color-mix(in srgb, var(--layer-color) 20%, transparent);
  border-color: color-mix(in srgb, var(--layer-color) 40%, var(--vp-c-divider));
}

.persona-card.expandable {
  cursor: pointer;
}

.persona-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.persona-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.persona-layer {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: capitalize;
  background: var(--layer-color);
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease);
}

.persona-card:hover .persona-layer {
  transform: scale(1.05);
  box-shadow: 0 0 8px color-mix(in srgb, var(--layer-color) 50%, transparent);
}

.persona-link {
  margin-left: auto;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  transition: color var(--sniper-duration) var(--sniper-ease),
              transform var(--sniper-duration) var(--sniper-ease);
}

.persona-link:hover {
  color: var(--layer-color);
  transform: translateX(2px);
}

.persona-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  transition: max-height 0.4s var(--sniper-ease), opacity 0.3s var(--sniper-ease);
}

.persona-description.truncated {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 0;
  border: none;
  background: none;
  color: var(--layer-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity var(--sniper-duration) var(--sniper-ease);
}

.expand-toggle:hover {
  opacity: 0.8;
}

.expand-icon {
  transition: transform var(--sniper-duration) var(--sniper-ease);
}

.expand-icon.flipped {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .persona-card,
  .persona-layer,
  .persona-link,
  .expand-icon {
    transition: none;
  }
}
</style>
