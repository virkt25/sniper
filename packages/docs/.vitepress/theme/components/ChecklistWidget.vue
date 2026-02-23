<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps<{
  items: Array<{ id: string; text: string; section?: string }>
  gateMode?: string
  storageKey?: string
}>()

const checked = ref<Set<string>>(new Set())

onMounted(() => {
  if (props.storageKey) {
    try {
      const stored = localStorage.getItem(`sniper-checklist-${props.storageKey}`)
      if (stored) {
        const ids: string[] = JSON.parse(stored)
        checked.value = new Set(ids)
      }
    } catch { /* ignore */ }
  }
})

watch(checked, (val) => {
  if (props.storageKey) {
    try {
      localStorage.setItem(
        `sniper-checklist-${props.storageKey}`,
        JSON.stringify([...val])
      )
    } catch { /* ignore */ }
  }
})

function toggle(id: string) {
  const next = new Set(checked.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  checked.value = next
}

const completedCount = computed(() => checked.value.size)
const totalCount = computed(() => props.items.length)
const progress = computed(() =>
  totalCount.value === 0 ? 0 : (completedCount.value / totalCount.value) * 100
)

const sections = computed(() => {
  const map = new Map<string, typeof props.items>()
  for (const item of props.items) {
    const section = item.section ?? ''
    if (!map.has(section)) map.set(section, [])
    map.get(section)!.push(item)
  }
  return map
})

const collapsedSections = ref<Set<string>>(new Set())

function toggleSection(section: string) {
  const next = new Set(collapsedSections.value)
  if (next.has(section)) {
    next.delete(section)
  } else {
    next.add(section)
  }
  collapsedSections.value = next
}

const gateModeClass = props.gateMode ? `gate-${props.gateMode}` : ''
</script>

<template>
  <div class="checklist-widget">
    <div class="checklist-header">
      <div class="progress-info">
        <span class="count">{{ completedCount }} of {{ totalCount }} complete</span>
        <span v-if="gateMode" :class="['gate-badge', gateModeClass]">{{ gateMode }}</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
          role="progressbar"
          :aria-valuenow="completedCount"
          :aria-valuemin="0"
          :aria-valuemax="totalCount"
        />
      </div>
    </div>

    <div v-for="[section, sectionItems] in sections" :key="section" class="checklist-section">
      <button
        v-if="section"
        class="section-toggle"
        :aria-expanded="!collapsedSections.has(section)"
        :aria-label="`Toggle ${section} section`"
        @click="toggleSection(section)"
      >
        <svg
          class="section-chevron"
          :class="{ collapsed: collapsedSections.has(section) }"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 5.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="section-name">{{ section }}</span>
      </button>

      <ul v-show="!section || !collapsedSections.has(section)" class="checklist-items">
        <li v-for="item in sectionItems" :key="item.id" class="checklist-item">
          <label class="item-label">
            <input
              type="checkbox"
              class="item-checkbox"
              :checked="checked.has(item.id)"
              @change="toggle(item.id)"
            />
            <span class="checkbox-visual">
              <svg v-if="checked.has(item.id)" class="check-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="item-text" :class="{ done: checked.has(item.id) }">{{ item.text }}</span>
          </label>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.checklist-widget {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  padding: 16px 20px;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
}

.checklist-header {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.count {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.gate-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: capitalize;
}

.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--vp-c-bg-mute);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--sniper-brand), var(--sniper-brand-light));
  transition: width 0.4s var(--sniper-ease);
}

.checklist-section + .checklist-section {
  margin-top: 12px;
}

.section-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border: none;
  background: none;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.section-chevron {
  transition: transform var(--sniper-duration) var(--sniper-ease);
  color: var(--vp-c-text-2);
}

.section-chevron.collapsed {
  transform: rotate(-90deg);
}

.checklist-items {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
}

.checklist-item {
  padding: 0;
  margin: 0;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  cursor: pointer;
}

.item-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-visual {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
}

.item-checkbox:checked + .checkbox-visual {
  background: var(--sniper-brand);
  border-color: var(--sniper-brand);
  color: #fff;
}

.item-checkbox:focus-visible + .checkbox-visual {
  outline: 2px solid var(--sniper-brand);
  outline-offset: 2px;
}

.check-icon {
  animation: check-pop 0.2s var(--sniper-ease-bounce);
}

@keyframes check-pop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.item-text {
  font-size: 14px;
  color: var(--vp-c-text-1);
  transition: color var(--sniper-duration) var(--sniper-ease);
}

.item-text.done {
  color: var(--vp-c-text-2);
  text-decoration: line-through;
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .section-chevron,
  .checkbox-visual,
  .check-icon {
    transition: none;
    animation: none;
  }
}
</style>
