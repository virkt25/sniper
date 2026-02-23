<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  commands: Array<{ name: string; description: string; phase?: string; link: string }>
}>()

const emit = defineEmits<{
  select: [command: { name: string; description: string; phase?: string; link: string }]
}>()

const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const phaseColors: Record<string, string> = {
  S: '#6366f1', Spawn: '#6366f1',
  N: '#8b5cf6', Navigate: '#8b5cf6',
  I: '#10b981', Implement: '#10b981',
  P: '#f59e0b', Parallelize: '#f59e0b',
  E: '#f97316', Evaluate: '#f97316',
  R: '#ef4444', Release: '#ef4444',
}

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  if (!q) return props.commands
  return props.commands.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  )
})

watch(query, () => {
  activeIndex.value = 0
})

function open() {
  isOpen.value = true
  query.value = ''
  activeIndex.value = 0
  requestAnimationFrame(() => inputRef.value?.focus())
}

function close() {
  isOpen.value = false
}

function selectItem(cmd: typeof props.commands[number]) {
  emit('select', cmd)
  close()
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return

  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (filtered.value[activeIndex.value]) {
      selectItem(filtered.value[activeIndex.value])
    }
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }
}

function highlightMatch(text: string): string {
  const q = query.value.toLowerCase()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + q.length)
  const after = text.slice(idx + q.length)
  return `${before}<mark>${match}</mark>${after}`
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="isOpen" class="palette-overlay" @click.self="close">
        <div class="palette-modal" @keydown="handleKeydown" role="dialog" aria-label="Command palette">
          <div class="palette-input-wrapper">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 12l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="palette-input"
              placeholder="Search commands..."
              aria-label="Search commands"
              autocomplete="off"
            />
            <kbd class="esc-hint">Esc</kbd>
          </div>

          <ul v-if="filtered.length" class="palette-results" role="listbox">
            <li
              v-for="(cmd, i) in filtered"
              :key="cmd.name"
              class="palette-item"
              :class="{ active: i === activeIndex }"
              role="option"
              :aria-selected="i === activeIndex"
              @click="selectItem(cmd)"
              @mouseenter="activeIndex = i"
            >
              <div class="item-main">
                <span class="item-name" v-html="highlightMatch(cmd.name)" />
                <span
                  v-if="cmd.phase"
                  class="item-phase"
                  :style="{ backgroundColor: phaseColors[cmd.phase] ?? 'var(--vp-c-bg-mute)' }"
                >
                  {{ cmd.phase }}
                </span>
              </div>
              <span class="item-desc" v-html="highlightMatch(cmd.description)" />
            </li>
          </ul>
          <div v-else class="palette-empty">No matching commands</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.palette-modal {
  width: 100%;
  max-width: 560px;
  margin: 0 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-lg);
  box-shadow: var(--sniper-shadow-lg);
  overflow: hidden;
}

.palette-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.search-icon {
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

.palette-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 16px;
  color: var(--vp-c-text-1);
  font-family: inherit;
}

.palette-input::placeholder {
  color: var(--vp-c-text-2);
}

.esc-hint {
  font-size: 11px;
  font-family: var(--sniper-font-mono);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}

.palette-results {
  list-style: none;
  padding: 8px;
  margin: 0;
  max-height: 320px;
  overflow-y: auto;
}

.palette-item {
  padding: 10px 12px;
  border-radius: var(--sniper-radius-sm);
  cursor: pointer;
  transition: background var(--sniper-duration) var(--sniper-ease);
}

.palette-item.active {
  background: var(--vp-c-bg-soft);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: var(--sniper-font-mono);
}

.item-name :deep(mark) {
  background: color-mix(in srgb, var(--sniper-brand) 25%, transparent);
  color: inherit;
  border-radius: 2px;
}

.item-phase {
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  padding: 1px 6px;
  border-radius: 9999px;
}

.item-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.item-desc :deep(mark) {
  background: color-mix(in srgb, var(--sniper-brand) 25%, transparent);
  color: inherit;
  border-radius: 2px;
}

.palette-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.palette-enter-active {
  transition: opacity 0.15s ease;
}
.palette-enter-active .palette-modal {
  transition: transform 0.15s var(--sniper-ease-bounce), opacity 0.15s ease;
}
.palette-leave-active {
  transition: opacity 0.1s ease;
}
.palette-leave-active .palette-modal {
  transition: transform 0.1s ease, opacity 0.1s ease;
}
.palette-enter-from {
  opacity: 0;
}
.palette-enter-from .palette-modal {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}
.palette-leave-to {
  opacity: 0;
}
.palette-leave-to .palette-modal {
  opacity: 0;
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .palette-enter-active,
  .palette-enter-active .palette-modal,
  .palette-leave-active,
  .palette-leave-active .palette-modal,
  .palette-item {
    transition: none;
  }
}
</style>
