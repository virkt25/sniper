<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PlaygroundCommand } from './usePlaygroundData'
import { phaseColors } from '../../colors'

const props = defineProps<{
  commands: PlaygroundCommand[]
  selected: PlaygroundCommand | null
}>()

const emit = defineEmits<{
  select: [command: PlaygroundCommand]
}>()

const query = ref('')
const activeIndex = ref(0)

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  if (!q) return props.commands
  return props.commands.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  )
})

watch(query, () => { activeIndex.value = 0 })

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filtered.value[activeIndex.value]) {
      emit('select', filtered.value[activeIndex.value])
    }
  }
}
</script>

<template>
  <div class="command-selector" @keydown="handleKeydown">
    <div class="selector-search">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Filter commands..."
        aria-label="Filter commands"
        autocomplete="off"
      />
    </div>
    <ul class="command-list" role="listbox" aria-label="Commands">
      <li
        v-for="(cmd, i) in filtered"
        :key="cmd.slug"
        class="command-item"
        :class="{ active: i === activeIndex, selected: selected?.slug === cmd.slug }"
        role="option"
        :aria-selected="selected?.slug === cmd.slug"
        @click="emit('select', cmd)"
        @mouseenter="activeIndex = i"
      >
        <div class="item-header">
          <span class="item-name">{{ cmd.name }}</span>
          <span
            v-if="cmd.phase"
            class="item-phase"
            :style="{ backgroundColor: phaseColors[cmd.phase] ?? 'var(--vp-c-bg-mute)' }"
          >{{ cmd.phase }}</span>
        </div>
        <span class="item-desc">{{ cmd.description }}</span>
      </li>
      <li v-if="filtered.length === 0" class="command-empty">No matching commands</li>
    </ul>
  </div>
</template>

<style scoped>
.command-selector {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--vp-c-divider);
  min-width: 260px;
  max-width: 300px;
}

.selector-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.search-icon {
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: var(--vp-c-text-1);
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.command-list {
  list-style: none;
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.command-item {
  padding: 10px 12px;
  border-radius: var(--sniper-radius-sm);
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.15s ease;
}

.command-item:hover,
.command-item.active {
  background: var(--vp-c-bg-soft);
}

.command-item.selected {
  background: color-mix(in srgb, var(--sniper-brand) 12%, transparent);
  border-left: 2px solid var(--sniper-brand);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: var(--sniper-font-mono);
}

.item-phase {
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  padding: 1px 5px;
  border-radius: 9999px;
}

.item-desc {
  font-size: 12px;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.command-empty {
  padding: 24px;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 13px;
}

@media (max-width: 768px) {
  .command-selector {
    min-width: unset;
    max-width: unset;
    border-right: none;
    border-bottom: 1px solid var(--vp-c-divider);
    max-height: 200px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .command-item { transition: none; }
}
</style>
