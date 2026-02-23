<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value: string; badge?: boolean; badgeClass?: string }>
}>()
</script>

<template>
  <div class="metadata-card">
    <div v-for="item in items" :key="item.label" class="metadata-row">
      <span class="metadata-label">{{ item.label }}</span>
      <span v-if="item.badge" class="metadata-value">
        <span :class="['metadata-badge', item.badgeClass]">{{ item.value }}</span>
      </span>
      <span v-else class="metadata-value">{{ item.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.metadata-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg-soft);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metadata-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.metadata-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metadata-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.metadata-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.metadata-badge.badge-brand {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.metadata-badge.badge-danger {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.metadata-badge.badge-warning {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

.metadata-badge.badge-tip {
  background: var(--vp-c-tip-soft);
  color: var(--vp-c-tip-1);
}

.metadata-badge.badge-muted {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
}
</style>
