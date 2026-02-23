<script setup lang="ts">
import MetadataCard from './MetadataCard.vue'
import { computed } from 'vue'

const props = defineProps<{
  pageType: string
  phase?: string
  layer?: string
  gateMode?: string
  memberCount?: number
  sourceFile?: string
  format?: string
  description?: string
  relatedItems?: Array<{ type: string; link: string }>
}>()

const metadataItems = computed(() => {
  const items: Array<{ label: string; value: string; badge?: boolean; badgeClass?: string }> = []

  items.push({ label: 'Type', value: props.pageType, badge: true, badgeClass: 'badge-brand' })

  if (props.phase) {
    items.push({ label: 'Phase', value: props.phase })
  }

  if (props.layer) {
    items.push({ label: 'Layer', value: props.layer })
  }

  if (props.gateMode) {
    const modeClassMap: Record<string, string> = {
      strict: 'badge-danger',
      flexible: 'badge-warning',
      auto: 'badge-tip',
      none: 'badge-muted',
    }
    items.push({
      label: 'Gate Mode',
      value: props.gateMode,
      badge: true,
      badgeClass: modeClassMap[props.gateMode] || 'badge-muted',
    })
  }

  if (props.memberCount !== undefined) {
    items.push({ label: 'Members', value: String(props.memberCount) })
  }

  if (props.format) {
    items.push({ label: 'Format', value: props.format })
  }

  if (props.sourceFile) {
    items.push({ label: 'Source', value: props.sourceFile })
  }

  return items
})
</script>

<template>
  <div class="reference-sidebar">
    <div class="sidebar-section">
      <h5 class="sidebar-heading">Page Info</h5>
      <MetadataCard :items="metadataItems" />
    </div>

    <div v-if="description" class="sidebar-section">
      <h5 class="sidebar-heading">Description</h5>
      <p class="sidebar-description">{{ description }}</p>
    </div>

    <div v-if="relatedItems && relatedItems.length > 0" class="sidebar-section">
      <h5 class="sidebar-heading">Related</h5>
      <div class="sidebar-links">
        <a
          v-for="item in relatedItems"
          :key="item.link"
          :href="item.link"
          class="sidebar-link"
        >
          <span class="link-type">{{ item.type }}</span>
          <span class="link-arrow">&rarr;</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reference-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 8px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-heading {
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.sidebar-description {
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin: 0;
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: background var(--sniper-duration) var(--sniper-ease);
}

.sidebar-link:hover {
  background: var(--vp-c-bg-soft);
}

.link-type {
  text-transform: capitalize;
}

.link-arrow {
  color: var(--vp-c-text-3);
  font-size: 14px;
  transition: transform var(--sniper-duration) var(--sniper-ease);
}

.sidebar-link:hover .link-arrow {
  transform: translateX(2px);
  color: var(--vp-c-brand-1);
}
</style>
