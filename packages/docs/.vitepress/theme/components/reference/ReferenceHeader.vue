<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  pageType: string
  title: string
  phase?: string
  layer?: string
  gateMode?: string
}>()

const typeLabels: Record<string, string> = {
  command: 'Command',
  persona: 'Persona',
  team: 'Team',
  checklist: 'Checklist',
  template: 'Template',
  workflow: 'Workflow',
}

const typeColors: Record<string, string> = {
  command: '#6366f1',
  persona: '#8b5cf6',
  team: '#10b981',
  checklist: '#f97316',
  template: '#3b82f6',
  workflow: '#ec4899',
}

const layerColors: Record<string, string> = {
  process: '#3b82f6',
  cognitive: '#8b5cf6',
  technical: '#10b981',
  domain: '#f59e0b',
}

const breadcrumbs = computed(() => {
  const crumbs = [{ label: 'Reference', link: '/reference/commands/' }]
  const section = props.pageType === 'persona'
    ? 'Personas'
    : `${typeLabels[props.pageType] || props.pageType}s`
  crumbs.push({
    label: section,
    link: `/reference/${props.pageType === 'persona' ? 'personas' : props.pageType + 's'}/`,
  })
  return crumbs
})

const badgeColor = computed(() => typeColors[props.pageType] || '#6b7280')
const layerColor = computed(() => props.layer ? layerColors[props.layer] || '#6b7280' : null)
</script>

<template>
  <div class="reference-header">
    <nav class="breadcrumbs">
      <template v-for="(crumb, i) in breadcrumbs" :key="crumb.label">
        <a :href="crumb.link" class="breadcrumb-link">{{ crumb.label }}</a>
        <span class="breadcrumb-sep">/</span>
      </template>
      <span class="breadcrumb-current">{{ title }}</span>
    </nav>
    <div class="header-badges">
      <span class="type-badge" :style="{ backgroundColor: badgeColor }">
        {{ typeLabels[pageType] || pageType }}
      </span>
      <span v-if="layer" class="layer-badge" :style="{ backgroundColor: layerColor }">
        {{ layer }} layer
      </span>
      <span v-if="phase" class="phase-badge">
        {{ phase }}
      </span>
      <span v-if="gateMode" :class="['gate-badge', `gate-${gateMode}`]">
        {{ gateMode }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.reference-header {
  margin-bottom: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.breadcrumb-link {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color var(--sniper-duration) var(--sniper-ease);
}

.breadcrumb-link:hover {
  color: var(--vp-c-brand-1);
}

.breadcrumb-sep {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.breadcrumb-current {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.header-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 2px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.layer-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  padding: 2px 10px;
  border-radius: 9999px;
  text-transform: capitalize;
}

.phase-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-mute);
  padding: 2px 10px;
  border-radius: 9999px;
}

.gate-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.gate-strict {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.gate-flexible {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}

.gate-auto {
  background: var(--vp-c-tip-soft);
  color: var(--vp-c-tip-1);
}

.gate-none {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}
</style>
