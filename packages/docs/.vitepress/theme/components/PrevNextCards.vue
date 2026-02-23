<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme, page } = useData()

const prev = computed(() => page.value?.frontmatter?.prev ?? findAdjacentPage('prev'))
const next = computed(() => page.value?.frontmatter?.next ?? findAdjacentPage('next'))

function findAdjacentPage(direction: 'prev' | 'next') {
  const sidebar = theme.value.sidebar
  if (!sidebar) return null

  // Flatten all sidebar items
  const allItems: { text: string; link: string }[] = []

  function flatten(items: any[]) {
    for (const item of items) {
      if (item.link) allItems.push({ text: item.text, link: item.link })
      if (item.items) flatten(item.items)
    }
  }

  // Find the right sidebar group based on current path
  const path = page.value.relativePath.replace(/\.md$/, '').replace(/index$/, '')
  for (const key of Object.keys(sidebar)) {
    if (('/' + path).startsWith(key)) {
      flatten(sidebar[key])
      break
    }
  }

  const currentIndex = allItems.findIndex(
    (item) => item.link && ('/' + path).endsWith(item.link.replace(/\/$/, ''))
  )

  if (currentIndex === -1) return null

  const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= allItems.length) return null

  return allItems[targetIndex]
}
</script>

<template>
  <nav v-if="prev || next" class="prev-next-cards">
    <a v-if="prev" :href="prev.link" class="prev-next-card prev-card">
      <span class="card-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </span>
      <span class="card-body">
        <span class="card-label">Previous</span>
        <span class="card-title">{{ prev.text }}</span>
      </span>
    </a>
    <span v-else class="prev-next-spacer" />
    <a v-if="next" :href="next.link" class="prev-next-card next-card">
      <span class="card-body" style="text-align: right">
        <span class="card-label">Next</span>
        <span class="card-title">{{ next.text }}</span>
      </span>
      <span class="card-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </a>
    <span v-else class="prev-next-spacer" />
  </nav>
</template>

<style scoped>
.prev-next-cards {
  display: flex;
  gap: 16px;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.prev-next-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: transform var(--sniper-duration) var(--sniper-ease),
              box-shadow var(--sniper-duration) var(--sniper-ease),
              border-color var(--sniper-duration) var(--sniper-ease);
}

.prev-next-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--sniper-shadow-md);
  border-color: var(--sniper-brand);
}

.prev-next-spacer {
  flex: 1;
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  flex-shrink: 0;
  transition: color var(--sniper-duration) var(--sniper-ease),
              background var(--sniper-duration) var(--sniper-ease);
}

.prev-next-card:hover .card-arrow {
  color: var(--sniper-brand);
  background: var(--vp-c-brand-soft);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.card-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .prev-next-cards {
    flex-direction: column;
  }
}
</style>
