<script setup>
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const WORDS_PER_MIN = 200

const { page, frontmatter } = useData()
const route = useRoute()

const isGuidePage = computed(() => route.path.startsWith('/guide/'))

const readingTime = computed(() => {
  // VitePress exposes the raw content via page.value
  // We approximate word count from the page content length
  const content = page.value?.content ?? page.value?.description ?? ''
  // Strip HTML/markdown artifacts for a rough word count
  const text = content.replace(/<[^>]*>/g, '').replace(/[#*`\[\]()]/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  // Minimum 1 minute
  return Math.max(1, Math.round(words / WORDS_PER_MIN))
})

const show = computed(() => isGuidePage.value && readingTime.value > 0)
</script>

<template>
  <span v-if="show" class="reading-time">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
    {{ readingTime }} min read
  </span>
</template>

<style scoped>
.reading-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  font-family: var(--sniper-font-mono);
  margin-top: 8px;
}

.reading-time svg {
  opacity: 0.6;
}
</style>
