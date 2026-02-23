<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  graph: string
}>()

const { isDark } = useData()
const container = ref<HTMLElement>()
const modalOpen = ref(false)
const scale = ref(1)
const MIN_SCALE = 0.25
const MAX_SCALE = 3

function zoomIn() {
  scale.value = Math.min(MAX_SCALE, scale.value + 0.25)
}

function zoomOut() {
  scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value - 0.25))
}

function resetZoom() {
  scale.value = 1
}

function openModal() {
  modalOpen.value = true
  scale.value = 1
}

function closeModal() {
  modalOpen.value = false
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('mermaid-modal-overlay')) {
    closeModal()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && modalOpen.value) {
    closeModal()
  }
}

function downloadSvg() {
  const target = modalOpen.value
    ? document.querySelector('.mermaid-modal-body .mermaid svg')
    : container.value?.querySelector('.mermaid svg')
  if (!target) return

  const svgData = new XMLSerializer().serializeToString(target)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'diagram.svg'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="container" class="mermaid-viewer">
    <div class="mermaid-toolbar">
      <button class="mermaid-btn" title="Expand diagram" @click="openModal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
      </button>
      <button class="mermaid-btn" title="Download SVG" @click="downloadSvg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
      </button>
    </div>
    <div class="mermaid-scroll">
      <pre class="mermaid">{{ props.graph }}</pre>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="modalOpen" class="mermaid-modal-overlay" @click="onBackdropClick">
      <div class="mermaid-modal">
        <div class="mermaid-modal-toolbar">
          <div class="mermaid-zoom-controls">
            <button class="mermaid-btn" title="Zoom out" @click="zoomOut">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
            </button>
            <button class="mermaid-btn mermaid-zoom-label" title="Reset zoom" @click="resetZoom">
              {{ Math.round(scale * 100) }}%
            </button>
            <button class="mermaid-btn" title="Zoom in" @click="zoomIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <div class="mermaid-modal-actions">
            <button class="mermaid-btn" title="Download SVG" @click="downloadSvg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
            <button class="mermaid-btn" title="Close" @click="closeModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div class="mermaid-modal-body">
          <div class="mermaid-modal-scroll" :style="{ transform: `scale(${scale})`, transformOrigin: 'center center' }">
            <pre class="mermaid">{{ props.graph }}</pre>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mermaid-viewer {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  background: var(--vp-c-bg-soft);
  margin: 1rem 0;
  overflow: hidden;
}

.mermaid-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 8px 8px 0;
}

.mermaid-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all var(--sniper-duration) var(--sniper-ease);
  font-size: 12px;
  line-height: 1;
}

.mermaid-btn:hover {
  color: var(--sniper-brand);
  border-color: var(--sniper-brand);
  background: var(--vp-c-bg-soft);
}

.mermaid-scroll {
  overflow-x: auto;
  padding: 16px;
}

.mermaid-scroll :deep(.mermaid) {
  display: flex;
  justify-content: center;
  background: transparent;
  margin: 0;
  padding: 0;
}

/* Modal overlay */
.mermaid-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.mermaid-modal {
  background: var(--vp-c-bg);
  border-radius: var(--sniper-radius-lg);
  border: 1px solid var(--vp-c-divider);
  box-shadow: var(--sniper-shadow-lg);
  width: 90vw;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mermaid-modal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.mermaid-zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mermaid-zoom-label {
  min-width: 52px;
  font-family: var(--sniper-font-mono);
  font-size: 12px;
}

.mermaid-modal-actions {
  display: flex;
  gap: 4px;
}

.mermaid-modal-body {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.mermaid-modal-scroll {
  transition: transform var(--sniper-duration) var(--sniper-ease);
}

.mermaid-modal-scroll :deep(.mermaid) {
  display: flex;
  justify-content: center;
  background: transparent;
  margin: 0;
  padding: 0;
}

@media (max-width: 768px) {
  .mermaid-modal {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
  .mermaid-modal-overlay {
    padding: 0;
  }
}
</style>
