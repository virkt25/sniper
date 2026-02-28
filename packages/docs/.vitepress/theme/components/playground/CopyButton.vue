<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  text: string
  label?: string
}>()

const copied = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = props.text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<template>
  <button
    class="copy-btn"
    :class="{ copied }"
    @click="copy"
    :aria-label="copied ? 'Copied!' : (label || 'Copy to clipboard')"
  >
    <Transition name="copy-icon" mode="out-in">
      <svg v-if="!copied" key="copy" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 10V3.5A1.5 1.5 0 014.5 2H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <svg v-else key="check" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </Transition>
    <span v-if="label" class="copy-label">{{ copied ? 'Copied!' : label }}</span>
  </button>
</template>

<style scoped>
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-2);
}

.copy-btn.copied {
  color: #3fb950;
  border-color: #3fb950;
}

.copy-label {
  font-weight: 500;
}

.copy-icon-enter-active,
.copy-icon-leave-active {
  transition: all 0.15s ease;
}

.copy-icon-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.copy-icon-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@media (prefers-reduced-motion: reduce) {
  .copy-btn,
  .copy-icon-enter-active,
  .copy-icon-leave-active {
    transition: none;
  }
}
</style>
