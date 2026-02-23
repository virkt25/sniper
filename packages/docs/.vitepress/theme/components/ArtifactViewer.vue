<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  tabs: Array<{ label: string; content: string; language?: string }>
}>()

const activeTab = ref(0)
const copied = ref(false)

const activeContent = computed(() => props.tabs[activeTab.value])

function switchTab(index: number) {
  activeTab.value = index
  copied.value = false
}

async function copyContent() {
  try {
    await navigator.clipboard.writeText(activeContent.value.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* ignore */ }
}
</script>

<template>
  <div class="artifact-viewer">
    <div class="tab-bar">
      <button
        v-for="(tab, i) in tabs"
        :key="tab.label"
        class="tab-button"
        :class="{ active: i === activeTab }"
        @click="switchTab(i)"
      >
        {{ tab.label }}
      </button>
      <div
        class="tab-indicator"
        :style="{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${activeTab * 100}%)`,
        }"
      />
    </div>

    <div class="content-area">
      <button
        class="copy-button"
        :class="{ copied }"
        @click="copyContent"
        :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
      >
        <svg v-if="!copied" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 8.5l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <TransitionGroup name="tab-content">
        <pre
          :key="activeTab"
          class="content-pre"
        ><code :class="activeContent.language ? `language-${activeContent.language}` : ''">{{ activeContent.content }}</code></pre>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.artifact-viewer {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  overflow: hidden;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
}

.tab-bar {
  display: flex;
  position: relative;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.tab-button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color var(--sniper-duration) var(--sniper-ease);
  position: relative;
  z-index: 1;
}

.tab-button.active {
  color: var(--sniper-brand);
  font-weight: 600;
}

.tab-button:hover:not(.active) {
  color: var(--vp-c-text-1);
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--sniper-brand);
  transition: transform var(--sniper-duration) var(--sniper-ease);
}

.content-area {
  position: relative;
  overflow: hidden;
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: var(--sniper-radius-sm);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
}

.copy-button:hover {
  color: var(--sniper-brand);
  border-color: var(--sniper-brand);
}

.copy-button.copied {
  color: #10b981;
  border-color: #10b981;
}

.content-pre {
  margin: 0;
  padding: 16px 20px;
  overflow-x: auto;
  font-family: var(--sniper-font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.tab-content-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tab-content-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
  position: absolute;
  width: 100%;
}
.tab-content-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.tab-content-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .tab-indicator,
  .copy-button,
  .tab-button {
    transition: none;
  }
  .tab-content-enter-active,
  .tab-content-leave-active {
    transition: none;
  }
}
</style>
