<script setup lang="ts">
defineProps<{
  items: Array<{ type: string; link: string; label?: string }>
}>()

const typeIcons: Record<string, string> = {
  checklist: '\u2611',
  team: '\u2699',
  persona: '\uD83D\uDC64',
  template: '\uD83D\uDCC4',
  workflow: '\u25B6',
  command: '\u203A',
}

function labelFromLink(link: string, type: string): string {
  const slug = link.split('/').pop() || ''
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
</script>

<template>
  <div v-if="items && items.length > 0" class="related-items">
    <h4 class="related-title">Related</h4>
    <div class="related-grid">
      <a
        v-for="item in items"
        :key="item.link"
        :href="item.link"
        class="related-card"
      >
        <span class="related-icon">{{ typeIcons[item.type] || '\uD83D\uDD17' }}</span>
        <div class="related-info">
          <span class="related-label">{{ item.label || labelFromLink(item.link, item.type) }}</span>
          <span class="related-type">{{ item.type }}</span>
        </div>
        <span class="related-arrow">&rarr;</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.related-items {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.related-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.related-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: all var(--sniper-duration) var(--sniper-ease);
}

.related-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--sniper-shadow-sm);
  transform: translateY(-1px);
}

.related-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.related-info {
  flex: 1;
  min-width: 0;
}

.related-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-type {
  font-size: 11px;
  color: var(--vp-c-text-2);
  text-transform: capitalize;
}

.related-arrow {
  color: var(--vp-c-text-3);
  font-size: 16px;
  flex-shrink: 0;
  transition: transform var(--sniper-duration) var(--sniper-ease);
}

.related-card:hover .related-arrow {
  transform: translateX(3px);
  color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
